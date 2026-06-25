# Internals

> Read from the source at commit `58d137d`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/manager/main.go` | Controller-manager entry point; builds the Manager, registers reconcilers and webhooks (`:99`) |
| `pkg/apis/serving/v1beta1` | `InferenceService`, `PredictorSpec`, `ComponentExtensionSpec`, status types |
| `pkg/apis/serving/v1alpha1` | `ServingRuntime`, `InferenceGraph`, `TrainedModel`, `LLMInferenceService` |
| `pkg/controller/v1beta1/inferenceservice` | The isvc reconcile loop and component reconcilers |
| `pkg/webhook/admission/pod` | Pod mutating webhook and storage-initializer injection |
| `pkg/constants/constants.go` | Deployment modes and defaults (`:547`) |
| `python/kserve/kserve` | Python data-plane model servers (V1/V2 protocol) |

## Core data structures

- `InferenceService` / `InferenceServiceSpec` (`pkg/apis/serving/v1beta1/inference_service.go:147`, `:24`). `Predictor PredictorSpec` is required; `Transformer` and `Explainer` are optional pointers (`:27`, `:31`, `:35`). `Status` carries `+kubebuilder:pruning:PreserveUnknownFields`.
- `ComponentExtensionSpec` (`pkg/apis/serving/v1beta1/component.go:82`). The shared scaling and ops knobs for every component: `MinReplicas *int32` where 0 means scale-to-zero (`:85`), `MaxReplicas` (`:88`), `ScaleMetric` (`:98`), and `CanaryTrafficPercent` (`:114`).
- `ServingRuntimeSpec` and `SupportedModelFormat` (`pkg/apis/serving/v1alpha1/servingruntime_types.go:128`, `:31`). `SupportedModelFormats[].Name/Version/AutoSelect/Priority` drive runtime auto-selection.
- `InferenceServiceStatus` (`pkg/apis/serving/v1beta1/inference_service_status.go:34`). Inlines Knative's `duckv1.Status` (`:42`) for conditions.
- `DeploymentModeType` (`pkg/constants/constants.go:547`). `Standard` / `Knative` / `ModelMesh` plus legacy aliases; the axis the whole reconcile branches on.

## A path worth tracing

Deployment-mode resolution is the branch everything downstream depends on. `ParseDeploymentMode` normalizes legacy names before any reconcile decision:

```go
// pkg/constants/constants.go:559
func ParseDeploymentMode(mode string) DeploymentModeType {
    if mode == "" {
        return DefaultDeployment
    }
    deploymentMode := DeploymentModeType(mode)
    switch deploymentMode {
    case LegacyRawDeployment:
        return Standard
    case LegacyServerless:
        return Knative
    default:
        return deploymentMode
    }
}
```

`DefaultDeployment = Standard` (`constants.go:554`), so an `isvc` with no mode annotation lands on plain Kubernetes. In the reconcile loop, the resolved mode reaches `Predictor.Reconcile`, which branches at `predictor.go:204`:

```text
Predictor.Reconcile (predictor.go:85)
  -> if p.deploymentMode == constants.Standard (predictor.go:204)
       -> reconcileRawDeployment (predictor.go:744)
            -> raw.NewRawKubeReconciler  => Deployment + Service + HPA (predictor.go:771)
  -> else (Knative)
       -> knative.NewKsvcReconciler      => Knative Service (predictor.go:836)
```

## Things that surprised me

The model never ships inside the server image. The pod mutating webhook does the heavy lifting: `Mutator.Handle` (`pkg/webhook/admission/pod/mutator.go:46`) calls `InjectStorageInitializer` (`mutator.go:133`), and `StorageInitializerInjector.InjectStorageInitializer` (`pkg/webhook/admission/pod/storage_initializer_injector.go:668`) appends an init container with `params.PodSpec.InitContainers = append(...)` (`:441`, `:499`). The init container downloads from `storageUri` into an `emptyDir` mounted at `/mnt/models` (`:483`, comment: `Pvc will be mount to /mnt/models rather than /mnt/pvc.`), which the model container then reads. The serving runtime stays model-agnostic.

The other surprise is the Knative legacy in the status type. Even in `Standard` mode the status inlines `duckv1.Status` (`inference_service_status.go:42`), a Knative condition duck type carried over from KFServing. The cross-component aggregation via `PropagateCrossComponentStatus` (`controller.go:339-340`) only fires in Knative mode.

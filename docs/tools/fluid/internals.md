# Internals

> Read from the source at commit `25531595`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/` | One `main` per binary: `dataset`, per-engine runtime controllers, `csi`, `webhook`, `fluidapp`. |
| `api/v1alpha1/` | CRD types: `Dataset`, the `Runtime` variants, and data-operation CRDs. |
| `pkg/ddc/base/` | The engine abstraction: `Engine`, `Implement`, and `TemplateEngine`. |
| `pkg/ddc/alluxio`, `pkg/ddc/juicefs`, `pkg/ddc/jindocache` | Concrete engine implementations. |
| `pkg/ddc/factory.go` | Selects an engine implementation from runtime type. |
| `pkg/controllers/` | Shared reconcile core (`runtime_controller.go`) and per-engine controllers. |
| `pkg/ctrl/` | Helpers for master, worker, fuse, and affinity. |
| `pkg/csi/plugins/` | CSI node server that mounts the cache into Pods. |
| `pkg/utils/helm/` | Wrapper that shells out to the `ddc-helm` binary. |
| `charts/` | Bundled Helm charts per engine. |

## Core data structures

- `Dataset` (`api/v1alpha1/dataset_types.go:301`) with its `DatasetSpec` and `DatasetStatus`. The spec carries `Mounts`, node affinity, and runtime references; the status holds `phase`, `cacheStates`, and an `OperationRef` map used as a mutual-exclusion lock so two same-kind data operations cannot run on one dataset at once.
- `DatasetPhase` constants (`api/v1alpha1/dataset_types.go:36`): `Bound`, `Failed`, `NotBound`, `Updating`, `DataMigrating`, plus empty and pending. This is the state machine the reconcile loop drives.
- `Mount` (`api/v1alpha1/dataset_types.go:80`): a single under-file-system mount point, with options and `EncryptOptions` that pass credentials by Secret reference.
- `base.Engine` and `base.Implement` (`pkg/ddc/base/engine.go:32` and `:69`): the coarse engine API and the fine-grained steps `TemplateEngine` calls. Adding an engine means satisfying `Implement`.
- `cruntime.ReconcileRequestContext` (`pkg/runtime/context.go:31`): one reconcile pass bundled into a single struct. It embeds `context.Context`, `NamespacedName`, `Category`, the `*Dataset`, and the `client.Client`, and carries `EngineImpl` so one runtime kind can dispatch to different engine implementations.
- `common.CacheStateList` (`pkg/common/types.go:34`): a `map[CacheStateName]string` holding `cached`, `cacheCapacity`, `cachedPercentage`, and `cacheHitRatio` as strings, surfaced in the dataset status.

## A path worth tracing

Follow "create an `AlluxioRuntime`, get a `Bound` dataset and a running cache".

The shared core decides what to do each pass. `ReconcileRuntime` runs validate, then setup, and requeues if setup is incomplete:

```go
if !utils.IsSetupDone(ctx.Dataset) {
    ready, err := engine.Setup(ctx)
    // ...
    if !ready {
        return utils.RequeueAfterInterval(time.Duration(20 * time.Second))
    }
}
```

`TemplateEngine.Setup` (`pkg/ddc/base/setup.go:25`) calls the engine's steps in order. The Alluxio master step lands in `setupMasterInternal` (`pkg/ddc/alluxio/master_internal.go:32`), which renders a Helm values file from the runtime, checks whether the release exists, and installs it if not:

```go
chartName := utils.GetChartsDirectory() + "/" + common.AlluxioChart
// ... generate values, check release ...
return helm.InstallRelease(e.name, e.namespace, valueFileName, chartName)
```

`helm.InstallRelease` (`pkg/utils/helm/utils.go:44`) builds an `install` argument list and runs the external binary, capturing combined output and rolling back on failure (`pkg/utils/helm/utils.go:82`). Once workers are ready, `BindToDataset` sets `status.phase` to `Bound`, and `engine.Sync` periodically refreshes `status.cacheStates`.

## Things that surprised me

The cache infrastructure is not deployed by the Go Kubernetes client at all. The whole master/worker/FUSE topology is delegated to Helm: `var helmCmd = []string{"ddc-helm"}` (`pkg/utils/helm/utils.go:41`) and the controller `exec`s that binary with `install -f <values> --namespace <ns> <name> <chart>` (`pkg/utils/helm/utils.go:60`). So a controller that looks like a typical operator is, at the critical hop, a wrapper around a renamed Helm CLI. That choice keeps engine manifests in charts and makes new engines cheap, but it means the runtime environment must ship `ddc-helm`, and Fluid has to parse Helm's text output and implement its own rollback when an install fails.

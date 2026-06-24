# Internals

> Read from the source at commit `c5b577c`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `apis/keda/v1alpha1/` | CRD types: ScaledObject, ScaledJob, ScaleTriggers, TriggerAuthentication |
| `controllers/keda/` | Reconcilers for each CRD and HPA management |
| `pkg/scaling/` | Scale handler, executor, scalers cache, resolver, modifiers |
| `pkg/scalers/` | The 70+ individual scaler implementations |
| `pkg/provider/` | External Metrics provider used by the adapter |
| `pkg/metricsservice/` | gRPC between operator and adapter |
| `cmd/` | Entry points for operator, adapter, and webhooks |

## Core data structures

- `ScaledObject` / `ScaledObjectSpec` ([2], `apis/keda/v1alpha1/scaledobject_types.go:45` and `:102`). The spec carries `IdleReplicaCount` (`:115`), `MinReplicaCount` (`:118`), `MaxReplicaCount` (`:121`), and `Triggers []ScaleTriggers` (`:126`).
- `ScaleTriggers` ([2], `apis/keda/v1alpha1/scaletriggers_types.go:28`): `Type` (`:30`), `UseCachedMetrics` (`:34`), `Metadata map[string]string` (`:36`), `AuthenticationRef` (`:38`), and `MetricType` (`:40`). One ScaledObject can hold many triggers.
- `Scaler` interface ([2], `pkg/scalers/scaler.go:44`): `GetMetricsAndActivity`, `GetMetricSpecForScaling`, `Close`. `PushScaler` ([2], `pkg/scalers/scaler.go:57`) adds `Run(ctx, active chan<- bool)` for push-based sources. Every scaler satisfies this contract.
- `ScalersCache` ([2], `pkg/scaling/cache/scalers_cache.go:43`): per-ScaledObject scaler set, generation tracking, and a `CompiledFormula` for scaling modifiers. `ScalerBuilder` ([2], `pkg/scaling/cache/scalers_cache.go:92`) holds the scaler, its config, and a `Factory` for regeneration.
- `TriggerAuthenticationSpec` ([2], `apis/keda/v1alpha1/triggerauthentication_types.go:75`): the resolution sources for credentials (Pod Identity, secret target ref, Vault, Azure Key Vault).

## A path worth tracing

The 0-to-1 / idle decision lives in `scaleExecutor.RequestScale` ([2], `pkg/scaling/executor/scale_scaledobjects.go:40`). When triggers are active it can scale up from zero or idle; when they are inactive it branches across fallback, idle, and minimum-replica cases ([2], `pkg/scaling/executor/scale_scaledobjects.go:73-117`). The comments in that block spell out a subtlety: with `minReplicas=0` and a defined fallback, scaling the target to 0 would stop the HPA from ever applying the fallback replicas, so that combination is handled separately rather than falling through to the scale-to-zero case.

```text
Reconcile (scaledobject_controller.go:155)
  -> reconcileScaledObject (:231)
     -> ensureHPAForScaledObjectExists (:301)
     -> requestScaleLoop (:318)
        -> RequestScale (scale_scaledobjects.go:40)
           active   -> scaleFromZeroOrIdle
           inactive -> scaleToZeroOrIdle / fallback / set minReplicas
```

## Things that surprised me

`ScalersCache.acquireReader` ([2], `pkg/scaling/cache/scalers_cache.go:59`) carries a `ReaderDrainBudget`. A reader normally reserves an `activeReaders` slot and releases it on defer. But scalers call into third-party SDKs that may ignore `ctx` and hang. To stop a stuck reader from blocking `cache.Close()` forever, the function arms a `time.AfterFunc` timer that force-releases the slot once the budget elapses, keeping `activeReaders.Wait()` bounded. When the budget is `<= 0` the slot is held until the real release runs. This defensive timer is invisible from the API surface and only shows up when you read the cache code.

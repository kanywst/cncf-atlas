# Internals

> Read from the source at commit `439d98db`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `main.go` | kruise-manager entry point: webhook setup, then controllers. |
| `cmd/daemon/main.go` | kruise-daemon entry point (`NewDaemon`). |
| `apis/apps/{v1alpha1,v1beta1,pub,defaults}` | CRD types, shared in-place types, defaults. |
| `apis/policy` | `policy.kruise.io` types (e.g. PodUnavailableBudget). |
| `pkg/controller/<crd>` | one controller per CRD. |
| `pkg/util/inplaceupdate` | the shared in-place update engine. |
| `pkg/webhook/pod/mutating` | Pod mutating webhook, including readiness-gate injection. |
| `pkg/daemon/{criruntime,kuberuntime,imagepuller,containermeta,containerrecreate,podprobe}` | per-node runtime work. |

## Core data structures

- `CloneSetSpec` / `CloneSetUpdateStrategy` / `CloneSetStatus` (`apis/apps/v1beta1/cloneset_types.go:41`, `:177`, `:202`): a Deployment-like spec plus `volumeClaimTemplates`, an `UpdateStrategy.PodUpdatePolicy` of `Recreate`, `InPlaceIfPossible`, or `InPlaceOnly`, and partition-based canary.
- `UpdateSpec` (`pkg/util/inplaceupdate/inplace_update.go:86`): the computed diff that in-place applies. It carries `ContainerImages map[string]string`, `ContainerResources`, `ContainerRefMetadata`, `MetaDataPatch`, `GraceSeconds`, and the old and new templates. `VerticalUpdateOnly()` reports whether only resources change.
- `InPlaceUpdateState` (`apis/apps/pub/inplace_update.go:52`): the update state burned into a Pod annotation. It records the `Revision`, `LastContainerStatuses` (the pre-update imageID, the baseline for completion), `NextContainerImages` / `NextContainerResources` (the next batch in launch-priority order), and `ContainerBatchesRecord`. Completion is decided by comparing the recorded `ImageID` against the current runtime status.
- `UpdateOptions` (`pkg/util/inplaceupdate/inplace_update.go:64`): a set of swappable functions (`CalculateSpec`, `PatchSpecToPod`, `CheckPodNeedsBeUnready`, `CheckContainersUpdateCompleted`). CloneSet, Advanced StatefulSet, and Advanced DaemonSet share one engine and vary behaviour through these hooks.
- `inplaceupdate.Interface` (`pkg/util/inplaceupdate/inplace_update.go:79`): the three methods `CanUpdateInPlace`, `Update`, and `Refresh`, held by each workload controller.

## A path worth tracing

Follow one rolling in-place update of a CloneSet from the reconciler to the apiserver patch.

`Reconcile` simply forwards to the stored reconcile function (`pkg/controller/cloneset/cloneset_controller.go:198-200`):

```go
func (r *ReconcileCloneSet) Reconcile(_ context.Context, request reconcile.Request) (reconcile.Result, error) {
    return r.reconcileFunc(request)
}
```

`doReconcile` fetches the CloneSet, checks scale expectations, claims Pods and PVCs, and resolves the current and update ControllerRevisions. When the revision changed it creates ImagePullJobs so the daemon pre-pulls the new image. Then `syncCloneSet` (`cloneset_controller.go:403`) runs scale, then update.

`realControl.Update` (`pkg/controller/cloneset/sync/cloneset_update.go:47`) iterates update targets through `updatePod` (`cloneset_update.go:254`). When the policy allows in-place and the Pod can take it, it calls into the shared engine (`cloneset_update.go:306`):

```go
res := c.inplaceControl.Update(pod, oldRevision, updateRevision, opts)
```

If in-place is impossible but the policy is `InPlaceOnly`, it refuses rather than recreating (`cloneset_update.go:319-320`):

```go
return 0, fmt.Errorf("find Pod %s update strategy is InPlaceOnly but can not update in-place", pod.Name)
```

Inside the engine, `realControl.Update` (`pkg/util/inplaceupdate/inplace_update.go:313`) computes the `UpdateSpec`. If the diff is not confined to image (and resources), the spec is nil and in-place is impossible. When `CheckPodNeedsBeUnready` is true it flips `InPlaceUpdateReady` to `ConditionFalse` to drop the readiness gate, with conflict retry. Then it calls `updatePodInPlace` (`inplace_update.go:350`, defined at `:362`).

`updatePodInPlace` re-fetches the latest Pod inside a conflict-retry loop, writes the revision hash, and records `InPlaceUpdateState` as JSON in the `apps.kruise.io/inplace-update-state` annotation. With `grace == 0` it patches the spec via `PatchSpecToPod` and writes back to the apiserver:

```go
clone, expectedResources, err = opts.PatchSpecToPod(clone, spec, &inPlaceUpdateState)
```

A resource change is applied as a strategic merge patch to the `/resize` subresource (`inplace_update.go:402`):

```go
_, err := adp.PatchPodResource(cloneCopy, client.RawPatch(types.StrategicMergePatchType, patchResources))
```

With `grace > 0` the spec is stored in the `inplace-update-grace` annotation and applied after the grace window (`inplace_update.go:411-413`). After the kubelet restarts the container, `kruise-daemon`'s `containermeta` reports the real running image, and `Refresh` uses `CheckContainersUpdateCompleted` to decide the update is done and restore the readiness gate.

## Things that surprised me

The completion check does not trust kubelet container status directly. The engine records the pre-update imageID in `LastContainerStatuses` and waits for the per-node daemon to report a different real imageID from the runtime. Without `kruise-daemon` running on a node, in-place updates on that node cannot be confirmed complete.

Launch priority turns one in-place update into batches. When containers have different launch priorities, the engine does not patch them all at once; it stages the remaining images in `NextContainerImages`, gates each batch behind `PreCheckBeforeNext`, and only then applies the next batch. A single image rollout can therefore proceed in ordered waves inside one Pod.

The grace period is not a controller-side sleep. The intended spec is written to an annotation and applied later, so the delay survives controller restarts rather than living in process memory.

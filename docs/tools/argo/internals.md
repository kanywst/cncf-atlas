# Internals

> Read from the source at commit `8f6d4e1`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `controller/` | application-controller: reconcile loop, state comparison, sync execution |
| `reposerver/` | manifest generation from Git, Helm, Kustomize, OCI |
| `server/` | api-server: gRPC/REST, auth, RBAC, UI serving |
| `gitops-engine/` | vendored diff and sync library, wired as a local module (`go.mod:374`) |
| `applicationset/` | ApplicationSet controller for templating Applications |
| `pkg/apis/application/v1alpha1/` | the `Application` and `AppProject` API types |
| `cmd/main.go` | multi-call binary entry point (`cmd/main.go:1`) |

## Core data structures

- `Application` (`pkg/apis/application/v1alpha1/types.go:68`) is the object the whole controller turns on. Its `Spec` carries source(s), destination, and `syncPolicy`; `Status` (`pkg/apis/application/v1alpha1/types.go:1213`) holds sync state, health, and the managed resource list.
- `SyncPolicy` (`pkg/apis/application/v1alpha1/types.go:1518`) gates whether and how auto-sync runs. `SyncStatus` (`pkg/apis/application/v1alpha1/types.go:1942`) records the observed live versus desired comparison.
- `comparisonResult` (`controller/state.go:82`) is the return value of a reconcile. It bundles `syncStatus`, `healthStatus`, `resources`, the gitops-engine `reconciliationResult`, the `diffResultList`, the pre/post-delete-hook flags, and `revisionsMayHaveChanges`.
- `CompareWith` (`controller/appcontroller.go:88`) is the comparison-level enum: `CompareWithLatestForceResolve=3`, `CompareWithLatest=2`, `CompareWithRecent=1`, `ComparisonWithNothing=0`.
- `ReconciliationResult` (`gitops-engine/pkg/sync/reconcile.go:65`) is the diff input: target and live objects paired by index, plus hooks.

## A path worth tracing

The reconcile decision lives in `processAppRefreshQueueItem` (`controller/appcontroller.go:1728`). The level returned by `needRefreshAppStatus` (`controller/appcontroller.go:1761`) decides how much work happens.

```text
processAppRefreshQueueItem            controller/appcontroller.go:1728
  needRefreshAppStatus -> level       controller/appcontroller.go:1761
  if level == ComparisonWithNothing:  controller/appcontroller.go:1797
      rebuild tree from cache; return (no repo-server call)
  CompareAppState(...)                controller/appcontroller.go:1876
      GetRepoObjs (repo-server)       controller/state.go:694
      GetManagedLiveObjs (cluster)    controller/state.go:773
      argodiff.StateDiffs(...)        controller/state.go:917
  autoSync(...) if OutOfSync          controller/appcontroller.go:1908
```

The short-circuit at the top is the interesting branch:

```go
if comparisonLevel == ComparisonWithNothing {
    // ... GetAppManagedResources from cache, rebuild the tree, persist, return
}
```

When the level is `ComparisonWithNothing` the controller never touches the repo-server. It loads cached managed resources, recomputes the resource tree, persists status, and returns (`controller/appcontroller.go:1797`). A full comparison only happens when the level is `CompareWithRecent` or higher, and only `CompareWithLatest` fetches the latest Git revision.

## Things that surprised me

The non-obvious design is the comparison-level ladder. Reading the marketing you would assume "reconcile" means a full Git-to-cluster diff every cycle. It does not. Manifest generation in the repo-server is the most expensive operation, so the controller stages its work: `ComparisonWithNothing` rebuilds only the resource tree from cache with no repo-server call (`controller/appcontroller.go:1797`), `CompareWithRecent` reuses the last synced revision, and only `CompareWithLatest` pulls the newest Git state (`controller/appcontroller.go:88`). At thousands of Applications this is what keeps the repo-server from melting.

Two more details only the code reveals. First, transient Git errors are absorbed by a grace-period cache: within `repoErrorGracePeriod` the controller returns `ErrCompareStateRepo` and keeps the prior state instead of flipping to OutOfSync (`controller/state.go:699`). Second, live state is read from a per-cluster shared watch cache via `GetManagedLiveObjs` (`controller/state.go:773`), so the controller does not list the API server on every reconcile.

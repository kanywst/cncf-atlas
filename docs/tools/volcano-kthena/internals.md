# Internals

> Read from the source at commit `affd5be`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/kthena-router` | Data plane binary, the gin-based L7 router (`cmd/kthena-router/main.go:40`) |
| `cmd/kthena-controller-manager` | Control plane binary, CRD reconcile plus webhook server (`cmd/kthena-controller-manager/main.go:54`) |
| `pkg/kthena-router/router` | Request handling, matching, proxying (`router.go:210`) |
| `pkg/kthena-router/scheduler` | Pod scoring and selection (`scheduler_impl.go:119`) |
| `pkg/kthena-router/scheduler/plugins` | Score and filter plugins, including prefix cache (`prefix_cache.go:162`) |
| `pkg/kthena-router/datastore` | Runtime view of backend pods (`store.go:282`) |
| `pkg/kthena-router/connectors` | KV-transfer connectors for PD disaggregation (NIXL, MoonCake, SGLang) |
| `pkg/model-serving-controller/controller` | ModelServing reconcile and PodGroup management (`model_serving_controller.go:72`) |
| `pkg/apis/workload/v1alpha1` | Workload CRDs (`ModelServing`, `ServingGroup`, `ModelBooster`) |
| `pkg/apis/networking/v1alpha1` | Networking CRDs (`ModelRoute`, `ModelServer`) |

## Core data structures

- **`datastore.PodInfo`** (`pkg/kthena-router/datastore/store.go:282`): the router's runtime view of each backend pod. It holds `GPUCacheUsage`, `RequestWaitingNum`, `RequestRunningNum`, `TTFT` and `TPOT` histograms, an `onFlightRequestNum atomic.Int64` (`store.go:300`) kept in sync across routers through Redis, and a `models sets.Set[string]` (base plus LoRA). A `sync.RWMutex` guards it. Every scheduler plugin scores this struct.
- **`framework.Context`** (`pkg/kthena-router/scheduler/framework`, `:29`): the per-request scheduling context. It carries `Model`, `Prompt`, `Hashes []uint64` (prefix block hashes), `ModelServerName`, `PDGroup`, `DecodePods`, `PrefillPods`, and `BestPods`. Which fields are used depends on whether the request is PD-disaggregated or aggregated.
- **`ServingGroup`, `Role`, `GangPolicy`** (`pkg/apis/workload/v1alpha1/servinggroup_types.go:110`, `:55`, `:25`): the gang unit. A `Role` has an `EntryTemplate` (exactly one entry pod) plus a `WorkerTemplate` and `WorkerReplicas` (`servinggroup_types.go:69-79`). `GangPolicy.MinRoleReplicas map[string]int32` (`servinggroup_types.go:42`) sets the gang minimum per role, for example prefill:1 and decode:1. `NetworkTopology` (`servinggroup_types.go:46`) embeds Volcano's `NetworkTopologySpec`.
- **`ModelServingSpec`** (`pkg/apis/workload/v1alpha1/model_serving_types.go:36`): `Replicas` (number of ServingGroups), `SchedulerName` (default `volcano`, `model_serving_types.go:47`), `Template`, `RolloutStrategy`, `RecoveryPolicy`, and a `Plugins []PluginSpec` chain.
- **`ModelBooster` / `ModelBackend`** (`pkg/apis/workload/v1alpha1/model_booster_types.go:200`, `:51`): the top-level "one CR serves one model" abstraction. `Backend.Type` is vLLM or vLLMDisaggregated, `ModelURI` accepts only `hf://`, `s3://`, `pvc://`, or `ms://` (`model_booster_types.go:59`), and `CacheURI` accepts `hostpath://` or `pvc://`.

## A path worth tracing

The scheduler scoring loop is the heart of the router. `SchedulerImpl.Schedule` (`pkg/kthena-router/scheduler/scheduler_impl.go:119`) filters pods, then branches on PD disaggregation:

```go
// scheduler_impl.go:119
func (s *SchedulerImpl) Schedule(ctx *framework.Context, pods []*datastore.PodInfo) error {
    if s.syncOnFlight {
        s.store.SyncOnFlightCounts() // pull cross-router in-flight counts from Redis
    }
    pods, err := s.RunFilterPlugins(pods, ctx) // drop ineligible pods
    // ...
    if ctx.PDGroup != nil { // PD disaggregated: score decode pods, take top N, map each to its prefill
        decodePods, _ := s.store.GetDecodePods(ctx.ModelServerName)
        scores := s.RunScorePlugins(decodePods, ctx)
        topNDecodePods := TopNPodInfos(scores, topN)
        // ... s.store.GetPrefillPodsForDecodeGroup(ctx.ModelServerName, decodePodName) ...
    }
    scores := s.RunScorePlugins(pods, ctx) // PD aggregated: score normally
    ctx.BestPods = TopNPodInfos(scores, topN)
}
```

The defaults are three score plugins, each weight 1: `least-request`, `least-latency`, `prefix-cache` (`scheduler_impl.go:68-72`), and one filter plugin, `least-request` (`scheduler_impl.go:73-75`). Default plugin arguments are hardcoded in the same file (`scheduler_impl.go:76-80`), for example prefix-cache uses `blockSizeToHash: 64, maxBlocksToMatch: 128, maxHashCacheSize: 50000, topKMatches: 5`. Each plugin returns a score in `[0,100]`; `RunScorePlugins` (`scheduler_impl.go:211`) sums `score * weight` per pod, and `TopNPodInfos` (`scheduler_impl.go:255`) sorts descending and returns the top `topN`.

The `prefix-cache` plugin (`pkg/kthena-router/scheduler/plugins/prefix_cache.go:162`) hashes the prompt in `blockSizeToHash` blocks via `hashPrompt` (`prefix_cache.go:208`), then asks `ModelPrefixStore.FindTopMatches` (`pkg/kthena-router/scheduler/plugins/cache/prefix_store.go:141`) which pods hold the longest matching prefix. That store is sharded (`prefix_store.go:63`) and LRU-backed, and is cleaned on pod deletion (`prefix_store.go:97`) and hash eviction (`prefix_store.go:235`).

On the control plane, gang scheduling is delegated through a `PodGroupManager` interface (`pkg/model-serving-controller/controller/model_serving_controller.go:72`) whose implementation is built with the Volcano client (`model_serving_controller.go:194`). When the NetworkTopology is removed, the controller cleans up the PodGroup (`model_serving_controller.go:282`).

## Things that surprised me

- KV-cache locality is estimated outside the engine. The router's L7 scoring layer maintains a sharded LRU prefix store to guess which pod already holds a prompt's prefix, rather than relying on the engine to report it (`prefix_cache.go`, `prefix_store.go`).
- In-flight request counts are shared across router replicas through Redis. `PodInfo.onFlightRequestNum` is an atomic int that `SyncOnFlightCounts` refreshes from Redis before scoring when `least-request` is active (`scheduler_impl.go:121-123`, `store.go:300`).
- For PD-disaggregated requests, decode and prefill pods are pre-categorized in the datastore so a chosen decode pod resolves to its prefill group in O(1) via `GetDecodePods` and `GetPrefillPodsForDecodeGroup`, instead of re-scoring both sides.

# Internals

> Read from the source at commit `8c64324b`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/` | Thin entry binaries that delegate to Cobra commands (apiserver, scheduler, controller-manager, kubelet, kubectl) |
| `pkg/scheduler` | The scheduler: queue, cache, framework, and the per-Pod scheduling cycle |
| `pkg/kubelet` | The node agent that runs assigned Pods through the CRI |
| `pkg/controller` | Built-in controllers reconciling higher level objects |
| `pkg/controlplane`, `pkg/kubeapiserver` | API server assembly and storage wiring |
| `staging/src/k8s.io/*` | Libraries published as standalone modules (`k8s.io/api`, `k8s.io/client-go`, `k8s.io/apimachinery`) |

## Core data structures

The `Scheduler` struct holds the scheduling state: the node and Pod cache, the scheduling queue, the per-Pod profiles, and a swappable `SchedulePod` function ([scheduler.go:68](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/scheduler.go#L68)). Making `SchedulePod` a field on the struct ([scheduler.go:87](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/scheduler.go#L87)) is what lets tests and alternate algorithms replace the core decision.

`QueuedPodInfo` wraps a `PodInfo` with queueing parameters and a Pod signature; it is the unit that sits in the scheduling queue ([types.go:719](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/framework/types.go#L719)). Its `Gated()` method reports whether a gating plugin is still holding the Pod back ([types.go:747](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/framework/types.go#L747)).

`CycleState` is scratch space scoped to a single scheduling cycle. It is backed by a `sync.Map` and tuned for the write-once-read-many pattern plugins use: write in PreFilter or PreScore, read in Filter or Score ([cycle_state.go:28](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/framework/cycle_state.go#L28)).

## A path worth tracing

Scheduling one Pod, all in `pkg/scheduler/schedule_one.go`. `schedulePod` is the decision core: it filters nodes to the feasible set, fails with a `FitError` if none fit, takes the single survivor directly if there is one, and otherwise scores and pops the best ([schedule_one.go:564](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L564)). Filtering itself runs the PreFilter plugins first inside `findNodesThatFitPod` ([schedule_one.go:622](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L622), PreFilter call at [:632](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L632)).

```text
ScheduleOne (:67)
  -> scheduleOnePod (:93)            resolve profile, new CycleState
    -> schedulingCycle (:169)
      -> UpdateSnapshot (:177)
      -> schedulingAlgorithm -> schedulePod (:564)
           findNodesThatFitPod -> RunPreFilterPlugins (:632) -> Filter
           prioritizeNodes -> pop highest score
      -> prepareForBindingCycle (:196)  assume + Reserve + Permit
  -> go runBindingCycle (:141)          async bind
       -> bind (:1142) -> RunBindPlugins -> DefaultBinder.Bind
```

The actual cluster mutation happens in the default binder, which constructs a `v1.Binding` targeting the chosen node and POSTs it to the API server ([default_binder.go:52](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/framework/plugins/defaultbinder/default_binder.go#L52)).

## Things that surprised me

The scheduler does not evaluate every node in a large cluster. `numFeasibleNodesToFind` adaptively shrinks the candidate set ([schedule_one.go:858](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L858)). When `percentageOfNodesToScore` is unset it computes `percentage = 50 - numAllNodes/125`, clamped to a floor ([schedule_one.go:871](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L871)), and never drops below `minFeasibleNodesToFind = 100` ([schedule_one.go:57](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L57)). The bigger the cluster, the smaller the fraction it looks at. Optimal placement is traded for scheduling latency.

The second surprise is the optimistic assume followed by an asynchronous bind ([schedule_one.go:141](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/pkg/scheduler/schedule_one.go#L141)). The Pod is marked placed in the cache before the API server confirms the binding, so the next Pod can be scheduled without waiting on the network round-trip.

# Internals

> Read from the source at commit `0041afa`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/scheduler` | Scheduler binary entry point (`cmd/scheduler/main.go:23`) |
| `cmd/manager` | Manager binary entry point |
| `scheduler/service` | gRPC handlers, v1 (`service_v1.go`) and v2 (`service_v2.go`) |
| `scheduler/scheduling` | Parent selection, retry loop, filtering (`scheduling.go`) |
| `scheduler/scheduling/evaluator` | Parent scoring (`evaluator_default.go`) |
| `scheduler/resource/standard` | Core types: `Task`, `Peer`, `Host` |
| `pkg/graph/dag` | Generic directed acyclic graph (`dag.go`) |
| `pkg/idgen` | Task and peer ID generation (`task_id.go`) |
| `manager` | Config, RBAC, OAuth, database, console |

## Core data structures

`Task` (`scheduler/resource/standard/task.go:107`) is one distribution target. It holds `URL`, `Digest`, `PieceLength`, `TotalPieceCount`, a `Pieces *sync.Map`, a state machine `FSM *fsm.FSM` (`task.go:151`), the peer topology `DAG dag.DAG[*Peer]` (`task.go:157`), and the `BackToSourcePeers` set. It uses `atomic` fields throughout because many peers update one task concurrently.

`Peer` (`scheduler/resource/standard/peer.go:158`) is one download actor on a task. It carries its own `FSM` (`peer.go:189`), a `NeedBackToSource` flag, a `BlockParents` set, and a reference to its `AnnouncePeer` stream.

`Host` (`scheduler/resource/standard/host.go:140`) is a physical or virtual node. Its `Type` (normal or super seed), `Network` (IDC and location), `DisableShared`, and `ConcurrentRegisterCount` are inputs the scheduler reads when scoring.

`dag.DAG[T]` (`pkg/graph/dag/dag.go:50`) is a generic directed acyclic graph with `AddEdge`, `CanAddEdge` (`dag.go:277`), `DeleteVertexInEdges`, and a depth-first search (`dag.go:373`). The scheduler instantiates it as `dag.DAG[*Peer]`.

## A path worth tracing

The core operation is parent scoring: given a child peer and a set of candidate parents, which parents win. `EvaluateParents` (`scheduler/scheduling/evaluator/evaluator_default.go:87`) sorts candidates in descending order of `evaluateParents` (`evaluator_default.go:108`). The scoring formula is stated in the comment at `evaluator_default.go:107`:

```text
TotalScore = LoadQuality*0.6 + IDCAffinity*0.2 + LocationAffinity*0.1 + HostType*0.1
```

Load quality is itself a composite, computed in `calculateLoadQualityScore` (`evaluator_default.go:132`):

```text
LoadQuality = PeakBandwidthUsage*0.5 + BandwidthDuration*0.3 + Concurrency*0.2
```

The weight constants live at `evaluator_default.go:30` onward. Persistent tasks and persistent cache tasks use a different split (IDC affinity 0.7, location affinity 0.3) defined at `evaluator_default.go:55` onward, which favors locality over load for long-lived content.

Candidates reach the evaluator only after filtering. `filterCandidateParents` (`scheduling.go:488`) starts from a random sample (`scheduling.go:497`) and drops candidates in order: the same host as the child (`scheduling.go:514`, prevents pulling from yourself), a normal host with in-degree 0 that is neither downloading nor succeeded (`scheduling.go:528`), a bad parent per `IsBadParent` (`scheduling.go:538`), and any edge that would create a cycle per `CanAddPeerEdge` (`scheduling.go:544`).

## Things that surprised me

The cycle check is not advisory. `CanAddPeerEdge` (`scheduler/resource/standard/task.go:418`) runs a depth-first search to find whether adding the edge would close a loop, and the filter rejects the candidate before it ever reaches the scorer (`scheduling.go:544`). Cycle prevention is a hard precondition of selection.

Task identity is content- and request-aware. `TaskIDV2ByURLBased` (`pkg/idgen/task_id.go:165`) hashes the URL together with piece length, tag, application, filtered query parameters, and revision, so two pulls that differ only in an ignored query parameter still map to the same task and share pieces. A separate `TaskIDV2ByContent` (`task_id.go:181`) keys purely on content for content-addressable cases.

The "normal host with in-degree 0" rejection (`scheduling.go:528`) is a subtle correctness rule: a normal peer that has not started downloading and is not a back-to-source source has nothing to give, so selecting it would assign a child a parent that cannot serve pieces yet.

# Internals

> Read from the source at commit `7110813`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `pkg/scheduler/framework/` | Session, Statement, and the plugin registry: the heart of scheduling |
| `pkg/scheduler/actions/` | `enqueue`, `allocate`, `backfill`, `preempt`, `reclaim`, `gangpreempt`, `gangreclaim`, `shuffle`; registered in `factory.go` |
| `pkg/scheduler/plugins/` | The comparison/predicate/score plugins: `gang`, `drf`, `proportion`, `capacity`, `binpack`, `predicates`, `nodeorder`, `numaaware`, and more |
| `pkg/scheduler/api/` | The scheduler's in-memory domain model, distinct from the CRD types |
| `pkg/scheduler/cache/` | Informer to internal-type conversion and the async bind worker |
| `pkg/controllers/` | CRD reconcilers (job, podgroup, queue, jobflow, cronjob, hypernode, gc) |
| `pkg/webhooks/` | Validating and mutating admission handlers |

## Core data structures

- **`Session`** (`pkg/scheduler/framework/session.go:65`): the full snapshot for one cycle. It holds `Jobs`, `Nodes`, `Queues`, `HyperNodes`, and dozens of function maps (`jobOrderFns`, `predicateFns`, `nodeOrderFns`, `preemptableFns`, `allocatableFns`, `jobReadyFns`, and others) that plugins fill in `OnSessionOpen`. Its lifetime is a single cycle.
- **`JobInfo`** (`pkg/scheduler/api/job_info.go:363`): one PodGroup. It carries `MinAvailable`, a `TaskStatusIndex` (tasks indexed by status), `Allocated`/`TotalRequest`, `SubJobs`, and `NetworkTopology`. The gang min-member check reads this.
- **`TaskInfo`** (`pkg/scheduler/api/job_info.go:118`): one pod. It carries `Resreq`/`InitResreq`, `DRAResreq` (dynamic resource allocation), a `TransactionContext` (the current assigned node and status), `Priority`, `Preemptable`, `BestEffort`, and `SchGated`.
- **`Resource`** (`pkg/scheduler/api/resource_info.go:60`): the quantity model holding CPU, memory, and `ScalarResources` (GPU/NPU and the like). Its `LessEqual` and future-idle comparisons are the basis of every fit decision.
- **`Statement`** (`pkg/scheduler/framework/statement.go`): the list of tentative operations. It records `Allocate` (`:246`), `Pipeline` (`:140`), and `Evict` in memory, then `Commit` (`:392`), `Discard`, or `RecoverOperations` confirms, drops, or restores them. This is the dry-run transaction.

## A path worth tracing

`Statement.Allocate` does not write to the API server. It updates the session's in-memory state and records an operation for later replay.

```go
// pkg/scheduler/framework/statement.go:246
func (s *Statement) Allocate(task *api.TaskInfo, nodeInfo *api.NodeInfo) (err error) {
    // ...
    job.UpdateTaskStatus(task, api.Allocated)   // :262, in-memory only
    // ... node.AddTask(task), then append an "allocate" operation
}
```

The real bind happens only when the action commits the statement, and even then it is queued, not synchronous:

```text
allocate.go:314  if stmt != nil && ssn.JobReady(job) { stmt.Commit() }
statement.go:392 Commit()         -> replays recorded operations
statement.go:317 allocate()       -> cache.AddBindTask(bindContext)   (:319)
cache.go:874     go wait.Until(sc.processBindTask, ...)               (async worker)
cache.go:231     DefaultBinder.Bind(kubeClient, tasks)                -> API server
```

The gang guarantee falls out of the `ssn.JobReady(job)` gate at `allocate.go:314`. The gang plugin registers a `JobReady` that returns true only when the job's allocated task count reaches `MinAvailable`. If it does not, `Commit` never runs and the tentative allocations are dropped, so the cluster never sees a half-placed gang.

## Things that surprised me

- **Almost all scheduling logic is memory-only.** Allocation, pipelining, and eviction mutate session state and append operations; nothing touches the API server until commit, and the bind itself is deferred to the async worker (`pkg/scheduler/cache/cache.go:874`). This makes the scheduler easy to reason about as a pure function of the snapshot.
- **HyperNode search is brute force over clones.** Network-topology placement clones a per-hyperNode worksheet, runs a dry-run allocation, scores it, discards it (`pkg/scheduler/actions/allocate/allocate.go:501`), and recovers only the best result with `RecoverOperations` (`:447`). A TODO in the code notes that the per-task check sequence overlaps with the normal path and should eventually merge (`allocate.go:656`).
- **A nomination fast path exists.** `allocateFromNomination` (`pkg/scheduler/actions/allocate/allocate.go:595`) takes a node that preempt or reclaim already nominated and tries it first, falling back to the normal path if the nomination no longer validates.
- **Preempt and reclaim ship disabled.** The default ConfigMap runs only `enqueue, allocate, backfill` (`pkg/scheduler/util.go:38`), so priority-based eviction is opt-in.

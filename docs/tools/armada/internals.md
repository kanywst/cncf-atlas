# Internals

> Read from the source at commit `85b582d`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/` | One `main.go` per component (server, scheduler, executor, lookout, armadactl, and more). |
| `internal/server/submit/` | The submit API gateway that publishes jobs to Pulsar (`internal/server/submit/submit.go:30-32`). |
| `internal/scheduler/` | The scheduler: main loop, in-memory job database, node database, and scheduling algorithms. |
| `internal/scheduler/jobdb/` | The in-memory transactional `JobDb` and its `Txn` snapshots (`internal/scheduler/jobdb/jobdb.go:68`). |
| `internal/scheduler/nodedb/` | The in-memory `NodeDb` for finding schedulable nodes (`internal/scheduler/nodedb/nodedb.go:77`). |
| `internal/scheduler/scheduling/` | Scheduling algorithms, including DRF fairness, gang scheduling, and preemption. |
| `magefiles/` | The `mage`-based build and local development tasks. |

## Core data structures

- `submit.Server` (`internal/server/submit/submit.go:32`): the submit API gateway. It holds a `publisher`, `queueCache`, `deduplicator`, and `authorizer` and turns submit calls into Pulsar events (`internal/server/submit/submit.go:33-41`).
- `JobDb` (`internal/scheduler/jobdb/jobdb.go:68`): the scheduler's in-memory database. Jobs are multi-indexed using persistent immutable maps and sets from `github.com/benbjohnson/immutable` (`internal/scheduler/jobdb/jobdb.go:7`, `:69-76`). It interns strings to save memory (`internal/scheduler/jobdb/jobdb.go:82-83`) and guards itself with a `copyMutex` and a `writerMutex` (`internal/scheduler/jobdb/jobdb.go:84-86`).
- `Txn` (`internal/scheduler/jobdb/jobdb.go:427`): a snapshot transaction over `JobDb`. It carries `readOnly` and `dryRun` flags plus the root pointer of each index (`internal/scheduler/jobdb/jobdb.go:427-457`).
- `Job` (`internal/scheduler/jobdb/job.go:23`): the scheduler-internal representation of a job.
- `NodeDb` (`internal/scheduler/nodedb/nodedb.go:77`): holds nodes in a hashicorp `go-memdb` in-memory database (`internal/scheduler/nodedb/nodedb.go:79`) and indexes them so a pod's schedulable nodes can be found efficiently (`internal/scheduler/nodedb/nodedb.go:76`).
- `DominantResourceFairness` (`internal/scheduler/scheduling/fairness/fairness.go:34`): the DRF (Dominant Resource Fairness) cost provider. It implements `UnweightedCostFromAllocation` and `WeightedCostFromAllocation` to turn an allocation into a cost (`internal/scheduler/scheduling/fairness/fairness.go:30-31`), and is built with `NewDominantResourceFairness(totalResources, pool, config)` (`internal/scheduler/scheduling/fairness/fairness.go:43`).

The `Txn` doc comment states the invariant the whole scheduler relies on:

```go
// Txn is a JobDb Transaction. Transactions provide a consistent view of the database, allowing readers to
// perform multiple actions without the database changing from underneath them.
// Write transactions also allow callers to perform write operations that will not be visible to other users
// until the transaction is committed.
```

## A path worth tracing

The interesting path is the `JobDb` transaction model. The scheduler treats PostgreSQL as the durable source of truth but makes scheduling decisions against an in-memory copy of every job, structured as a persistent immutable data structure (`internal/scheduler/jobdb/jobdb.go:68-76`). The transaction types implement snapshot isolation on top of that.

A read transaction takes `copyMutex` only long enough to share the current root pointers, then hands back a read-only snapshot:

```go
// ReadTxn returns a read-only transaction.
// Multiple read-only transactions can access the db concurrently
func (jobDb *JobDb) ReadTxn() *Txn {
    jobDb.copyMutex.Lock()
    defer jobDb.copyMutex.Unlock()
    return &Txn{
        readOnly:           true,
        jobsById:           jobDb.jobsById,
        jobsByRunId:        jobDb.jobsByRunId,
```

A write transaction takes `writerMutex` to guarantee a single writer (`internal/scheduler/jobdb/jobdb.go:367-368`). The doc comment says it directly: "Only a single write transaction may access the db at any given time" (`internal/scheduler/jobdb/jobdb.go:365`). It clones the plain map indices (`internal/scheduler/jobdb/jobdb.go:375-377`) but shares the immutable map and set pointers (`internal/scheduler/jobdb/jobdb.go:373-374`, `:378-380`).

`Commit()` swaps the new root pointers back into `JobDb` under `copyMutex` and releases `writerMutex`, so existing readers keep seeing their old immutable snapshot:

```go
func (txn *Txn) Commit() {
    if txn.readOnly || !txn.active {
        return
    }
    if txn.dryRun {
        txn.active = false
        return
    }
    txn.jobDb.copyMutex.Lock()
    defer txn.jobDb.copyMutex.Unlock()
    defer txn.jobDb.writerMutex.Unlock()
    txn.jobDb.jobsById = txn.jobsById
```

`DryRunTxn()` returns a writable transaction over an isolated snapshot whose mutations are never committed back (`internal/scheduler/jobdb/jobdb.go:390`); its `Commit` is a no-op (`internal/scheduler/jobdb/jobdb.go:463-466`). That is the basis for speculative scheduling.

## Things that surprised me

The scheduler effectively runs MVCC (Multi-Version Concurrency Control) in process. Readers never block writers and writers never block readers, because each transaction holds the root pointers of immutable maps and sets; a commit replaces pointers rather than mutating shared structures (`internal/scheduler/jobdb/jobdb.go:459-478`). The cost is paid by cloning only the small plain maps on write (`internal/scheduler/jobdb/jobdb.go:375-377`).

The submit path is deliberately not transactional with the rest of the system. Deduplication ids are stored only after a successful Pulsar publish, and a comment warns that a partial Pulsar submission can therefore create duplicate jobs (`internal/server/submit/submit.go:147-148`). Deduplication is treated as best-effort throughout; a failure to read existing ids is logged and ignored (`internal/server/submit/submit.go:90-92`).

The `NodeDb` keeps its efficiency by limiting distinct priorities. The number of database indices scales linearly with the number of distinct priority class priorities, so the design relies on that number being small (`internal/scheduler/nodedb/nodedb.go:81-83`).

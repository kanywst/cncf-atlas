# Internals

> Read from the source at commit `66dcbaf`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/server` | Server entry point; `main()` builds the CLI and loads persistence plugins (`cmd/server/main.go:40`). |
| `service/frontend` | Stateless API edge; `WorkflowHandler` validates and routes calls. |
| `service/history` | Core durable-execution engine: mutable state, event history, shards. |
| `service/history/execution` | The `MutableState` type and its persistence model. |
| `service/history/shard` | Shard ownership, rangeID fencing, task-ID generation. |
| `service/matching` | Task lists that hand decision and activity tasks to workers. |
| `common/persistence` | Storage interfaces and the records written to the database. |
| `common/types` | Wire and domain types, including the event history. |

## Core data structures

Four types carry the whole engine.

`HistoryEvent` (`common/types/shared.go:3574`) is one entry in a workflow's event history. The history is append-only and is the source of truth; everything else is derived from it.

`MutableState` (`service/history/execution/mutable_state.go:60`) is the in-memory view of a single run's current state, folded up from its event history. It is a large interface whose methods append events and read derived state: `AddDecisionTaskScheduledEvent` (`service/history/execution/mutable_state.go:82`), `AddWorkflowExecutionStartedEvent` (`service/history/execution/mutable_state.go:106`), `CopyToPersistence` (`service/history/execution/mutable_state.go:110`), and `GetExecutionInfo` (`service/history/execution/mutable_state.go:134`).

`WorkflowExecutionInfo` (`common/persistence/data_manager_interfaces.go:392`) is the persisted execution record. It holds `DomainID`, `WorkflowID`, and `RunID` (`common/persistence/data_manager_interfaces.go:393`), the `State` and `CloseStatus` (`common/persistence/data_manager_interfaces.go:409`), the `NextEventID` cursor (`common/persistence/data_manager_interfaces.go:413`), the decision-related fields (`common/persistence/data_manager_interfaces.go:419`), the retry policy fields (`common/persistence/data_manager_interfaces.go:442`), and the `BranchToken` that points into the history tree (`common/persistence/data_manager_interfaces.go:450`).

`shard.Context` (`service/history/shard/context.go:55`) owns a shard, the unit history uses to partition workflows. It exposes `GetRangeID` (`service/history/shard/context.go:65`), `GenerateTaskID` (`service/history/shard/context.go:79`), and the write paths `CreateWorkflowExecution` and `UpdateWorkflowExecution` (`service/history/shard/context.go:109`).

## A path worth tracing

The start path shows how a workflow becomes durable. In `startWorkflowHelper` the engine first takes the current-execution lock to serialize concurrent starts, then mints a run ID:

```go
    workflowExecution := &types.WorkflowExecution{
        WorkflowID: workflowID,
        RunID:      uuid.New(),
    }
    curMutableState, err := e.createMutableState(ctx, domainEntry, workflowExecution.GetRunID(), startRequest)
```

That block is at `service/history/engine/engineimpl/start_workflow_execution.go:122`. `createMutableState` (`service/history/engine/engineimpl/start_workflow_execution.go:1001`) builds the empty state with `NewMutableStateBuilderWithVersionHistories` (`service/history/engine/engineimpl/start_workflow_execution.go:1021`) and seeds the history tree with `SetHistoryTree(runID)` (`service/history/engine/engineimpl/start_workflow_execution.go:1028`).

The first events are appended by `addStartEventsAndTasks` (`service/history/engine/engineimpl/start_workflow_execution.go:866`), which calls `AddWorkflowExecutionStartedEvent` (`service/history/engine/engineimpl/start_workflow_execution.go:873`) and then `generateFirstDecisionTask` (`service/history/engine/engineimpl/start_workflow_execution.go:901`). That helper schedules the first decision task for non-child workflows with `AddFirstDecisionTaskScheduled` (`service/history/engine/engineimpl/start_workflow_execution.go:1043`).

The state is then committed and persisted, then written as a brand-new record:

```go
    newWorkflow, newWorkflowEventsSeq, err := curMutableState.CloseTransactionAsSnapshot(
        e.timeSource.Now(),
        execution.TransactionPolicyActive,
    )
```

`CloseTransactionAsSnapshot` is at `service/history/engine/engineimpl/start_workflow_execution.go:204`, `PersistStartWorkflowBatchEvents` at `service/history/engine/engineimpl/start_workflow_execution.go:211`, and `CreateWorkflowExecution` runs with `CreateWorkflowModeBrandNew` at `service/history/engine/engineimpl/start_workflow_execution.go:236`. A duplicate request is absorbed by `AsDuplicateRequestError`, returning the existing run ID (`service/history/engine/engineimpl/start_workflow_execution.go:245`).

## Things that surprised me

The history service holds strong consistency without a distributed lock service. Single-writer-per-shard is enforced by a monotonic generation number, the rangeID. When a host claims or renews a shard, `renewRangeLocked` (`service/history/shard/context.go:1117`) increments the rangeID:

```go
    updatedShardInfo := s.shardInfo.ToNilSafeCopy()
    updatedShardInfo.RangeID++
```

It then writes the shard with the old rangeID as a precondition:

```go
    err = s.GetShardManager().UpdateShard(context.Background(), &persistence.UpdateShardRequest{
        ShardInfo:       updatedShardInfo,
        PreviousRangeID: s.shardInfo.RangeID})
```

That conditional update is at `service/history/shard/context.go:1128`. If another host has already stolen the shard the store returns `ShardOwnershipLostError`, and this host closes the shard and lets its engine shut down (`service/history/shard/context.go:1133`).

The same rangeID doubles as the high bits of the task-ID space. On a successful renew the task sequence is reset to `rangeID << RangeSizeBits` (`service/history/shard/context.go:1157`), and `generateTaskIDLocked` (`service/history/shard/context.go:1098`) hands out IDs by incrementing `taskSequenceNumber` (`service/history/shard/context.go:1103`), renewing through `updateRangeIfNeededLocked` when a range is exhausted (`service/history/shard/context.go:1109`). A stale owner cannot write with an old range because its conditional update fails, so even under a network partition there is no double write, and task IDs stay globally unique and monotonic for the transfer and timer queues to process in order.

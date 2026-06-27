# 内部実装

> コミット `66dcbaf` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/server` | サーバの入口。`main()` が CLI を組み立て、永続化プラグインを読み込む (`cmd/server/main.go:40`)。 |
| `service/frontend` | ステートレスな API の受け口。`WorkflowHandler` が検証とルーティングを行う。 |
| `service/history` | durable execution の中核エンジン。mutable state、event history、shard。 |
| `service/history/execution` | `MutableState` 型とその永続化モデル。 |
| `service/history/shard` | shard の所有権、rangeID fencing、task ID 採番。 |
| `service/matching` | worker に decision/activity task を渡す task list。 |
| `common/persistence` | ストレージのインターフェースと DB に書かれるレコード。 |
| `common/types` | ワイヤ型・ドメイン型。event history を含む。 |

## 中核データ構造

エンジン全体を支える型は 4 つである。

`HistoryEvent` (`common/types/shared.go:3574`) はワークフローの event history の 1 件である。history は追記専用で真実の源であり、それ以外はすべてここから導出される。

`MutableState` (`service/history/execution/mutable_state.go:60`) は 1 つの run の「今の状態」をメモリ上に表す view で、その event history を畳んで作られる。イベントを追記したり派生状態を読んだりする巨大なインターフェースである: `AddDecisionTaskScheduledEvent` (`service/history/execution/mutable_state.go:82`)、`AddWorkflowExecutionStartedEvent` (`service/history/execution/mutable_state.go:106`)、`CopyToPersistence` (`service/history/execution/mutable_state.go:110`)、`GetExecutionInfo` (`service/history/execution/mutable_state.go:134`)。

`WorkflowExecutionInfo` (`common/persistence/data_manager_interfaces.go:392`) は永続化される実行レコードである。`DomainID` / `WorkflowID` / `RunID` (`common/persistence/data_manager_interfaces.go:393`)、`State` と `CloseStatus` (`common/persistence/data_manager_interfaces.go:409`)、カーソルの `NextEventID` (`common/persistence/data_manager_interfaces.go:413`)、decision 関連フィールド群 (`common/persistence/data_manager_interfaces.go:419`)、retry policy フィールド群 (`common/persistence/data_manager_interfaces.go:442`)、history tree を指す `BranchToken` (`common/persistence/data_manager_interfaces.go:450`) を保持する。

`shard.Context` (`service/history/shard/context.go:55`) は shard を所有する。shard は history がワークフローを分割する単位である。`GetRangeID` (`service/history/shard/context.go:65`)、`GenerateTaskID` (`service/history/shard/context.go:79`)、書き込みパスの `CreateWorkflowExecution` / `UpdateWorkflowExecution` (`service/history/shard/context.go:109`) を公開する。

## 追う価値のあるパス

start パスはワークフローがどう durable になるかを示す。`startWorkflowHelper` ではまず current execution のロックを取って並行 start を直列化し、続けて run ID を採番する:

```go
    workflowExecution := &types.WorkflowExecution{
        WorkflowID: workflowID,
        RunID:      uuid.New(),
    }
    curMutableState, err := e.createMutableState(ctx, domainEntry, workflowExecution.GetRunID(), startRequest)
```

このブロックは `service/history/engine/engineimpl/start_workflow_execution.go:122` にある。`createMutableState` (`service/history/engine/engineimpl/start_workflow_execution.go:1001`) は `NewMutableStateBuilderWithVersionHistories` で空の state を作り (`service/history/engine/engineimpl/start_workflow_execution.go:1021`)、`SetHistoryTree(runID)` で history tree を初期化する (`service/history/engine/engineimpl/start_workflow_execution.go:1028`)。

最初のイベントは `addStartEventsAndTasks` が積む (`service/history/engine/engineimpl/start_workflow_execution.go:866`)。これは `AddWorkflowExecutionStartedEvent` を呼び (`service/history/engine/engineimpl/start_workflow_execution.go:873`)、続けて `generateFirstDecisionTask` を呼ぶ (`service/history/engine/engineimpl/start_workflow_execution.go:901`)。このヘルパは子ワークフローでなければ `AddFirstDecisionTaskScheduled` で最初の decision task をスケジュールする (`service/history/engine/engineimpl/start_workflow_execution.go:1043`)。

その後 state を確定・永続化し、brand-new レコードとして書き込む:

```go
    newWorkflow, newWorkflowEventsSeq, err := curMutableState.CloseTransactionAsSnapshot(
        e.timeSource.Now(),
        execution.TransactionPolicyActive,
    )
```

`CloseTransactionAsSnapshot` は `service/history/engine/engineimpl/start_workflow_execution.go:204`、`PersistStartWorkflowBatchEvents` は `service/history/engine/engineimpl/start_workflow_execution.go:211`、`CreateWorkflowExecution` は `CreateWorkflowModeBrandNew` で `service/history/engine/engineimpl/start_workflow_execution.go:236` にある。重複リクエストは `AsDuplicateRequestError` で吸収され、既存の run ID を返す (`service/history/engine/engineimpl/start_workflow_execution.go:245`)。

## 読んで驚いた点

history サービスは分散ロックサービス無しで強整合を保つ。shard ごとの単一書き手は、rangeID という monotonic な世代番号で保証される。ホストが shard を掴む/更新するとき、`renewRangeLocked` (`service/history/shard/context.go:1117`) が rangeID を増やす:

```go
    updatedShardInfo := s.shardInfo.ToNilSafeCopy()
    updatedShardInfo.RangeID++
```

そして古い rangeID を前提条件として shard を書く:

```go
    err = s.GetShardManager().UpdateShard(context.Background(), &persistence.UpdateShardRequest{
        ShardInfo:       updatedShardInfo,
        PreviousRangeID: s.shardInfo.RangeID})
```

この条件付き更新は `service/history/shard/context.go:1128` にある。別のホストに既に shard を奪われていれば、ストアは `ShardOwnershipLostError` を返し、このホストは shard を閉じてエンジンを落とす (`service/history/shard/context.go:1133`)。

同じ rangeID は task ID 空間の上位ビットも兼ねる。renew に成功すると task sequence は `rangeID << RangeSizeBits` にリセットされ (`service/history/shard/context.go:1157`)、`generateTaskIDLocked` (`service/history/shard/context.go:1098`) が `taskSequenceNumber` を増やして ID を払い出し (`service/history/shard/context.go:1103`)、レンジを使い切ると `updateRangeIfNeededLocked` 経由で renew する (`service/history/shard/context.go:1109`)。古いオーナーは古いレンジで書こうとしても条件付き更新が落ちるので、ネットワーク分断下でも 2 重書き込みは起きず、task ID は transfer queue と timer queue が順序処理できるようグローバルに一意かつ単調増加に保たれる。

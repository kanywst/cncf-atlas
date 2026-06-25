# 内部実装

> コミット `7110813` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `pkg/scheduler/framework/` | Session・Statement・plugin レジストリ。スケジューリングの心臓部 |
| `pkg/scheduler/actions/` | `enqueue`, `allocate`, `backfill`, `preempt`, `reclaim`, `gangpreempt`, `gangreclaim`, `shuffle`。`factory.go` で登録 |
| `pkg/scheduler/plugins/` | 比較・述語・スコアの plugin 群: `gang`, `drf`, `proportion`, `capacity`, `binpack`, `predicates`, `nodeorder`, `numaaware` など |
| `pkg/scheduler/api/` | CRD 型とは別の、スケジューラ内部のドメインモデル |
| `pkg/scheduler/cache/` | informer から内部型への変換と、非同期 bind ワーカー |
| `pkg/controllers/` | CRD の reconciler (job, podgroup, queue, jobflow, cronjob, hypernode, gc) |
| `pkg/webhooks/` | validating/mutating admission ハンドラ |

## 中核データ構造

- **`Session`** (`pkg/scheduler/framework/session.go:65`): 1 サイクル分の全スナップショット。`Jobs`、`Nodes`、`Queues`、`HyperNodes` に加え、plugin が `OnSessionOpen` で埋める数十個の関数マップ (`jobOrderFns`, `predicateFns`, `nodeOrderFns`, `preemptableFns`, `allocatableFns`, `jobReadyFns` など) を持つ。寿命は 1 サイクルのみ。
- **`JobInfo`** (`pkg/scheduler/api/job_info.go:363`): 1 PodGroup に対応。`MinAvailable`、状態別 task 索引の `TaskStatusIndex`、`Allocated`/`TotalRequest`、`SubJobs`、`NetworkTopology` を持つ。gang の min-member 判定はここを見る。
- **`TaskInfo`** (`pkg/scheduler/api/job_info.go:118`): 1 Pod に対応。`Resreq`/`InitResreq`、`DRAResreq` (dynamic resource allocation)、現在の割当先 NodeName と Status を持つ `TransactionContext`、`Priority`、`Preemptable`、`BestEffort`、`SchGated` を持つ。
- **`Resource`** (`pkg/scheduler/api/resource_info.go:60`): CPU・メモリ・`ScalarResources` (GPU/NPU 等) を保持する量モデル。`LessEqual` や future-idle 比較が、あらゆる fit 判定の基礎になる。
- **`Statement`** (`pkg/scheduler/framework/statement.go`): tentative な operation の列。`Allocate` (`:246`)・`Pipeline` (`:140`)・`Evict` をメモリに積み、`Commit` (`:392`)・`Discard`・`RecoverOperations` で確定・破棄・復元する。dry-run トランザクションの実体。

## 追う価値のあるパス

`Statement.Allocate` は API server に書かない。session のメモリ状態を更新し、後で再生するための operation を記録するだけだ。

```go
// pkg/scheduler/framework/statement.go:246
func (s *Statement) Allocate(task *api.TaskInfo, nodeInfo *api.NodeInfo) (err error) {
    // ...
    job.UpdateTaskStatus(task, api.Allocated)   // :262, メモリ上だけ
    // ... node.AddTask(task) の後、"allocate" operation を append
}
```

実際の bind は action が statement をコミットして初めて起き、しかもそれは同期ではなくキュー投入になる。

```text
allocate.go:314  if stmt != nil && ssn.JobReady(job) { stmt.Commit() }
statement.go:392 Commit()         -> 記録済み operation を再生
statement.go:317 allocate()       -> cache.AddBindTask(bindContext)   (:319)
cache.go:874     go wait.Until(sc.processBindTask, ...)               (非同期ワーカー)
cache.go:231     DefaultBinder.Bind(kubeClient, tasks)                -> API server
```

gang 保証は `allocate.go:314` の `ssn.JobReady(job)` ゲートから自然に導かれる。gang plugin は、ジョブの割当済み task 数が `MinAvailable` に達したときだけ true を返す `JobReady` を登録する。達しなければ `Commit` は走らず、tentative な割当は破棄されるので、クラスタは半端に配置された gang を決して見ない。

## 読んで驚いた点

- **スケジューリングロジックのほぼ全部がメモリ上だけで完結する。** 割当・pipeline・退避は session の状態を変更し operation を append するだけで、コミットまで API server に触れず、bind 自体も非同期ワーカーに遅延される (`pkg/scheduler/cache/cache.go:874`)。これによりスケジューラは、スナップショットの純粋関数として捉えやすくなる。
- **HyperNode 探索はクローンの総当り。** ネットワークトポロジ配置は hyperNode ごとに worksheet をクローンし、dry-run で割当を試し、スコア付けし、破棄し (`pkg/scheduler/actions/allocate/allocate.go:501`)、最良結果だけを `RecoverOperations` で復元する (`:447`)。コード上の TODO は、task 単位のチェック手順が通常経路と重複しており、いずれ統合すべきと記している (`allocate.go:656`)。
- **指名ファストパスがある。** `allocateFromNomination` (`pkg/scheduler/actions/allocate/allocate.go:595`) は preempt や reclaim が既に指名したノードを先に試し、指名がもう検証に通らなければ通常経路にフォールバックする。
- **preempt と reclaim は無効で出荷される。** デフォルトの ConfigMap は `enqueue, allocate, backfill` しか走らせない (`pkg/scheduler/util.go:38`)。優先度ベースの退避はオプトイン。

# 内部実装

> コミット `85b582d` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/` | コンポーネントごとの `main.go` (server、scheduler、executor、lookout、armadactl ほか)。 |
| `internal/server/submit/` | ジョブを Pulsar へ publish する submit API ゲートウェイ (`internal/server/submit/submit.go:30-32`)。 |
| `internal/scheduler/` | scheduler: メインループ、インメモリジョブ DB、ノード DB、スケジューリングアルゴリズム。 |
| `internal/scheduler/jobdb/` | インメモリ・トランザクショナル `JobDb` とその `Txn` スナップショット (`internal/scheduler/jobdb/jobdb.go:68`)。 |
| `internal/scheduler/nodedb/` | スケジュール可能ノードを探すインメモリ `NodeDb` (`internal/scheduler/nodedb/nodedb.go:77`)。 |
| `internal/scheduler/scheduling/` | スケジューリングアルゴリズム群 (DRF fairness、gang scheduling、preemption など)。 |
| `magefiles/` | `mage` ベースのビルド・ローカル開発タスク。 |

## 中核データ構造

- `submit.Server` (`internal/server/submit/submit.go:32`): submit API ゲートウェイ。`publisher`・`queueCache`・`deduplicator`・`authorizer` を保持し、submit 呼び出しを Pulsar イベントに変換する (`internal/server/submit/submit.go:33-41`)。
- `JobDb` (`internal/scheduler/jobdb/jobdb.go:68`): scheduler のインメモリ DB。ジョブは `github.com/benbjohnson/immutable` の永続的イミュータブル map/set で多重インデックス化される (`internal/scheduler/jobdb/jobdb.go:7`, `:69-76`)。メモリ節約のため文字列を intern し (`internal/scheduler/jobdb/jobdb.go:82-83`)、`copyMutex` と `writerMutex` で自身を保護する (`internal/scheduler/jobdb/jobdb.go:84-86`)。
- `Txn` (`internal/scheduler/jobdb/jobdb.go:427`): `JobDb` のスナップショットトランザクション。`readOnly`・`dryRun` フラグと各インデックスの root ポインタを保持する (`internal/scheduler/jobdb/jobdb.go:427-457`)。
- `Job` (`internal/scheduler/jobdb/job.go:23`): scheduler 内部のジョブ表現。
- `NodeDb` (`internal/scheduler/nodedb/nodedb.go:77`): ノードを hashicorp `go-memdb` のインメモリ DB に保持し (`internal/scheduler/nodedb/nodedb.go:79`)、Pod のスケジュール可能ノードを効率的に探せるようインデックスを張る (`internal/scheduler/nodedb/nodedb.go:76`)。
- `DominantResourceFairness` (`internal/scheduler/scheduling/fairness/fairness.go:34`): DRF (Dominant Resource Fairness) のコストプロバイダ。`UnweightedCostFromAllocation` と `WeightedCostFromAllocation` で割当をコストに変換し (`internal/scheduler/scheduling/fairness/fairness.go:30-31`)、`NewDominantResourceFairness(totalResources, pool, config)` で生成する (`internal/scheduler/scheduling/fairness/fairness.go:43`)。

`Txn` の doc コメントは、scheduler 全体が依拠する不変条件を述べている。

```go
// Txn is a JobDb Transaction. Transactions provide a consistent view of the database, allowing readers to
// perform multiple actions without the database changing from underneath them.
// Write transactions also allow callers to perform write operations that will not be visible to other users
// until the transaction is committed.
```

## 追う価値のあるパス

注目すべきは `JobDb` のトランザクションモデルである。scheduler は PostgreSQL を永続的な source of truth としつつ、スケジューリング判断は全ジョブのインメモリ複製の上で行う。これは永続的イミュータブルデータ構造として組まれている (`internal/scheduler/jobdb/jobdb.go:68-76`)。トランザクション型はその上にスナップショット分離を実装する。

read トランザクションは `copyMutex` を、現行 root ポインタを共有するだけの短い間だけ取り、read-only スナップショットを返す。

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

write トランザクションは単一 writer を保証するため `writerMutex` を取る (`internal/scheduler/jobdb/jobdb.go:367-368`)。doc コメントが端的に言う通り "Only a single write transaction may access the db at any given time" (`internal/scheduler/jobdb/jobdb.go:365`)。プレーンな map 系インデックスは clone するが (`internal/scheduler/jobdb/jobdb.go:375-377`)、イミュータブル map/set のポインタは共有する (`internal/scheduler/jobdb/jobdb.go:373-374`, `:378-380`)。

`Commit()` は `copyMutex` 下で新しい root ポインタを `JobDb` に差し替え、`writerMutex` を解放する。既存の読者は古いイミュータブルスナップショットを見続けられる。

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

`DryRunTxn()` は隔離スナップショット上の書き込み可能トランザクションを返し、その変更は決して commit されない (`internal/scheduler/jobdb/jobdb.go:390`)。その `Commit` は no-op である (`internal/scheduler/jobdb/jobdb.go:463-466`)。これが投機的スケジューリングの基盤になる。

## 読んで驚いた点

scheduler は実質的にプロセス内で MVCC (Multi-Version Concurrency Control、多版型同時実行制御) を回している。各トランザクションがイミュータブル map/set の root ポインタを持ち、commit が共有構造を変異させる代わりにポインタを差し替えるため、読者が書き手を、書き手が読者をブロックしない (`internal/scheduler/jobdb/jobdb.go:459-478`)。コストは write 時に小さなプレーン map だけを clone することで支払う (`internal/scheduler/jobdb/jobdb.go:375-377`)。

submit パスは意図的にシステム全体とはトランザクショナルでない。dedup id は Pulsar への publish 成功後にのみ保存され、そのため Pulsar への部分的な投入は重複ジョブを生みうると、コメントが警告している (`internal/server/submit/submit.go:147-148`)。dedup は全体を通じて best-effort 扱いで、既存 id 取得の失敗はログのみで無視される (`internal/server/submit/submit.go:90-92`)。

`NodeDb` は distinct な優先度の数を抑えることで効率を保つ。データベースインデックス数は distinct な priority class 優先度の数に比例して増えるため、その数が小さいことを前提とした設計になっている (`internal/scheduler/nodedb/nodedb.go:81-83`)。

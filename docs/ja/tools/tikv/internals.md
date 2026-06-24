# 内部実装

> コミット `2ce1174` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `src/server/` | gRPC サーバ、接続処理、`Service` 実装 |
| `src/storage/` | トランザクション MVCC ストレージ。Percolator 2 フェーズコミット |
| `src/storage/mvcc/` | MVCC のエンコードとデコード |
| `src/storage/txn/` | トランザクションコマンドとスケジューラ |
| `src/server/raftkv/` | ストレージと raftstore を橋渡しする `Engine` 実装 |
| `components/raftstore/`, `raftstore-v2/` | Raft コンセンサスと Region 管理 |
| `components/engine_traits/`, `engine_rocks/` | ストレージエンジン抽象と RocksDB 実装 |
| `components/txn_types/` | `Key`・`Value`・`Lock`・`Write`・`TimeStamp` 基本型 |
| `components/concurrency_manager/` | インメモリのロックテーブルと `max_ts` |
| `components/pd_client/` | Placement Driver クライアント (シャーディング・リバランス・TSO) |

## 中核データ構造

`Lock` (`components/txn_types/src/lock.rs:87`) は `lock` CF に書かれて未コミットトランザクションを示す Percolator のロックである。`lock_type`・`primary` (主キーの位置)・`ts` (`start_ts`)・`ttl`・`for_update_ts` (悲観トランザクションでは非ゼロ)・`use_async_commit`・`use_one_pc`・`min_commit_ts` を持つ。

`Write` (`components/txn_types/src/write.rs:71`) は `write` CF のコミット記録である。`write_type` (Put・Delete・Lock・Rollback)・`start_ts`・任意の埋め込み `short_value`・`has_overlapped_rollback` を持つ。最後のフラグは、Commit と Rollback の記録が同一 internal key で衝突する希少ケースを扱う。

`Storage<E, L, F>` (`src/storage/mod.rs:197`) はストレージ層のファサードである。`engine: E`・`sched: TxnScheduler`・`read_pool`・concurrency manager を保持する。型パラメータでエンジン (RaftKv または RaftKv2)・ロックマネージャ・キーフォーマット (API v1 または v2) を差し替える。

`TxnScheduler<E, L>` (`src/storage/txn/scheduler.rs:422`) は走行中のコマンドを追跡し、`Latches` で key 単位に直列化する。読みは read pool を使い、書きはこのスケジューラを通る。`components/engine_traits/src/cf_defs.rs:4` の Column Family 定数 (`default`・`lock`・`write`・`raft`) は MVCC のデータレイアウトそのものである。

## 追う価値のあるパス

書き込みコマンドは実行前に latch を取得する。これが TiKV が同一キーへの並行書き込みを直列化する方法である。`TaskContext::execute` で、スケジューラはコマンドを実行する前に latch を取得する。

```text
src/storage/txn/scheduler.rs:203  fn execute(self, pr: ProcessResult)
src/storage/txn/scheduler.rs:404  if self.latches.acquire(&mut tctx.lock, cid) {
```

latch を保持すると、コマンドは `Modify` 操作の集合を生成し、それをエンジン経由で書く。`RaftKv::async_write` (`src/server/raftkv/mod.rs:503`) が `RaftCmdRequest` を組み立てる。

```text
src/server/raftkv/mod.rs:578  let mut cmd = RaftCmdRequest::default();
```

このリクエストは raftstore に送られ、propose・多数派への複製・commit・apply を経て、apply コールバックでストレージ層に通知される。

読みパスはその鏡像である。`future_get` (`src/server/service/kv.rs:1614`) が `Storage::get_entry` (`src/storage/mod.rs:625`) を呼び、スナップショットコンテキストを準備し (`src/storage/mod.rs:694`)、Raft ログに触れずに `RaftKv::async_snapshot` (`src/server/raftkv/mod.rs:653`) でスナップショットを取り、`PointGetter::get_entry` (`src/storage/mvcc/reader/point_getter.rs:188`) でバージョンを解決する。

## 読んで驚いた点

`Lock` の `use_one_pc` フィールドはインメモリのロックにのみ存在し、永続化されない。`components/txn_types/src/lock.rs:98` のコメントが理由を説明している。1PC が成功するとロックは直接 write に変換され、失敗するとフィールドはデフォルトの false に戻る。正しさの拠り所はディスクではなく、インメモリの concurrency manager と `max_ts` にある。

`Write` の `has_overlapped_rollback` (`components/txn_types/src/write.rs:84`) は、分散 GC とのレースを意図的に避ける実装である。Rollback 記録は Commit 記録と `write` CF を共有し、`user_key{start_ts}` をキーとするため、既存 commit 記録の上に保護付き rollback を別レコードとして単純に書くと GC compaction filter と衝突しうる。そこで TiKV は Commit 記録を残し、その上にフラグを立てる。

読みが Raft ログを避けることが、性能を最も左右する設計判断である。コンセンサスを通るのは `async_write` だけで、`async_snapshot` (`src/server/raftkv/mod.rs:653`) はリース読み / read-index で線形化可能性を保つ。よって普通の読みはログ追記のコストを払わない。

## 出典

- [4] [tikv/tikv README](https://github.com/tikv/tikv)
- [10] [TiKV Documentation](https://tikv.org/docs/latest/concepts/overview/)

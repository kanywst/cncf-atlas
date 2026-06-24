# 内部実装

> コミット `61d518f` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `server/etcdserver` | コアの状態機械: API ハンドラ、Raft ループ、apply ループ、メンバーシップ |
| `server/storage/mvcc` | マルチバージョンストアと in-memory キー index |
| `server/storage/backend` | bbolt ラッパ、永続ストア |
| `server/storage/wal` | write-ahead ログ |
| `server/lease` | TTL ベースのキー失効 |
| `server/auth` | RBAC ストア |
| `api` | protobuf と gRPC の定義 (`go.etcd.io/etcd/api/v3`) |
| `client` | Go クライアント `clientv3`、`etcdctl` / `etcdutl` CLI |

## 中核データ構造

システムは少数の型を中心に回ります。

- `store` (`server/storage/mvcc/kvstore.go:53`) は MVCC ストア本体。`backend.Backend`、in-memory の `index`、lease の `Lessor`、revision カウンタ `currentRev` と `compactMainRev` を持ちます。
- `treeIndex` (`server/storage/mvcc/index.go:39`) はユーザキーを `keyIndex` に対応づける in-memory B-tree。二次索引で永続化されず、再起動時に backend から再構築されます。
- `keyIndex` (`server/storage/mvcc/key_index.go:73`) はキーごとに `generations` (revision の履歴リスト) を保持します。generation が compaction の単位です。
- `backend` (`server/storage/backend/backend.go:92`) は bbolt のラッパ。永続ストアはユーザキーではなく revision バイト列でキー付けされます。
- `lessor` (`server/lease/lessor.go:145`) は lease の TTL を追跡し、キーを失効させます。
- `watchableStore` (`server/storage/mvcc/watchable_store.go:56`) は `store` の上に watch 機能を載せます。

## 追う価値のあるパス

二重書きの設計が現れるのは write トランザクションです。`storeTxnWrite.Put` は新しい revision を返し (`server/storage/mvcc/kvstore_txn.go:204`)、本処理は `put` にあります (`server/storage/mvcc/kvstore_txn.go:223`)。これは in-memory index から前回の created revision と lease を引き (`server/storage/mvcc/kvstore_txn.go:230`)、`mvccpb.KeyValue` をマーシャルしてから、両方のストアに書きます。

```go
tw.tx.UnsafeSeqPut(schema.Key, ibytes, d)
tw.s.kvindex.Put(key, idxRev)
```

`UnsafeSeqPut` は revision バイト列 (`ibytes`) をキーに値を bbolt へ書き、`kvindex.Put` はユーザキーがその revision を指すよう in-memory tree を更新します (`server/storage/mvcc/kvstore_txn.go:259-260`)。したがって読みは 2 段です。`treeIndex` でユーザキーを revision に解決し、その revision で bbolt から値を取得します。

revision カウンタはコミット時にしか動きません。`storeTxnWrite.End` は、トランザクションが実際に状態を変えたときだけ `revMu` の下で `currentRev` をインクリメントします (`server/storage/mvcc/kvstore_txn.go:209`)。

```text
End:
    if len(tw.changes) != 0 {
        tw.s.revMu.Lock()
        tw.s.currentRev++   // kvstore_txn.go:214
    }
    tw.tx.Unlock()
```

## 読んで驚いた点

backend はユーザキーの下に何も保存しません。bbolt は完全に revision でキー付けされ、あるキーが今どの revision を指すかを知っているのは in-memory の `treeIndex` だけです (`server/storage/mvcc/kvstore_txn.go:259-260`)。これが、再起動時に index を backend から再構築しなければならない理由であり、履歴を意識した watch と compaction が安価になる理由でもあります。古い revision は compaction が消すまで参照可能なまま残ります。

apply パスは平坦な switch ではなくデコレータチェーンです。リクエストは corrupt・capped・auth・quota・backend の applier を降り、`dispatch` がそれをほどいてから再びチェーンを降ります。`server/etcdserver/apply/uber_applier.go:85-87` のコメントがその順序を明示しており、個々の applier を単体で読むと見落としやすい点です。

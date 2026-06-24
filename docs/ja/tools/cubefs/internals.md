# 内部実装

> コミット `6b2e792` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/` | ロール分岐。1 バイナリが master, metanode, datanode などになる (`cmd/cmd.go:206-239`) |
| `master/` | クラスタ台帳・ボリューム・パーティション配置 (`master/cluster.go:141`) |
| `metanode/` | メタパーティションごとのインメモリ inode/dentry B-Tree (`metanode/partition.go:484`) |
| `datanode/` | extent ストレージとプライマリ-バックアップ複製 (`datanode/partition.go:102`) |
| `sdk/data/stream/` | クライアント書き込みパス。stream, extent handler, sender goroutine |
| `objectnode/` | S3 互換ゲートウェイ |
| `blobstore/` | イレイジャーコーディングエンジン (clustermgr, blobnode, access, proxy, scheduler, shardnode) |
| `proto/` | ロール間で共有するワイヤ型。`ExtentKey` を含む (`proto/extent_key.go:58`) |

## 中核データ構造

`ExtentKey` (`proto/extent_key.go:58`) はファイル内の論理オフセットと物理データを結ぶアドレスです。`FileOffset`, `PartitionId`, `ExtentId`, `ExtentOffset`, `Size`, `CRC`, `SnapInfo` を持ちます。すべての読み書きはこれらの鍵を通して解決されます。

`Inode` (`metanode/inode.go:78`) はインメモリ inode です。`Size`, `Generation`, 各種時刻, `Type`, `Uid`, `Gid`, `NLink` に加えて、レプリカ/blobstore/ハイブリッドクラウドの配置を選ぶ `StorageClass` フィールドを持ち、ファイルの `ExtentKey` 群を保持します。`Inode.GetExtents()` (`metanode/inode.go:111`) がその extent 群を返します。

`Dentry` (`metanode/dentry.go:53`) は `ParentId`, `Name`, `Inode`, `Type` を持つディレクトリエントリです。子は `(ParentId, Name)` の組で引きます。

`metaPartition` (`metanode/partition.go:484`) はメタデータプレーンが回転する 2 本の索引を保持します。`dentryTree *BTree` (`metanode/partition.go:489`) と `inodeTree *BTree` (`metanode/partition.go:490`) です。`BTree` (`metanode/btree.go:31`) は Google の `btree.BTree` を `sync.RWMutex` で包んだものなので、メタデータはすべてメモリ常駐で B-Tree により索引されます。

## 追う価値のあるパス

append write を端から端まで追います。

`(*Streamer).write` (`sdk/data/stream/stream_writer.go:355`) は `s.extents.PrepareWriteRequests(offset, size, data)` (`stream_writer.go:381`) で書き込みを extent 単位のリクエストに分解します。既存 ExtentKey に一致する overwrite は `doOverwrite` (`stream_writer.go:422`) へ、既存鍵のない append は `doWriteAppend` (`stream_writer.go:458`) へ進みます。

データは `ExtentHandler` にバッファされ、`(*ExtentHandler).write` (`sdk/data/stream/extent_handler.go:231`) でパケット化されます。専用の sender goroutine `(*ExtentHandler).sender` (`extent_handler.go:292`) がそれを送ります。各パケットに全レプリカアドレスと follower 数を刻みます。

```go
packet.Arg = ([]byte)(eh.dp.GetAllAddrs())
packet.ArgLen = uint32(len(packet.Arg))
packet.RemainingFollowers = uint8(len(eh.dp.Hosts) - 1)
```

そして `packet.writeToConn(eh.conn)` がプライマリ DataNode へ送ります (`extent_handler.go:350`)。

DataNode 側では `(*ReplProtocol).OperatorAndForwardPktGoRoutine` (`datanode/repl/repl_protocol.go:334`) が `sendRequestToAllFollowers` で全 follower へ転送し、その後ローカルに適用します (`repl_protocol.go:342-349`)。各 follower コピーは `followerRequest.RemainingFollowers = 0` を持つので転送は再帰しません (`repl_protocol.go:318-322`)。これがプライマリ-バックアップ chain です。

ローカル書き込みは `(*DataNode).handleWritePacket` (`datanode/wrap_operator.go:912`) です。forbidden・repairing・容量チェックの後に `store := partition.ExtentStore()` (`datanode/wrap_operator.go:953`) を得て、`WriteParam` を組み立て `(*ExtentStore).Write` (`datanode/storage/extent_store.go:665`) を呼びます。これが実ディスク I/O の `(*Extent).Write` (`datanode/storage/extent.go:499`) に到達します。

```text
Streamer.write -> ExtentHandler.write -> ExtentHandler.sender -> primary DataNode
  -> OperatorAndForwardPktGoRoutine -> sendRequestToAllFollowers (chain)
  -> handleWritePacket -> ExtentStore.Write -> Extent.Write -> disk
```

書き込み確定後、クライアントは確定した ExtentKey を MetaNode 上の inode の extent 集合に登録します。こうしてデータは DataNode に、その位置は MetaNode の inode にある状態が成立します。

## 読んで驚いた点

Master はデータパスに不在です。クライアントが全レプリカ一覧を `packet.Arg` (`extent_handler.go:338`) に載せ、プライマリ DataNode が chain を自ら駆動します。Master は事前にパーティションのホスト一覧を渡しただけなので、Master が遅くても進行中の書き込みは止まりません。

メタデータには自前の永続索引がありません。inode と dentry の B-Tree は RAM 常駐で (`metanode/partition.go:489-490`)、ディスクはそれらを再構築するための raft ログと snapshot を持ちます。これが論文のメタデータスループットの主張を支えるテコであり、メタデータ容量がノード RAM に律速される理由でもあります (S7)。

小ファイルは別パスです。tiny extent が多数の小ファイルを集約し、大量の小書き込みで extent やメタデータの数が爆発しないようにします。分岐は extent handler の `tinySizeLimit` チェック付近にあります。

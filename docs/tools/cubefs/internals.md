# Internals

> Read from the source at commit `6b2e792`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/` | Role dispatch; one binary becomes master, metanode, datanode, and so on (`cmd/cmd.go:206-239`) |
| `master/` | Cluster ledger, volumes, partition placement (`master/cluster.go:141`) |
| `metanode/` | In-memory inode and dentry B-Trees per meta partition (`metanode/partition.go:484`) |
| `datanode/` | Extent storage and primary-backup replication (`datanode/partition.go:102`) |
| `sdk/data/stream/` | Client write path: stream, extent handler, sender goroutine |
| `objectnode/` | S3-compatible gateway |
| `blobstore/` | Erasure-coding engine (clustermgr, blobnode, access, proxy, scheduler, shardnode) |
| `proto/` | Wire types shared across roles, including `ExtentKey` (`proto/extent_key.go:58`) |

## Core data structures

`ExtentKey` (`proto/extent_key.go:58`) is the address that ties a logical file offset to physical data. It carries `FileOffset`, `PartitionId`, `ExtentId`, `ExtentOffset`, `Size`, `CRC`, and `SnapInfo`. Every read and write resolves through these keys.

`Inode` (`metanode/inode.go:78`) is the in-memory inode. Alongside `Size`, `Generation`, timestamps, `Type`, `Uid`, `Gid`, and `NLink`, it holds a `StorageClass` field that selects replica, blobstore, or hybrid-cloud placement, and it owns the set of `ExtentKey`s for the file. `Inode.GetExtents()` (`metanode/inode.go:111`) returns those extents.

`Dentry` (`metanode/dentry.go:53`) is a directory entry with `ParentId`, `Name`, `Inode`, and `Type`. Children are looked up by the `(ParentId, Name)` pair.

`metaPartition` (`metanode/partition.go:484`) holds the two indexes the metadata plane turns on: `dentryTree *BTree` (`metanode/partition.go:489`) and `inodeTree *BTree` (`metanode/partition.go:490`). `BTree` (`metanode/btree.go:31`) is a `sync.RWMutex` wrapping a Google `btree.BTree`, so all metadata is resident in memory and indexed by B-Tree.

## A path worth tracing

Follow an append write end to end.

`(*Streamer).write` (`sdk/data/stream/stream_writer.go:355`) splits the write into per-extent requests with `s.extents.PrepareWriteRequests(offset, size, data)` (`stream_writer.go:381`). An overwrite that matches an existing ExtentKey takes `doOverwrite` (`stream_writer.go:422`); an append with no existing key takes `doWriteAppend` (`stream_writer.go:458`).

Data buffers into an `ExtentHandler` and becomes packets in `(*ExtentHandler).write` (`sdk/data/stream/extent_handler.go:231`). A dedicated sender goroutine, `(*ExtentHandler).sender` (`extent_handler.go:292`), ships them. It stamps each packet with every replica address and the follower count:

```go
packet.Arg = ([]byte)(eh.dp.GetAllAddrs())
packet.ArgLen = uint32(len(packet.Arg))
packet.RemainingFollowers = uint8(len(eh.dp.Hosts) - 1)
```

Then `packet.writeToConn(eh.conn)` sends it to the primary DataNode (`extent_handler.go:350`).

On the DataNode, `(*ReplProtocol).OperatorAndForwardPktGoRoutine` (`datanode/repl/repl_protocol.go:334`) forwards the packet to all followers with `sendRequestToAllFollowers`, then applies it locally (`repl_protocol.go:342-349`). Each follower copy has `followerRequest.RemainingFollowers = 0` so forwarding does not recurse (`repl_protocol.go:318-322`). That is the primary-backup chain.

The local write is `(*DataNode).handleWritePacket` (`datanode/wrap_operator.go:912`). After forbidden, repairing, and capacity checks it gets `store := partition.ExtentStore()` (`datanode/wrap_operator.go:953`), builds a `WriteParam`, and calls `(*ExtentStore).Write` (`datanode/storage/extent_store.go:665`), which reaches `(*Extent).Write` (`datanode/storage/extent.go:499`) for the real disk I/O.

```text
Streamer.write -> ExtentHandler.write -> ExtentHandler.sender -> primary DataNode
  -> OperatorAndForwardPktGoRoutine -> sendRequestToAllFollowers (chain)
  -> handleWritePacket -> ExtentStore.Write -> Extent.Write -> disk
```

After the write commits, the client registers the confirmed ExtentKey into the inode's extent set on a MetaNode, so the data lives on the DataNode and its location lives in the MetaNode inode.

## Things that surprised me

The Master is absent from the data path. The client puts the full replica list into `packet.Arg` (`extent_handler.go:338`) and the primary DataNode drives the chain itself. The Master only handed out the partition host list earlier, so a slow or busy Master does not stall in-flight writes.

Metadata has no persistent index of its own. The inode and dentry B-Trees are RAM-resident (`metanode/partition.go:489-490`); disk holds raft logs and snapshots used to rebuild them. This is the lever behind the paper's metadata-throughput claim, and the reason metadata capacity is bound by node RAM (S7).

Small files get a separate path. Tiny extents aggregate many small files so that a flood of small writes does not explode extent and metadata counts; the branch sits in the extent handler around the `tinySizeLimit` check.

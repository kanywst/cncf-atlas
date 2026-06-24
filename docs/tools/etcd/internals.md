# Internals

> Read from the source at commit `61d518f`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `server/etcdserver` | Core state machine: API handlers, Raft loop, apply loop, membership |
| `server/storage/mvcc` | Multi-version store and the in-memory key index |
| `server/storage/backend` | bbolt wrapper, the persistent store |
| `server/storage/wal` | Write-ahead log |
| `server/lease` | TTL-based key expiry |
| `server/auth` | RBAC store |
| `api` | protobuf and gRPC definitions (`go.etcd.io/etcd/api/v3`) |
| `client` | Go client `clientv3`; `etcdctl` and `etcdutl` CLIs |

## Core data structures

The system turns on a handful of types.

- `store` (`server/storage/mvcc/kvstore.go:53`) is the MVCC store. It holds the `backend.Backend`, the in-memory `index`, the lease `Lessor`, and the revision counters `currentRev` and `compactMainRev`.
- `treeIndex` (`server/storage/mvcc/index.go:39`) is the in-memory B-tree that maps a user key to its `keyIndex`. It is a secondary index and is not persisted; it is rebuilt from the backend on restart.
- `keyIndex` (`server/storage/mvcc/key_index.go:73`) holds, per key, a list of `generations` (the revision history). The generation is the unit of compaction.
- `backend` (`server/storage/backend/backend.go:92`) wraps bbolt. The persistent store is keyed by revision bytes, not user keys.
- `lessor` (`server/lease/lessor.go:145`) tracks lease TTLs and expires keys.
- `watchableStore` (`server/storage/mvcc/watchable_store.go:56`) layers watch support on top of `store`.

## A path worth tracing

The write transaction is where the dual-write design shows up. `storeTxnWrite.Put` returns the new revision (`server/storage/mvcc/kvstore_txn.go:204`), and the real work is in `put` (`server/storage/mvcc/kvstore_txn.go:223`). It looks up the previous created revision and lease from the in-memory index (`server/storage/mvcc/kvstore_txn.go:230`), marshals an `mvccpb.KeyValue`, then writes to both stores:

```go
tw.tx.UnsafeSeqPut(schema.Key, ibytes, d)
tw.s.kvindex.Put(key, idxRev)
```

`UnsafeSeqPut` writes the value to bbolt keyed by the revision bytes (`ibytes`); `kvindex.Put` updates the in-memory tree so the user key resolves to that revision (`server/storage/mvcc/kvstore_txn.go:259-260`). A read is therefore two steps: resolve the user key to a revision through `treeIndex`, then fetch the value from bbolt by that revision.

The revision counter only moves on commit. `storeTxnWrite.End` increments `currentRev` under `revMu` only when the transaction actually changed state (`server/storage/mvcc/kvstore_txn.go:209`):

```text
End:
    if len(tw.changes) != 0 {
        tw.s.revMu.Lock()
        tw.s.currentRev++   // kvstore_txn.go:214
    }
    tw.tx.Unlock()
```

## Things that surprised me

The backend stores nothing under user keys. bbolt is keyed entirely by revision, and the only thing that knows which revision a key currently points at is the in-memory `treeIndex` (`server/storage/mvcc/kvstore_txn.go:259-260`). This is the reason a restart has to rebuild the index from the backend, and it is what makes history-aware watches and compaction cheap: old revisions stay addressable until compaction removes them.

The apply path is a decorator chain, not a flat switch. A request descends through corrupt, capped, auth, quota, and backend appliers, then `dispatch` unpacks it and the call descends the chain again. The comment at `server/etcdserver/apply/uber_applier.go:85-87` spells out the order, which is easy to miss when reading any single applier in isolation.

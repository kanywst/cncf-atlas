# Internals

> Read from the source at commit `2ce1174`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/server/` | gRPC server, connection handling, `Service` implementation |
| `src/storage/` | Transactional MVCC storage; Percolator two-phase commit |
| `src/storage/mvcc/` | MVCC encode and decode |
| `src/storage/txn/` | Transaction commands and the scheduler |
| `src/server/raftkv/` | `Engine` implementation that bridges storage to raftstore |
| `components/raftstore/`, `raftstore-v2/` | Raft consensus and Region management |
| `components/engine_traits/`, `engine_rocks/` | Storage engine abstraction and RocksDB impl |
| `components/txn_types/` | `Key`, `Value`, `Lock`, `Write`, `TimeStamp` primitives |
| `components/concurrency_manager/` | In-memory lock table and `max_ts` |
| `components/pd_client/` | Placement Driver client (sharding, rebalance, TSO) |

## Core data structures

`Lock` (`components/txn_types/src/lock.rs:87`) is the Percolator lock written to the `lock` CF to mark an uncommitted transaction. It carries `lock_type`, `primary` (the primary key location), `ts` (the `start_ts`), `ttl`, `for_update_ts` (nonzero for a pessimistic transaction), `use_async_commit`, `use_one_pc`, and `min_commit_ts`.

`Write` (`components/txn_types/src/write.rs:71`) is the commit record in the `write` CF. It holds `write_type` (Put, Delete, Lock, or Rollback), `start_ts`, an optional embedded `short_value`, and `has_overlapped_rollback`, a flag that handles the rare case where a Commit and a Rollback record collide on the same internal key.

`Storage<E, L, F>` (`src/storage/mod.rs:197`) is the storage facade. It holds `engine: E`, `sched: TxnScheduler`, a `read_pool`, and the concurrency manager. Its type parameters swap the engine (RaftKv or RaftKv2), the lock manager, and the key format (API v1 or v2).

`TxnScheduler<E, L>` (`src/storage/txn/scheduler.rs:422`) tracks in-flight commands and serializes them per key with `Latches`. Reads use the read pool; writes go through this scheduler. The column family constants in `components/engine_traits/src/cf_defs.rs:4` (`default`, `lock`, `write`, `raft`) are the MVCC data layout itself.

## A path worth tracing

A write command takes latches before it executes, which is how TiKV serializes concurrent writes to the same key. In `TaskContext::execute` the scheduler acquires latches before running the command:

```text
src/storage/txn/scheduler.rs:203  fn execute(self, pr: ProcessResult)
src/storage/txn/scheduler.rs:404  if self.latches.acquire(&mut tctx.lock, cid) {
```

Once latches are held, the command produces a set of `Modify` operations and writes them through the engine. `RaftKv::async_write` (`src/server/raftkv/mod.rs:503`) builds a `RaftCmdRequest`:

```text
src/server/raftkv/mod.rs:578  let mut cmd = RaftCmdRequest::default();
```

The request is sent to raftstore, where it is proposed, replicated to a majority, committed, and applied, after which the storage layer is notified through the apply callback.

The read path is the mirror image. `future_get` (`src/server/service/kv.rs:1614`) calls `Storage::get_entry` (`src/storage/mod.rs:625`), which prepares a snapshot context (`src/storage/mod.rs:694`), takes a snapshot via `RaftKv::async_snapshot` (`src/server/raftkv/mod.rs:653`) without touching the Raft log, and resolves the version with `PointGetter::get_entry` (`src/storage/mvcc/reader/point_getter.rs:188`).

## Things that surprised me

The `use_one_pc` field on `Lock` exists only for in-memory locks and is never persisted. The comment at `components/txn_types/src/lock.rs:98` explains why: when 1PC succeeds the lock is converted to a write directly, and when it fails the field is reverted to its default of false. The persistence of correctness lives in the in-memory concurrency manager and `max_ts`, not on disk.

`has_overlapped_rollback` on `Write` (`components/txn_types/src/write.rs:84`) is a deliberate avoidance of a race with distributed GC. Because Rollback records share the `write` CF with Commit records and are keyed by `user_key{start_ts}`, a protected rollback over an existing commit cannot just be written as a separate record without risking a collision with the GC compaction filter. Instead TiKV keeps the Commit record and sets the flag on it.

Reads avoiding the Raft log is the design choice that most shapes performance. Only `async_write` traverses consensus; `async_snapshot` (`src/server/raftkv/mod.rs:653`) stays linearizable through a lease read or read-index, so the common read never pays for a log append.

## Sources

- [4] [tikv/tikv README](https://github.com/tikv/tikv)
- [10] [TiKV Documentation](https://tikv.org/docs/latest/concepts/overview/)

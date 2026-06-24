# Internals

> Read from the source at commit `7924743`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `go/cmd/` | One subdirectory per binary: vtgate, vttablet, vtctld, vtorc, vtadmin, vtcombo |
| `go/vt/vtgate/` | The proxy: executor, planner, and the execution engine |
| `go/vt/vtgate/engine/` | Primitive tree types (`Route`, `Join`, `Limit`, and so on) that execute a plan |
| `go/vt/vtgate/vindexes/` | Vindex implementations mapping sharding keys to keyspace ids |
| `go/vt/srvtopo/` | Serving topology: resolves shards and builds the serving graph |
| `go/vt/topo/` | Topology store abstraction over etcd, ZooKeeper, Consul |
| `go/sqltypes/` | MySQL result and value types |

## Core data structures

- `engine.Plan` (`go/vt/vtgate/engine/plan.go:42`) is the execution strategy for a query. It wraps an `Instructions Primitive` tree and carries a `Type` (`PlanType`, with constants starting at `plan.go:75`), the query type, the tables used, and execution stats. The plan cache key is `PlanKey` (`plan.go:64`), built from keyspace, tablet type, destination, query, and collation.
- `engine.Primitive` (`go/vt/vtgate/engine/primitive.go:271`) is the interface every execution node implements: `TryExecute`, `TryStreamExecute`, `GetFields`, `NeedsTransaction`, and `Inputs`. Leaf nodes share default behaviour through embedded `noInputs`, `noTxNeeded`, and `noFields` helpers (`primitive.go:287`).
- `engine.Route` (`go/vt/vtgate/engine/route.go`) is the primitive that runs a real query against one keyspace's shards. It embeds routing parameters and carries an `OrderBy` for merge-sort.
- `vindexes.Vindex` (`go/vt/vtgate/vindexes/vindex.go:52`) abstracts the mapping from a sharding key to a keyspace id. Its `Cost()`, `IsUnique()`, and `NeedsVCursor()` drive how the planner routes.
- `srvtopo.ResolvedShard` (`go/vt/srvtopo/resolver.go:78`) is a resolved destination: a `Target` (keyspace, shard, tablet type) plus the `Gateway` used to reach it.
- `sqltypes.Result` (`go/sqltypes/result.go:31`) is a MySQL result set with `Fields`, `Rows`, `RowsAffected`, and `InsertID`.

## A path worth tracing

Follow one SELECT from VTGate down to the shards.

`Executor.Execute` (`go/vt/vtgate/executor.go:254`) wraps the call in a trace span and `LogStats`, then delegates to the internal `execute`. The real work is in `Executor.newExecute` (`go/vt/vtgate/plan_execute.go:65`). It loops over `MaxBufferingRetries` (`plan_execute.go:90`); inside the loop it fetches or builds the plan (`plan_execute.go:122`), handles transaction statements without touching a shard (`plan_execute.go:156`), injects bind variables the plan needs such as `last_insert_id()` (`plan_execute.go:165`), and then runs the plan (`plan_execute.go:175`).

Execution reaches a leaf at `Route.TryExecute` (`go/vt/vtgate/engine/route.go:133`). It first resolves the target shards, then runs them:

```text
Route.TryExecute            engine/route.go:133
  route.findRoute           engine/route.go:134  -> routing.go:138
    switch rp.Opcode        routing.go:152       Equal / EqualUnique -> one shard
                                                 Scatter -> all shards
  route.executeShards       engine/route.go:148
    vcursor.ExecuteMultiShard  engine/route.go:185   parallel per-shard execution
  route.sort                engine/route.go:205  merge-sort if scatter + OrderBy
  result.Truncate           engine/route.go:211
```

When no shard matches but the query still has meaning at zero rows (for example `count(*)`), the route sends to an arbitrary shard via `route.anyShard` (`engine/route.go:178`).

## Things that surprised me

The `Cost()` method on a Vindex is what lets a non-primary column still resolve to a single shard. A primary Vindex such as hash has cost 1; a secondary lookup Vindex (`go/vt/vtgate/vindexes/lookup.go`) has cost 2 because it reads a separate reverse-mapping table, but it still narrows a search to one shard instead of a scatter. The planner picks the cheapest available routing in the Opcode switch (`routing.go:152`). So scatter avoidance is a planning decision driven by declared cost, not by anything the application writes.

`NeedsVCursor()` on the same interface encodes a real constraint: a Vindex that needs a VCursor cannot be used from VReplication, which is why the capability is part of the interface rather than a runtime check.

`sqltypes.Result` caches its proto3 row encoding so that when multiple consumers share a result during query consolidation, it is not re-encoded each time (`go/sqltypes/result.go:42`). That cache is what makes consolidating identical in-flight queries cheap.

# Internals

> Read from the source at commit `62b10c7` (drasi-platform), with the query engine vendored at submodule commit `a0273f22` (drasi-core). Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `control-planes/mgmt_api` | Management API that accepts declarative Source/Query/Reaction resources |
| `control-planes/kubernetes_provider` | Operator that reconciles those resources into Kubernetes objects |
| `query-container/publish-api` | Entry point Sources post changes to; appends them to a Redis Stream |
| `query-container/query-host` | Runs each query as a Dapr actor, consumes changes, evaluates, and publishes diffs |
| `query-container/view-svc` | Persists the materialized result view of a query |
| `query-container/query-host/drasi-core` | Vendored continuous-query engine (submodule): incremental Cypher evaluation |
| `sources/` | Source connectors (relational/Debezium, Cosmos DB, Dataverse, Event Hubs, Kubernetes) and the Source SDK |
| `reactions/` | Reaction connectors (HTTP, SignalR, Gremlin, Dapr, SQL, and more) and the Reaction SDK |
| `cli/` | The Go `drasi` command-line tool |

The heart of the system is the vendored engine. Inside `drasi-core` the important trees are `core` (the engine), `query-cypher` and `query-ast` (the parser and AST), `functions-cypher` (function implementations), `middleware` (source middleware), and the swappable index backends `in_memory_index`, `index-garnet`, and `index-rocksdb`.

## Core data structures

`ContinuousQuery` (`drasi-core/core/src/query/continuous_query.rs:47`) is the type the whole engine turns on. It holds an `expression_evaluator` and `part_evaluator`, an `element_index: Arc<dyn ElementIndex>`, a `path_solver`, the parsed `match_path` and `query`, a `future_queue`, and a `change_lock: Mutex<()>` (`continuous_query.rs:57`). The lock is what serializes changes: within a single query, changes are processed one at a time so the result stays consistent.

`SourceChange` (from the engine's models) is the tagged form of an incoming change: `Insert { element }`, `Update { element }`, `Delete`, or `Future`, where an element is a graph node or relation. The `ElementIndex` trait keeps every element the query has seen so that an `Update` can fetch the previous version and diff against it; that lookup (`continuous_query.rs:196`) is the precondition for incremental evaluation. Time-dependent predicates rely on `InstantQueryClock`: an update builds a `before_clock` from the previous element's `effective_from` timestamp so a predicate like "three times in the last hour" evaluates correctly against the pre-change world.

## A path worth tracing

Take an `Update` from arrival to published diff. The interesting work is the before/after diff inside the engine.

```text
query_worker.rs:502  process_change(evt)
  :524  continuous_query.process_source_change(source_change)
        continuous_query.rs:89  ContinuousQuery::process_source_change
          :94   change_lock.lock()          serialize changes for this query
          :165  build_solution_changes
                :196  element_index.get_element(reference)   fetch previous version
                :~204 InstantQueryClock (before_clock) from prev timestamp
                :~216 element.merge_missing_properties(prev)  complete the after element
          :~113 project_solution                             emit added/updated/deleted rows
  query_worker.rs:576  publisher.publish(query_id, output)   Dapr pub/sub {query_id}-results
```

`process_change` (`query-container/query-host/src/query_worker.rs:502`) converts the wire event into a `SourceChange` and calls `process_source_change` (`query_worker.rs:524`). In the engine, `process_source_change` (`drasi-core/core/src/query/continuous_query.rs:89`) first takes the `change_lock` (`continuous_query.rs:94`), then hands each change to `build_solution_changes` (`continuous_query.rs:165`). For the `Update` branch it looks up the previous element version through the index (`continuous_query.rs:196`); if there is none, the change is effectively an insert. From the previous element's timestamp it builds a `before_clock` so it can resolve the result set as it stood before the change, and it calls `merge_missing_properties` so a partial update inherits the untouched fields and forms a complete after-element. It then resolves matches for both the before and after worlds, pairs them by signature, and emits the added, updated, and deleted rows. Aggregations are folded so that rows whose value did not actually change are dropped. Back in `query-host`, `process_change` publishes the resulting diff to Dapr pub/sub on `{query_id}-results` (`query_worker.rs:576`; `query-container/query-host/src/result_publisher.rs:47`).

## Things that surprised me

**Each query is a Dapr virtual actor.** `QueryActor` is annotated with the `#[actor]` macro (`query-container/query-host/src/query_actor.rs:42`) and carries an `ActorContextClient` (`query_actor.rs:48`), so a query's lifecycle and state ride on Dapr actor state rather than on bespoke coordination code. Scaling and placement of queries become a Dapr concern.

**The two internal transports are different on purpose.** Source-to-query uses Redis Streams with a consumer group and explicit acks, an at-least-once channel: the group `qh` is created with `xgroup_create_mkstream` (`redis_change_stream.rs:51`, `redis_change_stream.rs:73`) and messages are acked with `xack` (`redis_change_stream.rs:183`). Query-to-reaction uses Dapr pub/sub instead (`result_publisher.rs:47`). The split keeps durable, replayable change ingestion separate from result fan-out.

**The index backend is swappable behind a trait.** `element_index` is an `Arc<dyn ElementIndex>` (`continuous_query.rs:50`), so the same engine runs with an in-memory index for small state or with Garnet (Redis-compatible) or RocksDB for large state, chosen without touching the evaluation code.

**Bootstrap reuses the change path.** Rather than a separate load routine, `bootstrap` (`query_worker.rs:590`) subscribes to the Source (`source_client.rs:48`) and feeds the initial rows into the very same `process_source_change` as inserts (`query_worker.rs:652`), so the initial result set is built by the incremental engine like any other change.

**The engine still answers to "Reactive Graph."** Its earlier codename survives in the test fixtures, where a use-case query declares `apiVersion: query.reactive-graph.io/v1` (`drasi-core/shared-tests/src/use_cases/rolling_average_decrease_by_ten/queries.rs:18`).

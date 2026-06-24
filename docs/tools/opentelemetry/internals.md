# Internals

> Read from the source at commit `415d3dca`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `service/internal/graph/` | Builds the component DAG and drives start, consume, and shutdown |
| `consumer/` | The `Traces`, `Metrics`, `Logs` interfaces that wire stages together |
| `internal/fanoutconsumer/` | Fans one stream out to many exporters with copy minimization |
| `pdata/` | The OTLP in-memory data model (`ptrace`, `pmetric`, `plog`) |
| `pipeline/` | `pipeline.ID` and the signal type |
| `service/pipelines/` | The pipeline config map type |
| `otelcol/` | Collector settings, config loading, lifecycle |
| `cmd/otelcorecol/` | Generated core test distribution binary |

## Core data structures

- `Graph` (`service/internal/graph/graph.go:60`): holds `componentGraph *simple.DirectedGraph`, `pipelines map[pipeline.ID]*pipelineNodes`, and `instanceIDs`. It is the DAG itself.
- `pipelineNodes` (`service/internal/graph/graph.go:385`): the node set for one pipeline. Receivers and exporters are maps for deduplication, processors are a slice for ordering, plus a `capabilitiesNode` and a `fanOutNode`.
- `consumer.Traces` and its siblings (`consumer/traces.go:15`): the inter-stage wiring abstraction. `ConsumeTraces(ctx, ptrace.Traces) error` passes data to the next node.
- `consumer.Capabilities{MutatesData bool}` (`consumer/internal/consumer.go:13`): tells the graph whether a stage rewrites data, which drives the copy decision below.
- `ptrace.Traces` and friends (`pdata/ptrace/traces.go`): the OTLP in-memory form, with `MarkReadOnly()` (`pdata/ptrace/traces.go:7`) and `IsReadOnly()` (`pdata/ptrace/traces.go:12`) gating safe sharing.
- `pipelines.Config = map[pipeline.ID]*PipelineConfig` (`service/pipelines/config.go:25`), keyed by `pipeline.ID`, which is a signal plus a name (`pipeline/pipeline.go:18`).

## A path worth tracing

`Build` (`service/internal/graph/graph.go:75`) constructs the whole pipeline graph in three passes.

1. `createNodes` (`service/internal/graph/graph.go:98`) walks each pipeline config and makes receiver, processor, and exporter nodes. For connectors it checks the exporter-side and receiver-side signal combination with `connectorStability` (`service/internal/graph/graph.go:551`) and returns an explicit error if the pairing is unsupported (`service/internal/graph/graph.go:177`).
2. `createEdges` (`service/internal/graph/graph.go:265`) draws edges: receiver to capabilities node, then the processor chain, then a fanout node, then each exporter. The fanout node is always inserted, even for a single exporter (`service/internal/graph/graph.go:280`).
3. `buildComponents` (`service/internal/graph/graph.go:294`) topologically sorts the nodes, then instantiates them in reverse order with `slices.Backward` so each downstream consumer exists before the upstream stage that feeds it.

Startup uses the same reverse-topological order so a consumer is ready before its producer starts (`service/internal/graph/graph.go:403`), and shutdown uses forward order so each stage can drain to its consumer before that consumer stops (`service/internal/graph/graph.go:450`).

```text
Build
  -> createNodes      (one node per component, validate connectors)
  -> createEdges      (receiver -> capabilities -> processors -> fanout -> exporters)
  -> buildComponents  (topo.Sort, instantiate via slices.Backward)
```

## Things that surprised me

The fanout path optimizes copies based on what the config can mutate. `NewTraces` (`internal/fanoutconsumer/traces.go:19`) splits the downstream consumers into `mutable` and `readonly` by their `MutatesData` capability. If there is a single non-mutating consumer it skips the wrapper entirely (`internal/fanoutconsumer/traces.go:21`). For the mutating consumers it clones the data for all but the last, and gives the original to the last only when no read-only consumer exists and the data is not already read-only (`internal/fanoutconsumer/traces.go:50`). When more than one read-only consumer remains, it calls `MarkReadOnly()` once and shares the same data (`internal/fanoutconsumer/traces.go:67`).

The decision is precomputed at build time. The `capabilitiesNode` folds the `MutatesData` flags of the pipeline's processors and its fanout node together with OR (`service/internal/graph/graph.go:312`), so a receiver knows whether it must clone before handing data downstream. Mutability that the config implies is analyzed once, so runtime copies are kept to the minimum the pipeline actually needs.

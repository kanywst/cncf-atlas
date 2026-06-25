# Internals

> Read from the source at commit `42c26e7`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/cortex/main.go` | Binary entry point. |
| `pkg/cortex/cortex.go` | Top-level config and service assembly (`-target`, auth defaults). |
| `pkg/cortex/modules.go` | Module name declarations and wiring (`:74-106`). |
| `pkg/api/api.go` | HTTP route registration, including `POST /api/v1/push` (`:296`). |
| `pkg/util/push/push.go` | Remote-write decode handler (`:49`). |
| `pkg/distributor/distributor.go` | Write-path validation, sharding, fan-out. |
| `pkg/ring/` | Hash ring membership, token ownership, batched dispatch. |
| `pkg/ingester/ingester.go` | Per-tenant TSDB head append, flush, ship. |
| `pkg/cortexpb/` | Remote-write protobuf wire types and pooling. |

## Core data structures

- `cortexpb.WriteRequest` (`pkg/cortexpb/cortex.pb.go:189`): the remote-write wire message, carrying `Timeseries []PreallocTimeseries` plus metadata and source.
- `cortexpb.PreallocTimeseries` (`pkg/cortexpb/timeseries.go:78`): embeds `*TimeSeries` and, on `Unmarshal`, takes its backing slice from a `sync.Pool` via `TimeseriesFromPool()` (`pkg/cortexpb/timeseries.go:83`) to reduce GC pressure.
- `ring.Desc` and `ring.InstanceDesc` (`pkg/ring/ring.pb.go:65`, `:108`): the whole ring is a `map[string]InstanceDesc`; each instance holds `Addr`, a heartbeat `Timestamp`, `State`, `Tokens`, and `Zone`. The tokens decide which hash range an instance owns.
- `ingester.userTSDB` (`pkg/ingester/ingester.go:376`): the per-tenant `*tsdb.DB` wrapper that tracks active series, the limiter, state, inflight push/read wait groups, and the Thanos shipper. It is the unit of flush, idle detection, and deletion.
- `distributor.Distributor` (`pkg/distributor/distributor.go:85`): the stateless write service that ties together the ring reference, rate limiter, HA tracker, and metrics.

## A path worth tracing

Trace one remote write end to end. `(*Distributor).Push` (`pkg/distributor/distributor.go:747`) immediately sets up a deferred cleanup that returns pooled slices on the validation-error path:

```go
func (d *Distributor) Push(ctx context.Context, req *cortexpb.WriteRequest) (*cortexpb.WriteResponse, error) {
    var validationError = true
    defer func() {
        if validationError {
            cortexpb.ReuseSlice(req.Timeseries)
            req.Free()
        }
    }()
```

After validation, sharding, and rate checks, the fan-out goes through `doBatch` (`pkg/distributor/distributor.go:980`), which calls `ring.DoBatch` (`pkg/ring/batch.go:74`). For each key, the ring resolves a replication set (`pkg/ring/batch.go:93`) and `record` (`pkg/ring/batch.go:151`) classifies each instance's result to decide quorum. The owning ingester then runs `(*Ingester).Push` (`pkg/ingester/ingester.go:1324`), which appends to the per-tenant TSDB head.

## Things that surprised me

The hot write path is built around aggressive object reuse and `unsafe` zero-copy deserialization. Both the distributor and the ingester return pooled timeseries slices through deferred `req.Free()` and `cortexpb.ReuseSlice(req.Timeseries)` calls (`pkg/distributor/distributor.go:749-754`, `pkg/ingester/ingester.go:1352-1355`). The ingester spells out the constraint that comes with it:

```go
// NOTE: because we use `unsafe` in deserialisation, we must not
// retain anything from `req` past the call to ReuseSlice
defer req.Free()
defer cortexpb.ReuseSlice(req.Timeseries)
```

Because labels are `unsafe` references into the original buffer, nothing from `req` may be retained after the pool returns. This is the deliberate trade-off that keeps GC pressure down under high-cardinality, high-throughput ingestion.

The second surprise is in `doBatch` (`pkg/distributor/distributor.go:984`): the ingester sends run under a fresh background context with `RemoteTimeout`, not the caller's context. An early client disconnect or timeout will not abort in-flight batches, so replication quorum is preserved even when the original request goes away.

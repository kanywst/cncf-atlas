# Internals

> Read from the source at commit `fc561264`. Every claim here should point at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `tsdb/` | Local time series storage: head (in-memory), blocks (persistent), WAL, mmapped chunks |
| `scrape/` | The scrape loop and metric parsing |
| `promql/` | PromQL parser (`promql/parser/`) and evaluation engine (`promql/engine.go`) |
| `storage/` | The `Storage`, `Appender`, and `Querier` abstractions: fanout, remote, merge |
| `discovery/` | Service discovery plugins, selectable with build tags (README:114-144) |
| `web/` | The HTTP API v1 and React UI (`web/ui/`) |
| `cmd/prometheus/` | Entry point `func main()` (`cmd/prometheus/main.go:365`) that wires everything together |

## Core data structures

`Head` (`tsdb/head.go:71`) is the in-memory, currently-filling block. It holds the series set as `series *stripeSeries` (`tsdb/head.go:115`), an inverted index `postings *index.MemPostings` (`tsdb/head.go:121`) mapping label terms to series IDs, the write-ahead logs `wal, wbl *wlog.WL` (`tsdb/head.go:87`), and `iso *isolation` (`tsdb/head.go:125`).

`memSeries` (`tsdb/head.go:2515`) is one time series. It keeps three layers of chunks: `mmappedChunks []*mmappedChunk` for past chunks already mmapped to disk (`tsdb/head.go:2538`), `headChunks *memChunk` for the chunk still being built as a linked list (`tsdb/head.go:2543`), and `ooo *memSeriesOOOFields` for out-of-order data (`tsdb/head.go:2546`). It also carries `txs *txRing` for isolation (`tsdb/head.go:2574`).

`headAppender` (`tsdb/head_append.go:425`) is the transaction for one scrape. It accumulates samples in a batch and applies them all at `Commit`. The minimal unit written to the WAL is `record.RefSample` (series ref, timestamp, value), produced in `Append` (`tsdb/head_append.go:497`).

## A path worth tracing

`headAppender.Append` (`tsdb/head_append.go:434`) is where a parsed sample becomes durable state. It resolves the series by reference, falling back to creation if the ref is unknown:

```go
s := a.head.series.getByID(chunks.HeadSeriesRef(ref))
```

That lookup is at `tsdb/head_append.go:442`. It then asks the series whether the sample is acceptable given ordering and the out-of-order window:

```go
isOOO, delta, err := s.appendable(t, v, a.headMaxt, a.minValidTime, a.oooTimeWindow)
```

This `appendable` check at `tsdb/head_append.go:475` is the gate that decides in-order versus out-of-order handling. If the sample passes, it is buffered as a `record.RefSample` (`tsdb/head_append.go:497`) rather than written immediately. The actual WAL write and head-chunk update happen later, in the deferred `Commit` that the scrape loop set up (`scrape/scrape.go:1368`).

## Things that surprised me

- **Three-stage chunk lifecycle.** A head chunk is built in memory, mmapped to disk as a `mmappedChunk` once it reaches size, and eventually compacted into a block. The `memSeries` comment lays this out, including how compaction shifts the `mmappedChunks` pointers (`tsdb/head.go:2529-2544`). Crash recovery replays the WAL. The effect is bounded RAM while recent data stays hot.
- **Per-series MVCC.** Isolation is implemented per series with `txs *txRing` (`tsdb/head.go:2574`, `tsdb/isolation.go`), so uncommitted samples are invisible to in-flight queries. Read consistency comes from this ring, not a global lock.
- **Stale-marker fast path inlined into Append.** Stale NaN values get converted to histogram or float-histogram staleness inline in `Append` (`tsdb/head_append.go:451-469`) to avoid allocating a new batch.
- **Pooled scrape buffers.** The scrape body `[]byte` is taken from and returned to a pool (`scrape/scrape.go:1410-1411`). Cutting allocations on the hot path is an explicit project convention documented in `AGENTS.md`.
- **Out-of-order samples are physically separate.** When `oooTimeWindow` allows late data, it lands in a separate chunk (`oooHeadChunk`) and a separate WAL (`wbl`), keeping the in-order path simple (`tsdb/head_append.go:475`, `memSeriesOOOFields`).

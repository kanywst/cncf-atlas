# Internals

> Read from the source at commit `cc24370`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/thanos/` | One file per subcommand; `main.go` is the dispatcher (`cmd/thanos/main.go:34`). |
| `pkg/store/` | StoreAPI core: `proxy.go` (Querier fan-out), `bucket.go` (`BucketStore`, `pkg/store/bucket.go:384`), `storepb/` (gRPC definitions). |
| `pkg/query/` | PromQL engine and Querier logic. |
| `pkg/receive/` | Remote-write ingestion (push path). |
| `pkg/compact/`, `pkg/compactv2/` | Compaction and downsampling. |
| `pkg/block/`, `pkg/block/metadata/` | TSDB block metadata (`pkg/block/metadata/meta.go`). |
| `pkg/shipper/` | Uploads local TSDB blocks to object storage (`pkg/shipper/shipper.go:344`). |
| `pkg/dedup/`, `pkg/losertree/` | HA-pair deduplication and k-way merge. |

## Core data structures

- **`ProxyStore`** (`pkg/store/proxy.go:84`): the Querier's StoreAPI implementation. It holds `stores func() []Client` (a dynamic store set), `selectorLabels`, `retrievalStrategy`, `enableDedup`, `tsdbSelector`, and a `buffers sync.Pool`.
- **`Client` interface** (`pkg/store/proxy.go:52`): embeds `storepb.StoreClient` and adds `LabelSets()`, `TimeRange()`, `SupportsSharding()`, and `SupportsWithoutReplicaLabels()`. This is the one type that lets sidecar, store gateway, receive, and other Queriers be bundled without distinction.
- **`losertree.Tree[E, S]`** (`pkg/losertree/tree.go:46`): the tournament tree. Leaf nodes sit at positions `M..2M-1`, internal nodes at `1..M-1`, and node 0 holds the winner. A node's `index` is the loser for every node except node 0, where it is the winner (`pkg/losertree/tree.go:43-58`).
- **`metadata.Meta` / `metadata.Thanos`** (`pkg/block/metadata/meta.go:66,77`): the `meta.json` type, a TSDB `BlockMeta` plus Thanos fields like `Labels` (external labels), `Downsample.Resolution`, and `Source`.
- **`storepb.SeriesRequest`** (`pkg/store/storepb/rpc.proto:63`): the common request for every StoreAPI call, carrying `min_time`, `max_time`, `matchers`, `aggregates`, `max_resolution_window`, `shard_info`, `partial_response_strategy`, and `without_replica_labels`.

## A path worth tracing

The merge that creates the global view lives in `ProxyStore.Series` (`pkg/store/proxy.go:277`). After each downstream store is opened as an async response set, all of them are loaded into one loser tree and pulled in sorted order:

```go
var respHeap seriesStream = NewProxyResponseLoserTree(storeResponses...)
if s.enableDedup {
    respHeap = NewResponseDeduplicator(respHeap)
}

i := 0
for respHeap.Next() {
    i++
    if r.Limit > 0 && i > int(r.Limit) {
        break
    }
    resp := respHeap.At()
    ...
    if err := srv.Send(resp); err != nil {
        ...
    }
}
```

`NewProxyResponseLoserTree` builds `losertree.New[*storepb.SeriesResponse, respSet]` over the per-store streams (`pkg/store/proxy_merge.go:197,228`). Each `Next()` advances the tournament so the smallest series across all streams is emitted next, streaming the merged result without materializing every series in memory.

## Things that surprised me

- **Dedup is deliberately absent from the fan-in.** The `NewProxyStore` comment is explicit: there is no deduplication support, and dedup should be done at the highest level, just before PromQL (`pkg/store/proxy.go:160-161`). The proxy only wraps the merge in a `ResponseDeduplicator` when the top-level option is set (`pkg/store/proxy.go:377-379`). This keeps stacked Queriers from deduplicating the same data twice.
- **The merge is borrowed, not invented.** The loser tree carries an attribution comment to [go-loser](https://github.com/bboreham/go-loser) by Bryan Boreham and to the [K-way merge Tournament Tree](https://en.wikipedia.org/wiki/K-way_merge_algorithm#Tournament_Tree) (`pkg/losertree/tree.go:4-6`).
- **One interface makes federation free.** Because `Client` (`pkg/store/proxy.go:52`) treats every StoreAPI source identically and the Querier is itself a StoreAPI server, stacking Queriers into federated layers needs no extra machinery. The `rpc.proto` comment ties the chunk min-time sort recommendation to that federated-query optimization (`pkg/store/storepb/rpc.proto:35`).

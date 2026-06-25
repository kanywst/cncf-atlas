# 内部実装

> コミット `cc24370` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/thanos/` | サブコマンドごとに 1 ファイル。`main.go` がディスパッチャ (`cmd/thanos/main.go:34`)。 |
| `pkg/store/` | StoreAPI の中核: `proxy.go` (Querier のファンアウト)、`bucket.go` (`BucketStore`, `pkg/store/bucket.go:384`)、`storepb/` (gRPC 定義)。 |
| `pkg/query/` | PromQL エンジンと Querier ロジック。 |
| `pkg/receive/` | remote-write 取り込み (push パス)。 |
| `pkg/compact/`, `pkg/compactv2/` | コンパクションとダウンサンプリング。 |
| `pkg/block/`, `pkg/block/metadata/` | TSDB ブロックのメタ管理 (`pkg/block/metadata/meta.go`)。 |
| `pkg/shipper/` | ローカル TSDB ブロックをオブジェクトストレージに上げる (`pkg/shipper/shipper.go:344`)。 |
| `pkg/dedup/`, `pkg/losertree/` | HA ペアの重複除去と k-way merge。 |

## 中核データ構造

- **`ProxyStore`** (`pkg/store/proxy.go:84`): Querier の StoreAPI 実装。`stores func() []Client` (動的なストア集合)、`selectorLabels`、`retrievalStrategy`、`enableDedup`、`tsdbSelector`、`buffers sync.Pool` を持つ。
- **`Client` インターフェース** (`pkg/store/proxy.go:52`): `storepb.StoreClient` を埋め込み、`LabelSets()`、`TimeRange()`、`SupportsSharding()`、`SupportsWithoutReplicaLabels()` を足す。sidecar・store gateway・receive・別 Querier を区別せず束ねられるのはこの 1 つの型のおかげ。
- **`losertree.Tree[E, S]`** (`pkg/losertree/tree.go:46`): トーナメント木。葉ノードは位置 `M..2M-1`、内部ノードは `1..M-1`、ノード 0 に勝者を置く。ノードの `index` はノード 0 以外では敗者、ノード 0 では勝者を指す (`pkg/losertree/tree.go:43-58`)。
- **`metadata.Meta` / `metadata.Thanos`** (`pkg/block/metadata/meta.go:66,77`): `meta.json` の型。TSDB の `BlockMeta` に `Labels` (外部ラベル)、`Downsample.Resolution`、`Source` 等の Thanos 固有フィールドを足す。
- **`storepb.SeriesRequest`** (`pkg/store/storepb/rpc.proto:63`): 全 StoreAPI 呼び出し共通の要求。`min_time`、`max_time`、`matchers`、`aggregates`、`max_resolution_window`、`shard_info`、`partial_response_strategy`、`without_replica_labels` を運ぶ。

## 追う価値のあるパス

グローバルビューを作るマージは `ProxyStore.Series` (`pkg/store/proxy.go:277`) にある。各下流ストアを非同期レスポンスセットとして開いた後、それら全てを 1 つの loser tree に載せ、ソート順に取り出す。

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

`NewProxyResponseLoserTree` はストアごとのストリーム上に `losertree.New[*storepb.SeriesResponse, respSet]` を構築する (`pkg/store/proxy_merge.go:197,228`)。各 `Next()` がトーナメントを進め、全ストリームをまたいで最小の系列を次に送出する。これにより、全系列をメモリに展開せずマージ結果をストリーミングできる。

## 読んで驚いた点

- **dedup は意図的にファンインから外されている。** `NewProxyStore` のコメントは明確だ: 重複除去のサポートはなく、dedup は PromQL 直前の最上位で行うべき (`pkg/store/proxy.go:160-161`)。プロキシは最上位オプションが設定されたときだけマージを `ResponseDeduplicator` で包む (`pkg/store/proxy.go:377-379`)。これで多段の Querier が同じデータを二重に重複除去するのを防ぐ。
- **マージは発明ではなく借用。** loser tree には Bryan Boreham の [go-loser](https://github.com/bboreham/go-loser) と [K-way merge の Tournament Tree](https://en.wikipedia.org/wiki/K-way_merge_algorithm#Tournament_Tree) への出典コメントが付く (`pkg/losertree/tree.go:4-6`)。
- **1 つのインターフェースが federation を無料にする。** `Client` (`pkg/store/proxy.go:52`) が全 StoreAPI ソースを同一に扱い、Querier 自身も StoreAPI サーバーなので、Querier を federated レイヤーに積むのに追加の仕掛けは要らない。`rpc.proto` のコメントは、チャンクの min-time ソート推奨をその federated クエリ最適化に紐づける (`pkg/store/storepb/rpc.proto:35`)。

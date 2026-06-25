# 内部実装

> コミット `8f970f0` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/contour/contour.go` | プロセスのエントリポイントと kingpin サブコマンドの配線 (`cmd/contour/contour.go:30`)。 |
| `cmd/contour/serve.go` | `serve` コマンド。DAG Processor 列・各キャッシュ・xDS サーバを構築する。 |
| `internal/contour/handler.go` | `EventHandler`。デバウンスして DAG 再構築を起こすシングルスレッドのイベントループ。 |
| `internal/dag` | DAG モデルと、Kubernetes オブジェクトをグラフに変換する Processor。 |
| `internal/xdscache` (および `v3`) | DAG を Envoy の xDS リソースに変換しキャッシュする。 |
| `internal/xds` (および `v3`) | Envoy へリソースを配信する gRPC サーバとノード ID hasher。 |
| `internal/k8s` | informer・status updater・クライアント。 |
| `apis/projectcontour` | `HTTPProxy` 等の CRD 型定義。 |

## 中核データ構造

- `dag.DAG` (`internal/dag/dag.go:60`) は `StatusCache`・`Listeners map[string]*Listener`・`ExtensionClusters`・`HasDynamicListeners` を持つ。1 回の Build で作られる不変スナップショットである。
- `dag.Builder` と `KubernetesCache` (`internal/dag/builder.go:44-55`): `Source` がオブジェクト供給源、`Processors` が順序付き変換器。
- ルーティングモデル: `dag.VirtualHost` と `dag.SecureVirtualHost` (`internal/dag/dag.go:755` 付近)、`dag.Route` (`internal/dag/dag.go:307`)、Prefix/Exact/Regex/Header/QueryParam の `MatchCondition` 実装群 (`internal/dag/dag.go:73-237`)。
- `contour.EventHandler` (`internal/contour/handler.go:45-73`): holdoff バッチ付きシングルスレッドのイベントループ。`update`/`sequence` チャネルと `syncTracker` を持つ。
- `xdscache_v3.SnapshotHandler` (`internal/xdscache/v3/snapshot.go:35-41`): `defaultCache` (SnapshotCache)・`edsCache` (LinearCache)・`mux` (MuxCache)。

## 追う価値のあるパス

エンドポイントだけが他と分岐する様子を追う。`NewSnapshotHandler` は 2 つのキャッシュと、各 discovery リクエストを type URL で分類する mux を構築する (`internal/xdscache/v3/snapshot.go:44-71`):

```go
defaultCache = envoy_cache_v3.NewSnapshotCache(false, &contour_xds_v3.Hash, ...)
// Envoy will open EDS stream per CDS entry.
// LinearCache mitigates the issue where all EDS streams are notified of any endpoint changes...
edsCache = envoy_cache_v3.NewLinearCache(envoy_resource_v3.EndpointType, ...)

mux = &envoy_cache_v3.MuxCache{
    Caches: map[string]envoy_cache_v3.Cache{},
    Classify: func(req *envoy_service_discovery_v3.DiscoveryRequest) string {
        return req.GetTypeUrl()
    },
    ...
}
```

DAG が変わると `SnapshotHandler.OnChange` (`internal/xdscache/v3/snapshot.go:137-163`) がエンドポイント以外の全リソース型のスナップショットを構築する。エンドポイントは専用キャッシュを使うため明示的にスキップする:

```go
for resourceType, resourceCache := range s.resources {
    // Endpoints use their own cache.
    if resourceType == envoy_resource_v3.EndpointType {
        continue
    }
    resources[resourceType] = asResources(resourceCache.Contents())
}
snapshot, err := envoy_cache_v3.NewSnapshot(version, resources)
...
s.defaultCache.SetSnapshot(context.Background(), contour_xds_v3.Hash.String(), snapshot)
```

スナップショットは `contour_xds_v3.Hash.String()` をキーに格納される。これは全 Envoy が共有する 1 個の定数キーである。

## 読んで驚いた点

- **ルートは Envoy 型ではなく Contour 型でソートする**。`RouteCache.OnChange` は Envoy proto に変換する前に `dag.Route` 値に対して `sortRoutes(routes)` を呼ぶ (`internal/xdscache/v3/route.go:90`)。理由はコメントにある (`internal/xdscache/v3/route.go:144-154`): 1 つの Contour マッチ型は時とともに異なる Envoy マッチ型で実装されうる (例: 別種のマッチを regex matcher で実装) ため、Contour 型でソートすれば下層の Envoy 実装に関係なく最も具体的な順序を保てる。
- **ノード ID は定数**。`ConstantHash.ID` は引数のノードを無視して文字列 `"contour"` を返す (`internal/xds/v3/hash.go:21-30`)。接続してくる全 Envoy が 1 個のスナップショットを共有する。
- **初回 DAG 完成には 2 条件**。`syncTracker` (`synctrack.SingleFileTracker`) は、Kubernetes が初期オブジェクト一覧の送信を終え、かつその一覧の全項目がイベントループで処理されたときにのみ初回 DAG 完成と判定する (`internal/contour/handler.go:63-72`, `internal/contour/handler.go:234-238`)。

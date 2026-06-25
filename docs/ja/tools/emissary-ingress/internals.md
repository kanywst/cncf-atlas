# 内部実装

> コミット `65b0dd9ae` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/busyambassador/main.go` | `os.Args[0]` による BusyBox 方式ディスパッチで `entrypoint` / `kubestatus` / `version` に振り分け |
| `cmd/entrypoint/` | Go のプロセスマネージャ、クラスタ watcher、notify ロジック |
| `cmd/apiext/` | `emissary-apiext` CRD 変換 webhook |
| `pkg/ambex/` | Envoy に xDS で設定を流す ADS サーバ |
| `pkg/snapshot/v1/` | watcher が組み立てる `Snapshot` / `KubernetesSnapshot` 型 |
| `pkg/api/getambassador.io/` | `v1` / `v2` / `v3alpha1` の CRD Go 型 |
| `python/ambassador/src/ambassador/ir/` | 中間表現とそのファクトリ群 |
| `python/ambassador/src/ambassador/envoy/v3/` | Envoy v3 設定ジェネレータ |
| `python/ambassador-diag/src/ambassador_diag/diagd.py` | diagd の Flask サービスとコンパイルパイプライン |

## 中核データ構造

- `snapshot.Snapshot` と `KubernetesSnapshot` (Go) は watcher が組み立てる世界の状態一式。`KubernetesSnapshot` は Mappings・Hosts・Listeners・Services・Endpoints・Secrets・Gateway API オブジェクトを抱える (`pkg/snapshot/v1/types.go:23`、`pkg/snapshot/v1/types.go:57`、`pkg/snapshot/v1/types.go:84-87`)。
- `IR` (Python) は中間表現。`clusters: Dict[str, IRCluster]`・`groups: Dict[str, IRBaseMappingGroup]`・`listeners: Dict[str, IRListener]` などの辞書群を持つ (`python/ambassador/src/ambassador/ir/ir.py:90-118`)。
- `EnvoyConfig` (Python) は `IR` から生成され、`split_config()` で bootstrap 設定・ADS 設定・clustermap に割れる (`python/ambassador-diag/src/ambassador_diag/diagd.py:1628`、`python/ambassador-diag/src/ambassador_diag/diagd.py:1635`)。
- `FastpathSnapshot` (Go) は Python を飛ばすパス用に `ecp_v3_cache.Snapshot` と `*Endpoints` を運ぶ (`pkg/ambex/fastpath.go:7-11`)。
- `MappingSpec` (Go, `v3alpha1`) はユーザ向けのルーティングリソース (`pkg/api/getambassador.io/v3alpha1/crd_mapping.go:27`)。

## 追う価値のあるパス

`Mapping` リソースが Envoy のライブなルートになるまでを追う。

1. watcher が snapshot を組み立てる。`WatchAllTheThings` (`cmd/entrypoint/watcher.go:26`) がクラスタを watch し `snapshot.Snapshot` を組み立てる (`cmd/entrypoint/watcher.go:201`)。
2. `SnapshotReady` で (`cmd/entrypoint/watcher.go:106-118`) `notify` クロージャが `notifyReconfigWebhooks` を発火する (`cmd/entrypoint/watcher.go:62-67`)。
3. それが diagd に POST する。`notifyWebhookUrl` が `GetEventUrl` の URL に POST し (`cmd/entrypoint/notify.go:42`、`cmd/entrypoint/env.go:244`)、ポート 8004 の `_internal/v0/watt?url=<snapshot>` に解決される (`cmd/entrypoint/env.go:153`)。
4. diagd が受信する。`handle_watt_update` が `?url=` を読み `("watt", url)` をキューに入れる (`python/ambassador-diag/src/ambassador_diag/diagd.py:916`)。
5. diagd がパースする。`load_config_watt` が snapshot を fetch しディスクに保存し `Config` に流し込む (`python/ambassador-diag/src/ambassador_diag/diagd.py:1539`)。
6. diagd がコンパイルする。`_load_ir` が `IR.check_deltas` で complete か incremental かを判定し、`IR` を構築し、`EnvoyConfig.generate` に続けて `split_config()` を呼ぶ (`python/ambassador-diag/src/ambassador_diag/diagd.py:1585-1635`)。Mapping は `MappingFactory.load_all` で `IRHTTPMapping` 群になる (`python/ambassador/src/ambassador/ir/irmappingfactory.py:28`)。
7. diagd が検証する。`validate_envoy_config` が `envoy --mode validate` を走らせ、invalid ならエラーを返して現行設定を維持する (`python/ambassador-diag/src/ambassador_diag/diagd.py:1652`)。
8. ambex が配信する。検証済み設定がディスクに書かれ、ambex が go-control-plane の `SnapshotCache` に読み込み、`127.0.0.1:8003` の ADS で Envoy に push する (`pkg/ambex/main.go:6-40`、`cmd/entrypoint/entrypoint.go:164-167`)。

```text
WatchAllTheThings -> SnapshotReady -> notifyReconfigWebhooks
  -> POST _internal/v0/watt?url= -> handle_watt_update
  -> load_config_watt -> _load_ir (IR -> EnvoyConfig -> split_config)
  -> validate_envoy_config (envoy --mode validate)
  -> ambex SnapshotCache -> ADS push -> envoy
```

## 読んで驚いた点

- **endpoint ファストパスは Python を丸ごと飛ばす。** Pod churn は EDS の endpoint を変えるがルーティング構造は変えないので、entrypoint は endpoint だけの更新を `fastpathCh chan *ambex.FastpathSnapshot` で直接 ambex に渡し (`cmd/entrypoint/entrypoint.go:163-167`)、ambex は EDS データだけを差し替える (`pkg/ambex/fastpath.go:7`)。激しい Pod churn 下でのリコンフィグ嵐を避けるためである。
- **Emissary は swap 前に本物の Envoy で設定を検証する。** 生成した ADS 設定を `envoy --mode validate` に通し、失敗時はライブ設定を触らない (`python/ambassador-diag/src/ambassador_diag/diagd.py:1652`)。Emissary 自身の生成バグがユーザのトラフィックを落とせない。
- **CRD のバージョン差はエンジンから隠蔽される。** 複数バージョン (`v1`・`v2`・`v3alpha1`) が併存するが、in-cluster の `emissary-apiext` 変換 webhook (`cmd/apiext/main.go`、`pkg/apiext`) のおかげで Python エンジンが見るのは常に `v3alpha1` だけで、バージョン差を意識する必要がない。

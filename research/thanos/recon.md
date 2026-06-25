# recon: Thanos

CNCF Incubating / カテゴリ Observability。Prometheus をそのまま拡張し、オブジェクトストレージで無制限・低コストな長期保存とグローバルなクエリビューを足すメトリクスシステム。Go 製の単一バイナリ、複数サブコマンド（sidecar / store / query / rule / compact / receive / query-frontend / tools）構成。

## 基本情報

- repo: [thanos-io/thanos](https://github.com/thanos-io/thanos)
- 解決理由: CNCF landscape と公式サイト [thanos.io](https://thanos.io/) が指す唯一の実装リポジトリ。組織 [github.com/thanos-io](https://github.com/thanos-io) 直下の本体。
- pinned commit: `cc24370da67cc3a78c32caaee5af53b87da9f0d5`（main、2026-06-23 17:24:59 +0300）
- 近いタグ: `v0.42.0-rc.0`（2026-06-23、`gh api compare` で main は rc.0 から ahead 4 / behind 2 の diverged）。直近の安定版は `v0.41.0`（2026-02-12）。
- 言語 / ビルド: Go（`go.mod` の `go 1.26.0`）/ `make build`（`src/Makefile:149`、promu 経由で単一 `thanos` バイナリ）
- ライセンス: Apache-2.0。`src/LICENSE` 冒頭が "Apache License Version 2.0, January 2004" であることを実ファイルで確認。GitHub API の `license.spdx_id` も `Apache-2.0`。
- CNCF 成熟度: Incubating
- カテゴリ (tools.ts の CATEGORY_ORDER から): Observability
- メインエントリ: `cmd/thanos/main.go:34` の `func main()`。`extkingpin` でサブコマンド登録（`main.go:56-63`）、`app.Parse()` で選ばれた 1 コマンドを実行。
- 配布: GitHub Releases のバイナリ、`quay.io/thanos/thanos` の Docker イメージ。約 6 週ごとのマイナーリリース。

## 歴史の素材

- 2017 年末、ロンドンの Improbable で Bartłomiej Płotka と Fabian Reinartz が開始。2018 年初頭に公開。Prometheus を安価にスケールさせる業務課題が動機（[YouTube: Fabian Reinartz and Bartlomiej Plotka: Thanos](https://www.youtube.com/watch?v=l8syWgJ98sk)）。
- CNCF 受理 2019-07-14、Incubating 昇格 2020-08-19（[CNCF blog](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/)、[CNCF project page](https://www.cncf.io/projects/thanos/)）。
- ガバナンス: 単一企業から離れ CNCF ガバナンス下のマルチベンダ運営。`src/MAINTAINERS.md` の core maintainer は Google / Polar Signals / Vinted / Red Hat / AWS / Shopify / Cloudflare 所属の 9 名。
- セキュリティ自己評価が [CNCF TAG Security](https://tag-security.cncf.io/community/assessments/projects/thanos/self-assessment/) に存在。

## アーキテクチャの素材

トップレベル構成。

- `cmd/thanos/` — サブコマンドごとの 1 ファイル（`sidecar.go` / `store.go` / `query.go` / `rule.go` / `compact.go` / `receive.go` / `query_frontend.go` / `tools.go`）。`main.go` は薄いディスパッチャ。
- `pkg/store/` — StoreAPI の心臓部。`proxy.go`（Querier のファンアウト）、`bucket.go`（objstore 上のブロックを読む BucketStore、`bucket.go:384`）、`storepb/`（gRPC 定義）。
- `pkg/query/` — PromQL エンジンと Querier ロジック。
- `pkg/receive/` — remote write 受信（push 型取り込み）。
- `pkg/compact/`, `pkg/compactv2/` — コンパクション + ダウンサンプリング。
- `pkg/block/`, `pkg/block/metadata/` — TSDB ブロックのメタ管理（`meta.go`）。
- `pkg/shipper/` — ローカル TSDB ブロックを objstore に上げる（`shipper.go:344` の `Sync`）。
- `pkg/dedup/`, `pkg/losertree/` — HA ペアの重複除去と k-way マージ。
- `pkg/api/`, `pkg/ui/`, `pkg/queryfrontend/` — HTTP API・UI・クエリ分割/キャッシュ。objstore は外部依存 `thanos-io/objstore`。

代表的コア操作: Querier の StoreAPI ファンアウト `Series()`。Querier が PromQL を評価するとき配下の全 StoreAPI（sidecar / store gateway / receive / ruler / さらに別 Querier）へ並列に gRPC `Series` ストリームを張り、ソート済みストリームを k-way マージして 1 本のソート済み系列に統合する。これが "global view" の実体。

- StoreAPI 契約: `pkg/store/storepb/rpc.proto:26` の `service Store`、`rpc Series(SeriesRequest) returns (stream SeriesResponse)`（`rpc.proto:39`）。コメントで「系列はソート済みでストリームすること」が規定される。
- 入口: `pkg/store/proxy.go:277` `func (s *ProxyStore) Series(...)`。
  1. `proxy.go:287` `matchesExternalLabels` で外部ラベルセレクタとマッチャを突き合わせ、無関係なら早期 return。
  2. `proxy.go:302-309` テナント情報を gRPC metadata から取り出し outgoing context に再付与（マルチテナント）。
  3. `proxy.go:312` `matchingStores` で時間範囲とマッチャから対象ストアを絞る。0 件なら return。
  4. `proxy.go:319-333` 下流向け `SeriesRequest` を組み直す（外部ラベルをマッチャに畳み込み、shard 情報や `WithoutReplicaLabels` を引き継ぐ）。
  5. `proxy.go:339-373` 各ストアへ `newAsyncRespSet`（`proxy.go:357`）で非同期ストリームを開始。失敗時は partial response 戦略に従い警告送出か abort。
  6. `proxy.go:376` `NewProxyResponseLoserTree(storeResponses...)` で全ストリームをトーナメント木に載せ、`enableDedup` なら `proxy.go:378` `NewResponseDeduplicator` で包む。
  7. `proxy.go:382-397` `respHeap.Next()` でグローバルソート順に系列を取り出し、`r.Limit` を尊重しつつ `srv.Send(resp)`。`proxy.go:400` で batch サーバの残りを `Flush`。
- マージ実体: `pkg/store/proxy_merge.go:197` `NewProxyResponseLoserTree` が `losertree.New[*storepb.SeriesResponse, respSet]` を構築（`proxy_merge.go:228`）。

## 内部実装の素材

コアデータ構造。

- `ProxyStore`（`pkg/store/proxy.go:84`）: `stores func() []Client`（動的なストア集合）、`selectorLabels`、`retrievalStrategy`、`enableDedup`、`tsdbSelector`、`buffers sync.Pool` を持つファンアウト本体。Querier の StoreAPI 実装そのもの。
- `Client` インタフェース（`pkg/store/proxy.go:52`）: `storepb.StoreClient` を埋め込み、`LabelSets()` / `TimeRange()` / `SupportsSharding()` / `SupportsWithoutReplicaLabels()` 等を足す。StoreAPI を喋る全コンポーネントの共通型で、sidecar・store gateway・receive・別 Querier を区別せず束ねられる。
- `losertree.Tree[E, S]`（`pkg/losertree/tree.go:46`）: 葉 M 個を位置 M..2M-1、内部ノード M-1 個を 1..M-1、ノード 0 に勝者を置く配列レイアウトのトーナメント木（k-way merge）。`node.index` は「ノード 0 以外では敗者、ノード 0 では勝者」を指す（`tree.go:43-58`）。
- `metadata.Meta` / `metadata.Thanos`（`pkg/block/metadata/meta.go:66,77`）: TSDB の `BlockMeta` に Thanos 固有の `Labels`（外部ラベル）、`Downsample.Resolution`、`Source`、`Files`、`IndexStats`、`Extensions` を足した `meta.json` の型。objstore 上のブロック発見・互換・ダウンサンプリングの基準。
- `storepb.SeriesRequest`（`pkg/store/storepb/rpc.proto:63`）: `min_time` / `max_time` / `matchers` / `aggregates` / `max_resolution_window` / `shard_info` / `partial_response_strategy` / `without_replica_labels` を運ぶ、全 StoreAPI 呼び出しの共通要求。

非自明な設計判断。

- 重複除去をプロキシ層でやらない。`NewProxyStore` のコメント（`pkg/store/proxy.go:160-161`）が明言する通りファンインは dedup なし。HA ペアの dedup は PromQL 直前の最上位でだけ行う（`proxy.go:377-379` のオプション有効時のみ `ResponseDeduplicator`）。階層クエリで多重 dedup されるのを避ける設計。
- マージに損者木（loser tree / tournament tree）を採用。`pkg/losertree/tree.go:4-6` のコメントが [bboreham/go-loser](https://github.com/bboreham/go-loser) 由来と [K-way merge algorithm](https://en.wikipedia.org/wiki/K-way_merge_algorithm#Tournament_Tree) を明記。多数ストアからのソート済みストリームを最小比較回数でストリーミング統合し、メモリに全展開しない。
- StoreAPI を再帰的な単一抽象にしたこと。`Client` インタフェース 1 つで sidecar・store gateway・receive・ruler・別 Querier を同一に扱えるため、Querier 同士を多段に積む federated query が標準機能として成り立つ。`rpc.proto:35` のコメントもチャンクの min-time ソート推奨で federated query 最適化に触れる。

最小セットアップ。前提は Prometheus v2.2.1+（永続ディスク）、任意で objstore、ソースビルドなら Go ツールチェイン。`git clone` 後 `make build` で `thanos` バイナリ生成（[getting-started](https://thanos.io/tip/thanos/getting-started.md/)）。Prometheus の隣で sidecar を起動し StoreAPI を公開（`docs/quick-tutorial.md:91`）。

```bash
thanos sidecar \
    --tsdb.path            /var/prometheus \
    --objstore.config-file bucket_config.yaml \
    --prometheus.url       http://localhost:9090 \
    --http-address         0.0.0.0:19191 \
    --grpc-address         0.0.0.0:19090
```

Querier を立てて各 StoreAPI を束ね、Prometheus 互換 HTTP API / UI を出す（`docs/quick-tutorial.md:133`）。`dnssrv+` で DNS SRV 経由のエンドポイント探索も可能。

```bash
thanos query \
    --http-address 0.0.0.0:19192 \
    --endpoint     1.2.3.4:19090 \
    --endpoint     dnssrv+_grpc._tcp.thanos-store.monitoring.svc
```

## 採用事例の素材

数値は 2026-06-25 時点（gh API）。

- Stars 14,124 / Forks 2,318 / Open issues 869（`gh api repos/thanos-io/thanos`）。
- コントリビュータ約 408 名（`gh api .../contributors?per_page=1` の Link ヘッダ末尾 page=408）。
- 名前を出せる本番採用（CNCF Incubating 昇格時点、citable）: Alibaba Cloud, Banzai Cloud, HelloFresh, Monzo, Red Hat（[CNCF blog 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/)）。Wikimedia も [Wikitech: Thanos](https://wikitech.wikimedia.org/wiki/Thanos) で運用を公開。これ以外は捏造しない。

## 代替・エコシステム

- エコシステム: Prometheus（remote write / sidecar）、Grafana（Prometheus Query API 互換）、Prometheus Operator / Helm でのデプロイ。objstore は S3 / GCS / Azure / Swift / Tencent COS 等。Killercoda のインタラクティブチュートリアルあり。
- 競合: Cortex（[Thanos と同 2020-08 に incubation 入り](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/)）、VictoriaMetrics、M3 が実際の比較対象。
- 差別化: Thanos は「既存 Prometheus にサイドカーで後付け」して objstore に長期保存する構成が出発点で、push 集約（Receive）も後から両対応。Cortex は最初から push / マルチテナント集約型。VictoriaMetrics は独自ストレージエンジンで単体性能を売る。Thanos の固有点は TSDB ブロック形式をそのまま objstore に置き、ダウンサンプリングと StoreAPI 再帰抽象でグローバル / 階層クエリを成立させること。

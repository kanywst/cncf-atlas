# recon: Cortex

調査メモ。Prometheus を水平スケールさせる長期ストレージ。push (remote write) モデルの集中型マイクロサービス。出典は末尾 sources.md 参照。

## 基本情報

- repo: `cortexproject/cortex` (<https://github.com/cortexproject/cortex>)
- pinned commit: `42c26e7eab49ce36bb4dc80ecbcf365fe0e33899` (2026-06-23) / 近いタグ: `v1.21.1` (2026-06-04, `a149007ab28df6f7a6b638d2f1466269bf1f2cec`)。HEAD は v1.21.1 より先。`VERSION` ファイルは `1.21.0`。
- 言語 / ビルド: Go (`go 1.26.0`, `go.mod:3`) / `make` (デフォルトは Docker コンテナ内ビルド、`make BUILD_IN_CONTAINER=false` でローカル、`make exes` でバイナリのみ)。テストは `go test -tags "netgo slicelabels" ./...`。
- ライセンス: Apache-2.0 (`LICENSE:1` で Apache License Version 2.0 を確認、`gh` の `spdx_id` も `Apache-2.0`)。
- CNCF 成熟度: Incubating (2018-09-20 CNCF 受理、2020-08-20 incubation 昇格)。
- カテゴリ (指定): Observability。
- main entrypoint: `cmd/cortex/main.go` (バイナリ)、サービス組み立ては `pkg/cortex/cortex.go` + `pkg/cortex/modules.go`。
- 依存は `vendor/` に vendoring 済み。`go mod vendor` 運用。

## 歴史の素材

- 起源は 2016 年 6 月の設計文書 "Project Frankenstein: A Multi Tenant, Scale Out Prometheus"。2016 年 8 月 PromCon で同名トーク。発案は Tom Wilkie (当時 Weaveworks、現 Grafana Labs) と Prometheus 共同作者 Julius Volz。Weaveworks の hosted Prometheus サービスとして始まった。出典: Grafana Labs blog, CNCF blog。
- 課題: 単体 Prometheus は単一マシンのスループット/ストレージに頭打ち、HA 構成も弱く、複数の独立 Prometheus を 1 クラスタでマルチテナント隔離できない。Cortex はこれを remote write の集中受信 + 水平スケールで解く。
- マイルストーン:
  - 2018-09-20 CNCF Sandbox 受理。
  - 2020-08-20 CNCF TOC 投票で Incubating 昇格 (Thanos と同時アナウンス)。当時 maintainer 8 名 / 4 社 (Grafana Labs, Microsoft, Splunk, Weaveworks)。EA, Gojek, REWE Digital が 1500 万 active series 超の規模で本番運用と報告。
  - chunks storage は v1.10.0 で deprecated、blocks storage (Prometheus TSDB ベース + Thanos のオブジェクトストレージブロック) へ移行。Thanos との協業で shipper / store-gateway / compactor を共有。
- 注意 (一次情報優先): 一部の比較ブログ (Last9 等) は「Cortex は v1.18.x で開発停滞、maintainer は Mimir へ移行、maintenance mode」と書くが、実リポは 2026-06-23 push、v1.21.1 が 2026-06-04 リリース、`archived:false` で能動的に開発継続中。停滞という記述はリポ証拠と矛盾するので採用しない。Grafana Mimir が 2022 年に Cortex を fork したのは事実だが、Cortex 本体は別個に開発が続いている。

## アーキテクチャの素材

トップレベルは write path / read path / storage / optional に分かれるマイクロサービス。単一バイナリ (`-target=all`) でも個別プロセスでも動く。`-target` フラグの alias `all` で single-binary モードになる (`pkg/cortex/cortex.go:147-149`)。モジュール定義は `pkg/cortex/modules.go:74-106` (api, ring, distributor, ingester, querier, query-frontend, query-scheduler, store-gateway, compactor, ruler, alertmanager, parquet-converter ほか)。

write path:

- Distributor (stateless): remote write を受信、検証、HA dedup、consistent hash でトークン計算して ingester へ分配。
- Ingester (semi-stateful): サンプルをメモリ (per-tenant TSDB head) に保持、定期的に TSDB block を object storage へ flush/ship。

read path:

- Querier (stateless): PromQL を ingester + 長期ストレージ横断で実行。
- Query Frontend (optional): クエリのキャッシュ・分割・キューイング。
- Query Scheduler (optional): キューを frontend から切り離し独立スケール。

storage:

- Compactor (stateless): object storage 内の TSDB block を compaction。
- Store Gateway (semi-stateful): object storage 上の block をクエリ。

横断パターン:

- Hash Ring: Consul / Etcd / memberlist gossip でメンバ管理しデータ分配 (`pkg/ring/`)。
- マルチテナンシ: `X-Scope-OrgID` ヘッダでテナント隔離。`auth.enabled` デフォルト true (`pkg/cortex/cortex.go:151`)。
- Blocks Storage: TSDB ベース、2 時間 block、S3 / GCS / Azure / Swift。

## 内部実装の素材

代表的な中核オペレーション = remote write (push) を 1 リクエスト end-to-end で追う。

1. HTTP ルート登録: `pkg/api/api.go:296` で `POST /api/v1/push` を `push.Handler(...)` に紐付け。
2. `pkg/util/push/push.go:49` `Handler(...)` が remote-write protobuf を decompress/decode し、`push Func` (= distributor の Push) を呼ぶ。`maxRecvMsgSize` で本文サイズ制限。
3. `pkg/distributor/distributor.go:747` `(*Distributor).Push`。テナント ID 取得 (`users.TenantID`)、inflight/レート上限チェック (`distributor.go:790-804`)、HA replica の dedup (`distributor.go:810-816`、`findHALabels` + `checkSample`、`ha.ReplicasNotMatchError` でデデュープ)。
4. `distributor.go:840` `prepareSeriesKeys` で各 series のバリデーションとリングトークン算出。トークンは `tokenForLabels` (`distributor.go:583`): `ShardByAllLabels` 有効なら `shardByAllLabels` (`distributor.go:618`、user + 全 label name/value を FNV-32 で `HashAdd32`)、無効なら metric 名のみで `shardByMetricName` (`distributor.go:605`)。
5. ingestion rate limit (`distributor.go:858`、超過時 HTTP 429)、shuffle sharding 有効なら `ShuffleShard` でサブリング取得 (`distributor.go:885-887`)。
6. `distributor.go:899` `doBatch` (`distributor.go:980`)。背景 context を別に張る (`distributor.go:984-985`: "Use a background context to make sure all ingesters get samples even if we return early") のがポイント。`ring.DoBatch` (`pkg/ring/batch.go:74`) を呼ぶ。
7. `pkg/ring/batch.go:93-115`: 各 key で `r.Get(key, op, ...)` がレプリケーションセット (RF 個の ingester) を解決、`minSuccess`/`maxFailures` を quorum として `itemTracker` に積む。ingester 単位に index をまとめて `e.Submit` で非同期発射 (`batch.go:126-132`)。`record` (`batch.go:151`) がエラーをファミリ別 (2xx/4xx/5xx) に集計し quorum 判定。
8. `distributor.go:1009-1021` のコールバックが `d.send` で対象 ingester へ gRPC。
9. `pkg/ingester/ingester.go:1324` `(*Ingester).Push`。`checkRunning`、inflight/rate チェック後、per-tenant TSDB head に append。

中核データ構造 (3-5):

- `cortexpb.WriteRequest` (`pkg/cortexpb/cortex.pb.go:189`): remote write のワイヤ表現。`Timeseries []PreallocTimeseries` + `Metadata` + `Source` を持つ proto。
- `cortexpb.PreallocTimeseries` (`pkg/cortexpb/timeseries.go:78`): `*TimeSeries` を埋め込み、Unmarshal 時に `sync.Pool` から slice を確保 (`timeseries.go:83-86`)。GC 削減の要。
- `ring.Desc` / `ring.InstanceDesc` (`pkg/ring/ring.pb.go:65`, `:108`): リング全体は `map[string]InstanceDesc`。InstanceDesc は `Addr` / `Timestamp` (heartbeat) / `State` / `Tokens []uint32` / `Zone` を保持。トークンがハッシュリング上の所有範囲を決める。
- `ingester.userTSDB` (`pkg/ingester/ingester.go:376`): テナントごとの `*tsdb.DB` ラッパ。`activeSeries`、`limiter`、`stateMtx`/`state`、`pushesInFlight`/`readInFlight` (WaitGroup)、Thanos `shipper` を持つ。flush/ship・idle 検出・削除マーカ処理の単位。
- `distributor.Distributor` (`pkg/distributor/distributor.go:85`): ingester リング参照、レートリミッタ、HA tracker、各種 prometheus メトリクスを束ねる stateless サービス。

非自明な設計判断:

- ホットな write path での aggressive な sync.Pool 再利用 + unsafe zero-copy デシリアライズ。`PreallocWriteRequestFromPool` / `TimeseriesFromPool` でオブジェクトを使い回し、処理後に `req.Free()` と `cortexpb.ReuseSlice(req.Timeseries)` を defer で返却する (`distributor.go:749-754`, `ingester.go:1354-1355`)。`ingester.go:1352-1353` のコメント "because we use `unsafe` in deserialisation, we must not retain anything from `req` past the call to ReuseSlice" が示す通り、label は元バッファを指す unsafe 参照なので、プール返却後に保持してはならないという制約とセット。高カーディナリティ・高スループット環境で GC 圧を抑えるための割り切り。
- もう一つ: `doBatch` がクライアント側 context ではなく background context + RemoteTimeout で ingester 送信する (`distributor.go:984-990`)。クライアントが早期に切断/タイムアウトしても、進行中バッチを全 ingester へ送り切り、レプリケーション quorum を壊さない。

## 採用事例の素材

`ADOPTERS.md` 記載 (本番運用と自己申告):

- Adobe, Amazon Web Services (AWS, `aws.amazon.com/prometheus`), Aspen Mesh, Buoyant, Cabify, DigitalOcean, Electronic Arts, Etsy, EverQuote, GoJek, KakaoEnterprise, MayaData, Northflank, Open-Xchange, Opstrace, Platform9, REWE Digital, Swiggy, SysEleven, Twilio ほか。
- Amazon Managed Service for Prometheus (AMP) は Cortex 上に構築。README `README.md:161` で AMP を明記、`ADOPTERS.md` にも AWS をリスト。CNCF incubation blog では EA / Gojek / REWE Digital が大規模 (>1500 万 active series) 運用と記載。
- 規模感 (2026-06-24 時点, `gh api`): GitHub star 5,813 / fork 860 / contributor 約 344 名 (anon 含む per_page=1 の last page で概算) / open issues 307。`archived:false`、最終 push 2026-06-24。

## 代替・エコシステム

- Grafana Mimir: 2022 年に Cortex を fork。split-and-merge compactor で TSDB index 上限を突破、単一テナント 10 億 active series までテスト済み。monolithic デプロイモードあり。Cortex と read/write モデル (push/remote write) は同系統。
- Thanos (CNCF incubating): sidecar (pull) / receiver (push) モデル。"edge" 型分散。Cortex とは shipper / store-gateway / compactor のコードを一部共有。
- VictoriaMetrics: 単一バイナリ志向、設定最小で性能/単純さのバランス型。
- 本質的な差: Cortex は remote write 集中受信 + マイクロサービス個別スケール + 強いマルチテナント隔離 (ingestion から query まで) が軸。Thanos は既存 Prometheus を温存する edge 型でマルチテナントは弱め。Mimir は Cortex の後継的最適化版で集中型。
- エコシステム: `cortexproject` org に `cortex-helm-chart`, `cortex-tools`, `cortex-jsonnet`, `auth-gateway` 等。ストレージは S3/GCS/Azure/Swift。リング KV は Consul/Etcd/memberlist。Grafana でクエリ可視化、Prometheus remote write がデータ源。

## インストール / 最小構成

- バイナリ or Docker (`quay.io/cortexproject/cortex`)。単一プロセス検証は `-target=all` (single-binary モード) + 設定ファイル。
- 最小設定例がリポ同梱: `docs/getting-started/single-binary.md`、`docs/getting-started/cortex-config.yaml`、`docs/configuration/single-process-config-blocks-local.yaml` (ローカル blocks storage)、gossip 版 (`...gossip-1.yaml` / `-2.yaml`)、`docker-compose.yaml` で Prometheus + Cortex + Grafana + SeaweedFS (S3 互換) 一式。
- 流れ: Cortex を `-target=all -config.file=...` で起動 → Prometheus の `remote_write` で `/api/v1/push` に送信 → Grafana から Cortex を Prometheus datasource として参照。マルチテナント時は `X-Scope-OrgID` 必須 (`auth.enabled` デフォルト true)。

# recon: Jaeger

調査メモ。Jaeger v2 系 (OpenTelemetry Collector ベース) を実コードで確認した結果。出典は URL か `path:line`。

## 基本情報

- repo: `jaegertracing/jaeger`
- pinned commit: `d5e2ccd4705e1ae200baf7438c09a64ded5dd78e` (2026-06-22 commit) / 直近タグ: `v2.19.0` (2026-06-03 リリース、この commit はその後)
- 言語 / ビルド: Go (go.mod は `go 1.26.0`) / `make build-jaeger` (UI submodule を先にビルドしてから `go build`)。`scripts/makefiles/BuildBinaries.mk:84` に `build-jaeger` ターゲット
- 主エントリポイント: `cmd/jaeger/main.go:17` の `main()`
- ライセンス: Apache-2.0 (`LICENSE` 冒頭が Apache License Version 2.0、各ソース冒頭に `SPDX-License-Identifier: Apache-2.0`、GitHub API も `Apache-2.0`)
- CNCF 成熟度: Graduated (2017-09-13 incubating 受入 → 2019-10-31 graduated、CNCF 7 番目の卒業プロジェクト)
- カテゴリ: Observability

## 歴史の素材

- Uber 社内で 2015 年に開発開始。Google Dapper と OpenZipkin に着想を得た分散トレーシング。最初のコミットは 2015-08-03 (Uber 内部リポジトリ)。出典: [CNCF Jaeger project page](https://www.cncf.io/projects/jaeger/) と Uber Eng ブログ [Evolving Distributed Tracing at Uber Engineering](https://eng.uber.com/distributed-tracing/)。
- 2017 年に Uber が OSS 公開。2017-09-13 に CNCF incubating として受入、2019-10-31 に graduated。出典: [CNCF announces Jaeger graduation](https://www.cncf.io/announcements/2019/10/31/cloud-native-computing-foundation-announces-jaeger-graduation/)。
- OpenTracing API の実装として始まり、OpenTracing が OpenTelemetry に統合された流れに追随。Jaeger 独自クライアントライブラリは 2022 年に deprecated とされ、計装は OpenTelemetry SDK に移行。
- Jaeger v2 を 2024-11 に発表。バックエンドを OpenTelemetry Collector (`otelcol`) ベースに全面再構築した。出典: [Jaeger v2 released (Medium)](https://medium.com/jaegertracing/jaeger-v2-released-09a6033d1b10)、README 冒頭の v2 告知。

## アーキテクチャの素材

Jaeger v2 は独立サーバではなく **OpenTelemetry Collector のディストリビューション**。バイナリは `otelcol` を埋め込み、Jaeger 固有機能を Collector の extension / receiver / processor / exporter として登録する。

- 起動: `cmd/jaeger/main.go:17` → `cmd/jaeger/internal/command.go:29` の `Command()`。`otelcol.CollectorSettings` に `Factories: Components` を渡し `otelcol.NewCommand(settings)` (`command.go:36-51`)。
- all-in-one デフォルト: `--config` が無いとき cobra の `RunE` を差し替え、埋め込み `all-in-one.yaml` を `yaml:` として注入する (`command.go:57-85`)。OTel Collector に「設定ファイル無し起動」のフックが無いための回避策。
- コンポーネント登録: `cmd/jaeger/internal/components.go:50` の `builders` 構造体と `build()`。
  - receivers: `otlpreceiver`, `jaegerreceiver`, `kafkareceiver`, `zipkinreceiver`, `nopreceiver` (`components.go:95-104`)。
  - exporters: `storageexporter` (Jaeger ストレージへ書き込む要、`components.go:115` の "generic exporter to Jaeger v1 spanstore.SpanWriter")、`otlpexporter`, `kafkaexporter`, `prometheusexporter` など。
  - extensions: `jaegerquery` (Query API + UI), `jaegerstorage` (ストレージファクトリ保持), `remotesampling`, `jaegermcp`, `expvar`, `healthcheckv2` など (`components.go:74-90`)。
  - processors: `adaptivesampling`, `tailsamplingprocessor`, `batchprocessor`, `memorylimiterprocessor` など。
- ストレージは v1 / v2 の二系統が併存 (`internal/storage/v1`, `internal/storage/v2`)。v2 API は OTLP `ptrace.Traces` を直接扱う。

## 内部実装の素材

代表操作「OTLP でスパンを受けてストレージに書く」を end-to-end で追跡。

1. OTLP receiver がスパン受信 → Collector パイプライン → `jaeger_storage_exporter` に到達。
2. exporter ファクトリ `cmd/jaeger/internal/exporters/storageexporter/factory.go:39` の `createTracesExporter`。`exporterhelper.NewTraces` で `ex.pushTraces` をラップ。`WithTimeout{Timeout: 0}` でタイムアウト無効化、`WithRetry` / `WithQueue` 付与 (`factory.go:42-52`)。安定度は `StabilityLevelDevelopment` (`factory.go:27`)。
3. 起動時 `exporter.go:34` の `start()` が `jaegerstorage.GetTraceStoreFactory(...)` から `CreateTraceWriter()` を取得し `exp.traceWriter` に保持。
4. 書き込み `cmd/jaeger/internal/exporters/storageexporter/exporter.go:52` の `pushTraces`:

   ```go
   func (exp *storageExporter) pushTraces(ctx context.Context, td ptrace.Traces) error {
       return exp.traceWriter.WriteTraces(ctx, exp.sanitizer(td))
   }
   ```

5. サニタイズ連鎖 `internal/jptrace/sanitizer/sanitizer.go:18` の `NewStandardSanitizers`: EmptyServiceName → EmptySpanName → UTF8 → NegativeDuration。
6. ストレージ API は `internal/storage/v2/api/tracestore/writer.go:13` の `Writer.WriteTraces(ctx, ptrace.Traces)` 一本 (OTLP Exporter API 互換、冪等)。
7. in-memory 実装 `internal/storage/v2/memory/memory.go:65` の `WriteTraces`: `reshuffleResourceSpans` で `ResourceSpans` を traceID ごとにグルーピング (`memory.go:161`) → テナント取得 (`tenancy.GetTenant(ctx)`) → `storeTraces` でリングバッファに格納。

中核データ構造:

- `ptrace.Traces` (OTLP pdata)。v2 でのネイティブなインメモリ表現。receiver / processor / exporter / storage すべてがこれを受け渡す。Jaeger 独自の `model.Span` (jaeger-idl) は段階的に縮退中。
- `tracestore.Writer` / `tracestore.Reader` (`internal/storage/v2/api/tracestore/writer.go`, `reader.go`)。v2 ストレージ抽象。Reader は Go 1.23 の `iter.Seq2[[]ptrace.Traces, error]` で結果をストリーム返し (`reader.go` の `GetTraces` / `FindTraces`)。
- in-memory `Tenant` (`internal/storage/v2/memory/tenant.go:24-41`): `ids map[pcommon.TraceID]int` + `traces []traceAndId` のリングバッファ + `mostRecent int`。`MaxTraces` 固定長。
- `storageExporter` (`exporter.go:19`): `config`, `traceWriter tracestore.Writer`, `sanitizer sanitizer.Func`。
- `builders` / `otelcol.Factories` (`components.go:50-72`): コンポーネントレジストリ。Jaeger 固有機能を Collector ファクトリ集合として束ねる。

非自明な設計判断: **Jaeger v2 はスタンドアロンサーバではなく OTel Collector ディストリビューション**である点。Query API・ストレージ・サンプリングはすべて Collector の extension (`jaegerquery` / `jaegerstorage` / `remotesampling`) として 1 プロセス内に同居し、設定は OTel Collector の YAML (pipeline + extensions) で表現する。これにより OTLP がファーストクラス入力になり、v1 の Agent/Collector/Query 分割アーキテクチャから「OTel Collector + Jaeger 拡張」へ移行した。`storageexporter` がいまだ Development 安定度で、内部的に v1 の `spanstore.SpanWriter` 互換に橋渡ししている点 (`components.go:115`) が移行途中であることを示す。

## 採用事例の素材

`ADOPTERS.md` とリンク先ケーススタディ・トークのみ採用 (捏造禁止)。

- Uber: 開発元。[Evolving Distributed Tracing at Uber Engineering](https://eng.uber.com/distributed-tracing/)。
- Grafana Labs: ケーススタディ [Grafana Labs Teams Use Jaeger to Improve Query Performance Up to 10x](https://medium.com/jaegertracing/grafana-labs-teams-observed-query-performance-improvements-up-to-10x-with-jaeger-cec84b0e3609)。メンテナ joe-elliott も所属。
- Logz.io: ケーススタディ [Jaeger Essentials: Performance Blitz with Jaeger](https://logz.io/blog/jaeger-tracing-performance/)。
- Ticketmaster: ケーススタディ [Ticketmaster Traces 100 Million Transactions per Day with Jaeger](https://medium.com/jaegertracing/ticketmaster-traces-100-million-transactions-per-day-with-jaeger-38ec6cf599f0) とトーク [Deploy, Scale and Extend Jaeger](https://www.youtube.com/watch?v=JloanFIc-ms)。
- Weaveworks: ケーススタディ [Weaveworks Combines Jaeger Tracing With Logs and Metrics](https://medium.com/jaegertracing/weaveworks-combines-jaeger-tracing-with-logs-and-metrics-for-a-troubleshooting-swiss-army-knife-5afc0f42b22e)。
- Red Hat: `ADOPTERS.md` 記載 + [jaeger-openshift](https://github.com/jaegertracing/jaeger-openshift)。

`ADOPTERS.md` には他に Tencent, Northwestern Mutual, SeatGeek, Nets 等 計 26 件超。ケーススタディ/トーク付きは上記が確実。

ガバナンス: `GOVERNANCE.md` にメンテナ昇格基準 (3 か月以上の参加、非自明 PR 10 件のレビュー + 10 件のマージ等)。現メンテナ (`MAINTAINERS.md`): albertteoh (PackSmith), jkowall (Paessler), joe-elliott (Grafana Labs), mahadzaryab1 (Bloomberg), pavolloffay (Red Hat), yurishkuro (Meta、Jaeger オリジナル作者)。CNCF maintainers CSV と同期する旨明記。

採用規模シグナル (GitHub API、2026-06-22 取得): stars 22,911 / forks 2,967 / open issues 446 / contributors 約 482 (anon ページネーション last=483)。作成日 2016-04-15。

## 代替・エコシステム

統合先: OpenTelemetry (Collector 本体・SDK)、Prometheus (SPM = Service Performance Monitoring を spanmetrics connector で算出、`config-spm.yaml`)、Kafka (取り込みバッファ、`kafkareceiver`/`kafkaexporter`)、Grafana (可視化)、ストレージ backend は Cassandra / Elasticsearch / OpenSearch / ClickHouse / Badger / in-memory / remote gRPC。Kubernetes は jaeger-operator、サービスメッシュ (Istio/Envoy) のトレース送信先としても定番。

代替と差:

- Grafana Tempo: オブジェクトストレージ前提でコスト最適、Grafana 連携前提。Jaeger は複数ストレージ backend をプラガブルに選べ、独自 UI と Query API を持つ。
- Zipkin: Jaeger の着想元の先行 OSS。Jaeger は zipkin receiver で互換受信できる。
- 商用 APM (Datadog APM / New Relic / Honeycomb / Elastic APM / AWS X-Ray): マネージドでメトリクス・ログ統合。Jaeger は CNCF graduated の OSS でトレーシング特化、v2 で OTel Collector ネイティブ。
- SigNoz: OTel ネイティブの統合可観測性 OSS。Jaeger はトレース専業で成熟度 (graduated) と採用実績が強み。

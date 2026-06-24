# recon: OpenTelemetry (Collector)

OpenTelemetry はプロジェクトとしては仕様 + 各言語 SDK + Collector の集合体。deep-dive の主対象は中核実装である **OpenTelemetry Collector** (`open-telemetry/opentelemetry-collector`)。テレメトリの受信・加工・転送を担うデータパイプライン本体で、Go 実装、コードを読んで挙動を確認できる単一リポジトリとして最も代表的。言語別 SDK や `opentelemetry-collector-contrib` (実コンポーネント群) は周辺リポジトリ。

## 基本情報

- repo: `open-telemetry/opentelemetry-collector`
- pinned commit: `415d3dcae73b37a8e3cf490452949a72589ae650` (2026-06-18) / 近いタグ: `v0.154.0` (beta module-set, 2026-06-08 リリース。HEAD はその後の main)
- module バージョン: stable `v1.60.0` / beta `v0.154.0` (`versions.yaml:6,33`)
- 言語 / ビルド: Go (`go.mod` module `go.opentelemetry.io/collector`) / `make otelcorecol` または `make run`。公式バイナリは `cmd/builder` (OCB) が manifest からビルドする (`go.mod` 冒頭コメント参照)
- ライセンス: Apache-2.0 (`LICENSE` 1 行目 `Apache License Version 2.0`、SPDX タグ `Apache-2.0` を全ソースヘッダに付与。gh API も `Apache-2.0`)
- main エントリポイント: `cmd/otelcorecol/main.go` (生成物、`DO NOT EDIT`)。`otelcol.CollectorSettings` を組んで `otelcol.NewCollector` -> `Collector.Run` を呼ぶ。これは "core" テスト用ディストリ。実運用バイナリは利用者が OCB で生成する
- CNCF 成熟度: Graduated (2026-05-11 付、2026-05-21 発表)
- カテゴリ: Observability

## 歴史の素材

- 2019-05: OpenCensus (Google 発、メトリクス + トレース) と OpenTracing (ベンダ中立トレース API、広い言語対応) の **合併**として発足。観測領域のコミュニティ分裂を解消する目的。出典 <https://opensource.microsoft.com/blog/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/>
- CNCF 受理 2019-05-07、Incubating 昇格 2021-08-26、Graduated 2026-05-11 (発表 2026-05-21、Minneapolis の Observability Summit)。出典 <https://www.cncf.io/projects/opentelemetry/> と <https://www.cncf.io/announcements/2026/05/21/cloud-native-computing-foundation-announces-opentelemetrys-graduation-solidifying-status-as-the-de-facto-observability-standard/>
- スコープ拡張: trace -> metrics -> logs、最近 profiles (alpha) を追加。本リポジトリにも `xpipeline.SignalProfiles` として実験シグナルが入っている (`service/internal/graph/graph.go:333`)。出典 <https://opentelemetry.io/blog/2026/otel-graduates/>
- 卒業条件として Collector を含む第三者セキュリティ監査とガバナンスレビューを実施。CNCF 全体で 2 番目に高い開発ベロシティ (Kubernetes に次ぐ)。出典は上記 CNCF announcement

## アーキテクチャの素材

Collector は YAML config を **コンポーネントの DAG (有向グラフ)** に変換して回す。コンポーネント種別:

- receiver: 外部からテレメトリを取り込む入口 (`receiver/`)
- processor: 順序を保って加工する中間段 (`processor/`)
- exporter: バックエンドへ送る出口 (`exporter/`)
- connector: あるパイプラインの exporter 兼 別パイプラインの receiver (`connector/`)
- extension: パイプライン外の補助機能 (health check, zpages 等、`extension/`)

起動の流れ:

1. `cmd/otelcorecol/main.go` が `CollectorSettings` を構築、`confmap` provider (env/file/http/https/yaml) を登録
2. `otelcol/collector.go:178` `setupConfigurationComponents` が config を取得・`confmap.Validate` し、`service.New` に各コンポーネント config と factory を渡す (`otelcol/collector.go:212-237`)
3. service が `service/internal/graph` の `Build` を呼んでグラフを構築

設計判断として、receiver は同型パイプライン間で **共有**される (nodeID を "pipeline type + component ID" から導出、`service/internal/graph/receiver.go:24-31`)。processor は順序が重要なので slice、receiver/exporter は重複排除のため map で保持する (`service/internal/graph/graph.go:385-401`)。

## 内部実装の素材

### 代表オペレーション: config -> パイプライン DAG 構築とデータ配線 (end to end)

エントリは `Build` (`service/internal/graph/graph.go:75`)。3 段:

1. `createNodes` (`graph.go:98`): 各パイプライン config を走査し receiver/processor/exporter ノードを生成。connector は exporter 側・receiver 側の signal 組合せを `connectorStability` (`graph.go:551`) で型チェックし、サポートされない使い方なら明示エラー (`graph.go:177`,`183`)
2. `createEdges` (`graph.go:265`): receiver -> capabilities ノード -> processor 連鎖 -> fanout ノード -> 各 exporter とエッジを張る。exporter が 1 個でも必ず fanout ノードを噛ませる (`graph.go:280-287`)
3. `buildComponents` (`graph.go:294`): `topo.Sort` でトポロジカル順に並べ、`slices.Backward` で **逆順 (下流から上流へ)** に実体化。下流の consumer が先に出来るので receiver は自分の next consumer を受け取れる。receiver は `nextConsumers` を fanout で束ねて factory に渡す (`receiver.go:41-101`, とくに `:70-72`)

実行時のデータは `consumer.Traces` などのインターフェース 1 本で次段へ渡る (`consumer/traces.go:15-20`、`ConsumeTraces(ctx, ptrace.Traces) error`)。起動は逆トポロジカル順 `StartAll` (`graph.go:403`)、停止は順方向 `ShutdownAll` (`graph.go:450`) でドレインを保証。

### 非自明な設計判断: MutatesData による fanout のゼロコピー最適化

複数 exporter に同じデータを配る fanout は、全段にコピーを配ると重い。`internal/fanoutconsumer/traces.go:19` の `NewTraces` は consumer を `Capabilities().MutatesData` で **mutable / readonly に振り分ける**。

- readonly が複数なら元データを `MarkReadOnly()` してから共有 (`traces.go:67-69`)
- mutable には最後の 1 つを除き `cloneTraces` でコピーを配り、最後の mutable には readonly が居なければ元データをそのまま渡す (`traces.go:50-64`)
- consumer が 1 個かつ非変更ならラップせず素通し (`traces.go:21-23`)

各パイプラインが結局データを変更するかは `capabilitiesNode` が processor 群と fanout の `MutatesData` を OR で畳んで算出し (`graph.go:312-318`)、receiver はそれを見て clone 要否を判断する。設定から導かれる変更可能性をビルド時に解析して実行時コピーを最小化するのが肝。

### 中核データ構造 (3-5)

- `Graph` (`graph.go:60`): `componentGraph *simple.DirectedGraph` (gonum)、`pipelines map[pipeline.ID]*pipelineNodes`、`instanceIDs`。DAG 本体
- `pipelineNodes` (`graph.go:385`): receivers(map) / capabilitiesNode / processors(slice) / fanOutNode / exporters(map)。1 パイプラインのノード集合
- `consumer.Traces` / `Metrics` / `Logs` インターフェース (`consumer/traces.go:15`): 段間配線の抽象。`ConsumeXxxFunc` アダプタで関数を consumer 化
- `consumer.Capabilities{MutatesData bool}` (`consumer/consumer.go:12`): 上記最適化の判断材料
- `pdata` の `ptrace.Traces` 等 (`pdata/ptrace/traces.go`): OTLP データのインメモリ表現。`MarkReadOnly` / `IsReadOnly` で共有可否、`CopyTo` で clone。pdata は stable module `v1.60.0`
- `pipelines.Config = map[pipeline.ID]*PipelineConfig` (`service/pipelines/config.go:25`)、`pipeline.ID` は signal + name (`pipeline/pipeline.go:18`)

### 最小構成 (examples/local/otel-config.yaml)

otlp receiver -> memory_limiter processor -> debug exporter を traces/metrics/logs の 3 パイプラインで定義。zpages extension 付き。

## 採用事例の素材

- 採用規模はプロジェクト全体で contributor 12,000 超 / 企業 2,800 超 (CNCF 卒業発表時点、2026-05-21)。出典 <https://www.cncf.io/announcements/2026/05/21/cloud-native-computing-foundation-announces-opentelemetrys-graduation-solidifying-status-as-the-de-facto-observability-standard/>
- Collector core repo 単体: star 7,159 / fork 2,116 / contributor 約 607 (gh API、2026-06-23 取得)
- 注意: 本 Collector core リポジトリには `ADOPTERS` ファイルが無い (確認済み)。具体的な組織名の名指しは CNCF ケーススタディ等の出典が取れた場合のみ記載すること。現時点で本 recon では個社名を確定していないため捏造しない
- 合併時点で Google / Microsoft / Amazon / Splunk / Datadog がバックに付いた点は出典あり (上記 Microsoft blog)

## 代替・エコシステム

- **Grafana Alloy**: OTel Collector のコンポーネントを内部で wrap した Grafana 製ディストリ。HCL 風の Alloy Flow 設定、ローカル UI でパイプラインを可視化、Prometheus remote write / Loki push / Pyroscope に強い。出典 <https://oneuptime.com/blog/post/2026-02-06-compare-opentelemetry-collector-vs-grafana-alloy/view>
- **Fluent Bit**: C 製、ログ転送特化で超軽量。Kubernetes の DaemonSet ログ収集で定番。OTel Collector は大きめバッチで paging が穏やか、Fluent Bit は小バッチ高頻度 I/O。出典 <https://www.parseable.com/blog/observability-agent-profiling-fluent-bit-vs-opentelemetry-collector-performance-analysis>
- **Vector** (Datadog 製、Rust): 高性能・低メモリ、ログ/メトリクスのルーティングに強い。ベンダ中立。出典 <https://victoriametrics.com/blog/log-collectors-benchmark-2026/>
- OTel Collector の本質的差: ベンダ中立な **業界標準 OTLP** を全 signal (trace/metrics/logs/profiles) で扱い、`opentelemetry-collector-contrib` に数百の receiver/processor/exporter が揃う。多くの観測ベンダが自前 exporter を寄稿。これらの代替も OTLP 互換なので相互移行が容易。出典 <https://signoz.io/comparisons/opentelemetry-collector-vs-fluentbit/>
- 隣接 CNCF プロジェクト: Jaeger (trace バックエンド)、Prometheus (metrics)、Fluentd (logs) と協調動作。出典 <https://opentelemetry.io/blog/2026/otel-graduates/>

## ガバナンス

- Governance Committee (GC、戦略/運営) と Technical Committee (TC、技術) の二層 + 自律的な SIG 群。GC は技術判断を TC/SIG に委譲。両委員会が CNCF から見たメンテナ。出典 <https://github.com/open-telemetry/community/blob/main/governance-charter.md> と <https://github.com/open-telemetry/community/blob/main/tech-committee-charter.md>
- 新 SIG 作成には TC と GC から 1 名ずつスポンサーが必要。ガバナンス文書は `open-telemetry/community` に集約。出典 <https://github.com/open-telemetry/community>
- リポジトリには `AGENTS.md` があり AI 生成 PR/コメントへの方針 (issue への AI コメント禁止、`Assisted-by:` trailer での開示、`Co-authored-by:` 禁止) を明記

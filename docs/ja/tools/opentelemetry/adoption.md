# 採用事例・エコシステム

## 誰が使っているか

Collector core リポジトリには `ADOPTERS` ファイルが無い。そのため本ディープダイブでは個別企業を Collector 採用者として名指ししない。名指しには引用可能なケーススタディが必要だが、リサーチでは確定できなかった。引用できるのは創設時のバックである。OpenTelemetry が 2019 年に発表された際、Google・Microsoft・Amazon・Splunk・Datadog がバックとして名を連ねた。([合併発表](https://opensource.microsoft.com/blog/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/))

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| 創設時バック (Google・Microsoft・Amazon・Splunk・Datadog) | 発足時にプロジェクトを支援 | [合併発表](https://opensource.microsoft.com/blog/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/) |

## 採用のシグナル

卒業時点で CNCF は、プロジェクト全体としてコントリビュータ 12,000 人超・参加企業 2,800 社超と報告し、OpenTelemetry を Kubernetes に次ぐ CNCF 内 2 番目のベロシティと評した。([卒業発表](https://www.cncf.io/announcements/2026/05/21/cloud-native-computing-foundation-announces-opentelemetrys-graduation-solidifying-status-as-the-de-facto-observability-standard/))

Collector core リポジトリ単体では、2026-06-23 時点の GitHub API でスター約 7,159・fork 2,116・コントリビュータ約 607 を報告している。([opentelemetry-collector](https://github.com/open-telemetry/opentelemetry-collector))

## エコシステム

core リポジトリは意図的に小さい。実際のコンポーネントの幅は `opentelemetry-collector-contrib` にあり、数百の receiver・processor・exporter を持つ。その多くは自前の exporter を保守する観測ベンダーが寄稿したものである。運用者は必要なコンポーネントを `cmd/builder` の OpenTelemetry Collector Builder (OCB) で組み合わせる。隣接 CNCF プロジェクトとも相互運用する。trace バックエンドの Jaeger、メトリクスの Prometheus、ログの Fluentd である。([卒業ブログ](https://opentelemetry.io/blog/2026/otel-graduates/))

## 代替候補

Collector の本質的な差は、ベンダー中立な OTLP を全シグナル (トレース・メトリクス・ログ、実験的な profiles) で扱う点である。これにより再計装せずにバックエンドやエージェントを差し替えられる。以下の代替も実運用では OTLP 互換であり、相互移行が容易である。([SigNoz 比較](https://signoz.io/comparisons/opentelemetry-collector-vs-fluentbit/))

| 代替 | 違い |
| --- | --- |
| [Grafana Alloy](https://oneuptime.com/blog/post/2026-02-06-compare-opentelemetry-collector-vs-grafana-alloy/view) | Collector コンポーネントを HCL 風 config で包んだ Grafana 製ディストリ。ローカルのパイプライン UI と、Prometheus remote write・Loki・Pyroscope への強い経路を持つ |
| [Fluent Bit](https://www.parseable.com/blog/observability-agent-profiling-fluent-bit-vs-opentelemetry-collector-performance-analysis) | C 製、ログ転送特化で超軽量。Kubernetes の DaemonSet ログ収集の定番。小バッチ高頻度 I/O を行い、Collector は大きめバッチで paging が穏やか |
| [Vector](https://victoriametrics.com/blog/log-collectors-benchmark-2026/) | Rust 製、Datadog 開発。高スループットで低メモリ、ログ/メトリクスのルーティングに強く、ベンダー中立 |

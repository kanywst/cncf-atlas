# 歴史

## 起源

OpenTelemetry は 2019 年 5 月、競合していた 2 つの観測プロジェクトの合併として始まった。1 つは Google 発でメトリクスとトレースを扱う OpenCensus、もう 1 つは広い言語対応を持つベンダー中立なトレース API の OpenTracing である。両者は計装コミュニティを二分し、ライブラリやベンダーにどちらかを選ばせていた。合併は、エコシステムに 1 つの標準を与えることを目的に、バックの各社から共同発表された。([合併発表](https://opensource.microsoft.com/blog/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/))

合併時点では Google・Microsoft・Amazon・Splunk・Datadog がバックに付いた。これが早期に勢いを得た一因である。([合併発表](https://opensource.microsoft.com/blog/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/))

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | OpenCensus と OpenTracing が OpenTelemetry に合併。CNCF が 2019-05-07 に受理 |
| 2021 | 2021-08-26 に CNCF Incubating へ昇格 |
| 2026 | 2026-05-11 に CNCF Graduated へ昇格、Minneapolis の Observability Summit で 2026-05-21 発表 |

受理・Incubating・卒業の各日付は [CNCF プロジェクトページ](https://www.cncf.io/projects/opentelemetry/) と [卒業発表](https://www.cncf.io/announcements/2026/05/21/cloud-native-computing-foundation-announces-opentelemetrys-graduation-solidifying-status-as-the-de-facto-observability-standard/) による。

## どう進化したか

プロジェクトのスコープは 1 シグナルずつ広がった。トレースから始まり、メトリクス、ログ、そして直近で profiles を追加した。profiles はまだ実験的シグナルである。その実験的な扱いは Collector のコードに見える。パイプライングラフは stable な trace/metric/log シグナルと並んで `xpipeline.SignalProfiles` を扱う (`service/internal/graph/graph.go:333`)。([卒業ブログ](https://opentelemetry.io/blog/2026/otel-graduates/))

卒業の一環として、Collector を含む第三者セキュリティ監査とガバナンスレビューを実施した。CNCF は OpenTelemetry を、Kubernetes に次いで CNCF 全体で 2 番目に高い開発ベロシティと評している。([卒業発表](https://www.cncf.io/announcements/2026/05/21/cloud-native-computing-foundation-announces-opentelemetrys-graduation-solidifying-status-as-the-de-facto-observability-standard/))

## 現在地

Collector はリリースが頻繁である。本ドキュメントの基準コミットでは stable モジュールセットが `v1.60.0`、beta モジュールセットが `v0.154.0` である (`versions.yaml:6`、`versions.yaml:33`)。この分割により、データモデルと config パッケージは 1.x の安定性に達しつつ、service とコンポーネントの機構は 0.x で反復できる。

ガバナンスは二層構造である。Governance Committee が戦略と運営を担い、Technical Committee が技術方針を担い、その下に自律的な SIG 群がある。Governance Committee は技術判断を Technical Committee と SIG に委譲する。([governance charter](https://github.com/open-telemetry/community/blob/main/governance-charter.md)、[technical committee charter](https://github.com/open-telemetry/community/blob/main/tech-committee-charter.md)) 新しい SIG の作成には両委員会から 1 名ずつのスポンサーが必要で、ガバナンス文書はすべて [open-telemetry/community](https://github.com/open-telemetry/community) リポジトリに集約されている。

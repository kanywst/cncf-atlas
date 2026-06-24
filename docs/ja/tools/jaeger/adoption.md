# 採用事例・エコシステム

## 誰が使っているか

以下は公開ケーススタディ・トーク・エンジニアリング記事を持つ採用企業である。プロジェクトの `ADOPTERS.md` には Tencent、Northwestern Mutual、SeatGeek、Nets を含む 26 以上の組織が並ぶが、ここでは Jaeger の使い方を引用できるものを挙げる。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Uber | マイクロサービス全体のリクエストを追うために Jaeger を開発。 | [Evolving Distributed Tracing at Uber Engineering](https://eng.uber.com/distributed-tracing/) |
| Grafana Labs | Jaeger を利用し、クエリ性能が最大 10 倍向上したと報告。 | [Grafana Labs ケーススタディ](https://medium.com/jaegertracing/grafana-labs-teams-observed-query-performance-improvements-up-to-10x-with-jaeger-cec84b0e3609) |
| Logz.io | 大規模トレーシングに向け Jaeger をチューニング。 | [Performance Blitz with Jaeger](https://logz.io/blog/jaeger-tracing-performance/) |
| Ticketmaster | Jaeger で 1 日あたり 1 億トランザクションをトレース。 | [Ticketmaster ケーススタディ](https://medium.com/jaegertracing/ticketmaster-traces-100-million-transactions-per-day-with-jaeger-38ec6cf599f0) |
| Weaveworks | Jaeger トレーシングをログ・メトリクスと組み合わせてトラブルシュート。 | [Weaveworks ケーススタディ](https://medium.com/jaegertracing/weaveworks-combines-jaeger-tracing-with-logs-and-metrics-for-a-troubleshooting-swiss-army-knife-5afc0f42b22e) |
| Red Hat | `ADOPTERS.md` に記載。jaeger-openshift 連携を維持。 | [ADOPTERS.md](https://github.com/jaegertracing/jaeger/blob/main/ADOPTERS.md) |

## 採用のシグナル

GitHub API から 2026-06-22 に計測: stars 22,911、forks 2,967、open issues 446、コントリビュータ約 482。リポジトリ作成日は 2016-04-15。Jaeger は CNCF で 7 番目に卒業したプロジェクトである (2019-10-31、[卒業発表](https://www.cncf.io/announcements/2019/10/31/cloud-native-computing-foundation-announces-jaeger-graduation/))。メンテナ一覧 (`MAINTAINERS.md`) は Grafana Labs、Red Hat、Bloomberg、Meta、Paessler、PackSmith にまたがり、オリジナル作者 Yuri Shkuro を含む。

## エコシステム

- **OpenTelemetry**: v2 は OpenTelemetry Collector 上に構築され、計装は OpenTelemetry SDK を使う。
- **Prometheus**: Service Performance Monitoring (SPM) が spanmetrics connector でスパンから RED メトリクスを算出する。
- **Kafka**: `kafkareceiver` と `kafkaexporter` により Kafka を取り込みバッファにできる。
- **Grafana**: Jaeger データの一般的な可視化フロントエンド。
- **ストレージバックエンド**: Cassandra、Elasticsearch、OpenSearch、ClickHouse、Badger、インメモリ、リモート gRPC ストア。
- **Kubernetes**: jaeger-operator が Jaeger をデプロイ・管理する。Istio や Envoy などのサービスメッシュのトレース送信先としても定番。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Grafana Tempo | オブジェクトストレージ前提でコスト最適、Grafana と密結合。Jaeger は独自 UI とクエリ API を持ち、ストレージをプラガブルに選べる。 |
| Zipkin | Jaeger が着想を得た先行 OSS。Jaeger は zipkin receiver で Zipkin 形式のスパンを受信できる。 |
| SigNoz | OpenTelemetry ネイティブの統合可観測性。Jaeger はトレースに特化し、CNCF Graduated と長い採用実績を持つ。 |
| 商用 APM (Datadog / New Relic / Honeycomb / Elastic APM / AWS X-Ray) | マネージドでメトリクス・ログを統合。Jaeger は OSS でトレース特化、v2 で OTel Collector ネイティブ。 |

# 採用事例・エコシステム

## 誰が使っているか

以下の組織はプロジェクトの [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md) に本人申告で記載されており、各採用組織のユースケースも記録されている。リストには CERN、SBB CFF FFS、Swisscom、Atruvia、DPG Media、Skillsoft、Banco Mercantil、およびベンダの Axual や Ænix なども含まれる。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Reddit | Strimzi で 500 broker の Kafka fleet を運用、MirrorMaker でのデータレプリケーション、Kafka Connect での CDC | [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md) |
| Decathlon | Kafka Connect + Strimzi on Kubernetes でのデータ連携 | [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md) |
| AppsFlyer | 毎秒数千万メッセージの高スループットクラスタを多数、ローカル ephemeral storage で運用 | [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md) |
| Vera C. Rubin Observatory | Observatory Control System とテレメトリ基盤 | [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md) |

## 採用のシグナル

2024 年 2 月の CNCF Incubating 昇格時点で、プロジェクトは 1600 名超のコントリビュータ、180 超の貢献組織、15 の public adopters を発表した ([CNCF ブログ](https://www.cncf.io/blog/2024/02/08/strimzi-joins-the-cncf-incubator/))。2026-06-24 に GitHub API で観測した統計: スター 5,843、フォーク 1,507、open issues 145、リポジトリ作成 2016-05-06 ([GitHub リポジトリ](https://github.com/strimzi/strimzi-kafka-operator))。

## エコシステム

Strimzi は Kafka 隣接のコンポーネント群とカスタムリソース経由で連携する: リバランスの Cruise Control (`KafkaRebalance`)、Kafka Connect と MirrorMaker2、HTTP-Kafka の Kafka Bridge、Prometheus と Grafana に流す Kafka Exporter。OpenTelemetry トレースエージェントを同梱し、TLS は cert-manager に連携し、OAuth と OIDC 認証をサポートする。ガバナンスは独立した [governance リポジトリ](https://github.com/strimzi/governance/blob/main/GOVERNANCE.md) で定義される。ベンダも上に構築しており、例えば Ænix は Cozystack で Kafka as a Service に Strimzi を使う。

## 代替候補

Strimzi は upstream の Apache Kafka をそのまま、中立的な CNCF ガバナンスと完全オープンソースの Apache-2.0 ライセンスで運用する。新しいブローカプロジェクトとの本質的な違いは、Strimzi がブローカではなく Kafka を運用する Operator である点だ。

| 代替 | 違い |
| --- | --- |
| Confluent for Kubernetes | Confluent のプロプライエタリ Operator。ベンダ非依存ではなく Confluent platform に紐づく |
| Koperator (Banzai Cloud) | 別アーキテクチャの独立したオープンソース Kafka Operator 実装 |
| NATS / Pulsar | 全く別のメッセージングシステムで、Apache Kafka を Kubernetes で動かす手段ではない |

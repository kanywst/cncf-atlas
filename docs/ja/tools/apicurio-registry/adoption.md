# Adoption & Ecosystem

## 誰が使っているか

以下の組織はプロジェクトの `ADOPTERS.md`（出典 8）に記載されている。各行はそのファイルが記述するユースケースを反映する。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| IBM | IBM Event Streams に同梱されるスキーマレジストリコンポーネント（Vendor, 2020 以降） | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |
| Red Hat | Red Hat build of Apicurio Registry（Red Hat Application Foundations の一部、Vendor, 2020 以降） | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |
| Axual | OSS の Kafka と Apicurio Registry 上に構築したストリーミングプラットフォーム（Vendor, 2021 以降） | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |
| Castor | イベントストリーミングと service 間通信の中央スキーマレジストリ（End-user, 2024 以降） | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |
| Libon | 組織全体の Kafka Avro スキーマの source of truth（End-user, 2025 以降） | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |
| ZenWave 360 | AsyncAPI と Avro の canonical reference の保存・バージョニング（End-user） | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |

## 採用のシグナル

GitHub リポジトリメタ（2026-06-26 取得、出典 3）:

- Stars: 818
- Forks: 322
- Contributors: 123
- Open issues: 338
- リポジトリ作成: 2019-07-16

2 つの商用ダウンストリームが adopter リストを補強する。Red Hat build of Apicurio Registry と IBM Event Streams で、どちらもプロジェクトを組み込んでいる（出典 8）。リリースは Semantic Versioning に従い、パッチリリースはセキュリティ修正専用、サポート対象は直近 2 つのマイナーバージョン（出典 1）。

## エコシステム

Apicurio Registry は Kafka とイベントストリーミングのエコシステムに位置する。`serdes/` モジュールは Kafka / NATS / Pulsar の serializer/deserializer を提供する。Kubernetes operator はマイナーバージョンごとの OLM（Operator Lifecycle Manager）チャネルで提供される（出典 1）。`mcp/` モジュールは Model Context Protocol（MCP）サーバを公開し、クライアント SDK は Java / Go / Python / TypeScript をカバーする。

CNCF 統合作業は issue #461（出典 5）で追跡される。Strimzi（Kubernetes 上で Kafka を動かす。Apicurio は KafkaSQL ストアとスキーマレジストリの両方になれる）、CloudEvents（artifact type 拡張として）、xRegistry（準拠を目指す標準）。

## 代替候補

registry は `app/.../ccompat/rest/`（パッケージ `v7` と `v8`）で Confluent Schema Registry 互換 REST API を公開するので、既存の Confluent クライアントは向き先を変えられる。各代替に対する差別化は以下のとおり具体的である。

| 代替 | 違い |
| --- | --- |
| Confluent Schema Registry | Kafka 世界のデファクト。Apicurio は互換クライアント API を持ちつつ Apache 2.0 で提供（Confluent は Confluent Community License）、複数ストレージバックエンドと複数 artifact type に対応。 |
| AWS Glue Schema Registry | マネージドで AWS に固定。Apicurio はセルフホストでクラウド・オンプレ間を可搬。 |
| Azure Schema Registry | マネージドで Azure に固定。Apicurio はセルフホストで可搬。 |
| Buf Schema Registry (BSR) | Protobuf 特化。Apicurio は多数のスキーマ言語に加え OpenAPI や AsyncAPI といった API 定義も扱う。 |

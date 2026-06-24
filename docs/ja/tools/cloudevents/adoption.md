# 採用事例・エコシステム

## 誰が使っているか

以下は CNCF Graduation 発表が明示する採用先だ (出典 3)。CloudEvents を公開する商用の製品・サービスと、その上に構築する CNCF プロジェクトに分かれる。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Adobe | Adobe I/O Events が CloudEvents 形式を使う | [CNCF graduation 発表](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |
| Alibaba Cloud | EventBridge が CloudEvents を話す | [CNCF graduation 発表](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |
| Microsoft | Azure Event Grid が CloudEvents v1.0 JSON スキーマと HTTP binding をサポート | [Azure Event Grid schema](https://learn.microsoft.com/en-us/azure/event-grid/cloud-event-schema) |
| European Commission | CloudEvents 採用先として明記 | [CNCF graduation 発表](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |
| Google Cloud | Eventarc が CloudEvents 形式でイベントを配信 | [CNCF graduation 発表](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |
| IBM Cloud | Code Engine が CloudEvents を使う | [CNCF graduation 発表](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |
| Knative | Eventing が CloudEvents を HTTP POST で送受信 | [Knative Eventing docs](https://knative.dev/docs/eventing/) |
| Argo, Falco, Harbor, Serverless Workflow | CloudEvents 採用先として明記された CNCF プロジェクト | [CNCF graduation 発表](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/) |

## 採用のシグナル

CloudEvents 仕様リポジトリは 5,799 stars / 613 forks (GitHub、2026-06-22) (出典 2、13)。Graduation 発表によれば仕様には 122 組織から 340 名超の contributors が関与した (出典 3)。

本稿で読む実装 `cloudevents/sdk-go` は 956 stars / 246 forks / 138 open issues (GitHub、2026-06-22)、contributors は約 122 名 (出典 1、13)。公式 SDK のなかで最も普及しており、sdk-java (約 360)・sdk-javascript (約 399)・sdk-csharp (約 332) を上回る (出典 1、13)。SDK 最新リリースタグは `v2.16.2` (2025-09-22) (出典 1)。

## エコシステム

- **公式 SDK**: Go・JavaScript/TypeScript・Java・C#・Python・Ruby・PHP・PowerShell・Rust (出典 1、5)。
- **sdk-go のプロトコルバインディング**: HTTP・Kafka (sarama と confluent)・MQTT・AMQP・NATS・NATS JetStream・GCP Pub/Sub・STAN・プロセス内 gochan。`v2/protocol/` と `samples/` で確認できる (出典 1)。
- **CloudEvents SQL (CESQL)**: イベントをフィルタ・クエリする SQL 風言語。SDK では `sql/` に実装 (出典 2)。
- **マネージドサービス**: Azure Event Grid・Google Cloud Eventarc・Alibaba Cloud EventBridge・IBM Cloud Code Engine が上記のとおり CloudEvents を公開する (出典 3、8)。

## 代替候補

| 代替 | 違い |
| --- | --- |
| AsyncAPI | イベント駆動 API とチャネルの契約・ドキュメントを記述する。CloudEvents はペイロード非依存のエンベロープとプロトコルバインディングを標準化するため、両者は併用できる (AsyncAPI が記述するチャネルの中に CloudEvents エンベロープ) (出典 12) |
| クラウド固有のイベントスキーマ (例: AWS EventBridge のネイティブ形式) | プロバイダ固有の形状。CloudEvents は移植性のための中立形式で、各社はネイティブ形式と並べて CloudEvents モードを併設することが多い (出典 8) |
| 標準エンベロープなしの素の JSON / Avro / Protobuf | 合意された属性名やトランスポートバインディングがない。CloudEvents は属性命名と HTTP・Kafka 等への写像を統一する点が本質差 (出典 6、7) |

# CloudEvents

> イベントデータを共通の形式で記述するベンダー中立な仕様。SDK が HTTP・Kafka・MQTT などのトランスポート越しにそのイベントを運ぶ。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Graduated
- **言語**: Go (本ディープダイブは `sdk-go` 実装を読む)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cloudevents/sdk-go](https://github.com/cloudevents/sdk-go)
- **ドキュメント基準コミット**: `1e99396` (2026-06-19)

## 何をするものか

CloudEvents はイベントデータの共通エンベロープを定める仕様だ。各プラットフォームが独自のイベント形状を発明する代わりに、CloudEvents は小さなコンテキスト属性の集合 (`id`、`source`、`type`、`specversion`、加えていくつかの任意属性) を固定し、それらの属性を HTTP・Kafka・MQTT・AMQP などの具体的なトランスポートにどう写像するかを定める。ペイロード自体は不透明なままで、エンベロープは中身を問わない。JSON でも Avro でも Protobuf でも生バイトでも運べる。

仕様本体は `cloudevents/spec` にあり、大半が散文と適合性 (conformance) 資料だ。実行可能な部分は各言語の SDK 群にある。本ディープダイブは Go SDK の `cloudevents/sdk-go` を追う。最も普及した実装であり、抽象的な仕様がどうワイヤ上のバイト列になるかをコードが見せてくれるからだ。SDK は正準データモデル `event.Event`、プロトコル非依存の `binding` 層、トランスポートごとの `protocol` パッケージに分かれる。

CloudEvents はイベント生成側と消費側の統合面に位置する。FaaS プラットフォーム、イベンティングブローカー、移植可能なイベントを欲しいアプリケーションが CloudEvents を使うと、標準に対して書かれた消費側はどの生成側やトランスポートがイベントを出したかを知らずに済む。

## いつ使うか

- 別々のチームやベンダーが所有するシステム間でイベントを移動させ、多数の独自形式ではなく 1 つのエンベロープ形式に揃えたいとき。
- トランスポートをまたいでイベントを橋渡し (例: HTTP から Kafka) し、メタデータをそのホップ越しに保ちたいとき。
- すでに CloudEvents を話す Knative Eventing やクラウドのイベントバスの上に構築するとき。
- ペイロードを解析せずにイベントのメタデータでフィルタ・ルーティングしたいとき。

向かないのは、イベントが単一トランスポートの閉じたシステムから出ない場合で、独自構造体の方が単純だ。エンベロープではなくスキーマ交渉を含む完全な API コントラクトが必要なときも層が違う (AsyncAPI のようなツールがそこを狙う)。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとイベントの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [cloudevents/sdk-go](https://github.com/cloudevents/sdk-go) (Go SDK、本稿で読む実装)、参照 2026-06-22。
2. [cloudevents/spec](https://github.com/cloudevents/spec) (仕様本体リポジトリ)、参照 2026-06-22。
3. [CNCF Announces the Graduation of CloudEvents (2024-01-25)](https://www.cncf.io/announcements/2024/01/25/cloud-native-computing-foundation-announces-the-graduation-of-cloudevents/)、参照 2026-06-22。
4. [Serverless specification CloudEvents reaches Version 1.0 (2019-10-28)](https://www.cncf.io/announcements/2019/10/28/serverless-specification-cloudevents-reaches-version-1-0/)、参照 2026-06-22。
5. [CloudEvents 公式サイト](https://cloudevents.io/)、参照 2026-06-22。
6. [CloudEvents Primer](https://github.com/cloudevents/spec/blob/main/cloudevents/primer.md)、参照 2026-06-22。
7. [CloudEvents Core Specification](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md)、参照 2026-06-22。
8. [Azure Event Grid CloudEvents v1.0 schema](https://learn.microsoft.com/en-us/azure/event-grid/cloud-event-schema)、参照 2026-06-22。
9. [Microsoft Open Source: CloudEvents v1.0 support on Azure Event Grid (2019-11-21)](https://opensource.microsoft.com/blog/2019/11/21/boosting-cloud-interoperability-cloudevents-v1-0-support-azure-event-grid/)、参照 2026-06-22。
10. [Knative Eventing overview](https://knative.dev/docs/eventing/)、参照 2026-06-22。
11. [pkg.go.dev: sdk-go/v2](https://pkg.go.dev/github.com/cloudevents/sdk-go/v2)、参照 2026-06-22。
12. [AsyncAPI](https://www.asyncapi.com/)、参照 2026-06-22。

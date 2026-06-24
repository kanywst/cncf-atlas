# KEDA

> KEDA は任意の外部イベントソースを Kubernetes の Horizontal Pod Autoscaler に橋渡しし、ワークロードをゼロまでスケールさせる。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [kedacore/keda](https://github.com/kedacore/keda)
- **ドキュメント基準コミット**: `c5b577c` (2026-06-19, `v2.20.1` の先の `main`)

## 何をするものか

KEDA (Kubernetes-based Event Driven Autoscaling) は用途を絞ったオートスケーラだ。ネイティブの Horizontal Pod Autoscaler (HPA) は CPU とメモリでスケールし、ワークロードを 1 レプリカ未満には落とせない。KEDA はこの両方の穴を埋める。キュー・ストリーム・データベースなどの外部システムからメトリクスを読み、Kubernetes の External Metrics API 経由で HPA に渡し、HPA 自身ができない 0→1 の遷移を肩代わりする。

ワークロードを指す `ScaledObject` (または `ScaledJob`) を宣言し、トリガを列挙する。各トリガは `apache-kafka` や `aws-sqs-queue` といった scaler の種別とそのメタデータを指定する。KEDA はその scaler を構築し、ポーリングし、HPA を代理で作成する。1→N のスケール判断は依然として HPA が持ち、KEDA はイベントの配管とゼロスケールの挙動を担う。

KEDA はクラスタ内に 2 つのワークロードと 1 つの admission webhook として導入される。HPA・Cluster Autoscaler・サービスメッシュを置き換えるものではない。イベントソースと HPA の間に位置する。

## いつ使うか

- ワークロードの負荷が CPU でなくキュー長・ストリームのラグなど外部シグナルで決まる。
- アイドル時にワークロードをゼロまで落とし、最初のイベントで起こしたい。
- 70 以上の内蔵ソース (Kafka, RabbitMQ, NATS, Prometheus, AWS SQS/Kinesis/CloudWatch, Azure Service Bus/Event Hub, GCP Pub/Sub など) から消費し、ソースごとの metrics adapter を運用したくない。
- イベント駆動のバッチ処理を回し、ジョブ数をバックログに連動させたい (`ScaledJob`)。

向かない場面: 純粋な CPU/メモリスケールはネイティブ HPA だけで足りる。ノード単位のスケールは Cluster Autoscaler や Karpenter の仕事だ。KEDA がスケールするのはノードでなく Pod だ。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [kedacore/keda リポジトリと README](https://github.com/kedacore/keda)
2. [kedacore/keda コミット c5b577c](https://github.com/kedacore/keda/commit/c5b577cd882d7a4572787e48868ed6a82da91369)
3. [KEDA v2.20.1 リリース](https://github.com/kedacore/keda/releases/tag/v2.20.1)
4. [CNCF: KEDA graduation アナウンス](https://www.cncf.io/announcements/2023/08/22/cloud-native-computing-foundation-announces-graduation-of-kubernetes-autoscaler-keda/)
5. [CNCF Projects: KEDA](https://www.cncf.io/projects/keda/)
6. [KEDA blog: CNCF Graduated への昇格](https://keda.sh/blog/2023-08-22-keda-cncf-graduation/)
7. [keda.sh deploy ドキュメント](https://keda.sh/docs/latest/deploy/)
8. [kedacore/http-add-on](https://github.com/kedacore/http-add-on)
9. [openshift/kedacore-keda](https://github.com/openshift/kedacore-keda)

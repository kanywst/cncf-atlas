# Strimzi

> Apache Kafka を宣言的なカスタムリソースと Operator で Kubernetes 上に構築・運用する。

- **カテゴリ**: Messaging & Streaming
- **CNCF 成熟度**: Incubating
- **言語**: Java 21
- **ライセンス**: Apache License 2.0
- **リポジトリ**: [strimzi/strimzi-kafka-operator](https://github.com/strimzi/strimzi-kafka-operator)
- **ドキュメント基準コミット**: `9505103` (2026-06-23)

## 何をするものか

Strimzi は Operator パターンで Apache Kafka を Kubernetes 上で運用する。`Kafka`、`KafkaNodePool`、`KafkaTopic`、`KafkaUser` といったカスタムリソースで望む状態を宣言すると、コントローラがクラスタをそれに合わせて reconcile する。これらのカスタムリソースのモデルは `api/` モジュールにある Java POJO であり、CRD はそこから生成される。

中核のコントローラが Cluster Operator である。その `main` メソッドは環境変数から設定を構築し、監視対象 namespace ごとに 1 つの reconciler をデプロイする (`cluster-operator/src/main/java/io/strimzi/operator/cluster/Main.java:62`)。reconcile は標準的な Operator ループで、カスタムリソースから desired state を読み、クラスタの現状と比較し、差分を適用する。処理は冪等で、Kubernetes の watch イベントと定期的な resync の両方で動く。

対象は、すでに Kubernetes を運用していて Kafka も他のものと同じように管理したいチームである。GitOps と相性の良い YAML、ローリングアップグレード、TLS、認証を手作業ではなく Operator が扱う。Strimzi は新しいブローカではない。upstream の Apache Kafka (このコミットでは 4.3.0、`pom.xml:87`) をそのままパッケージし運用する。

## いつ使うか

- Kafka を Kubernetes 上で運用しており、手動のブローカ管理ではなく宣言的でバージョン管理されたクラスタ定義が欲しい。
- カスタムリソース駆動の自動ローリングアップグレード、証明書ローテーション、ユーザ・トピック管理が必要。
- upstream の Apache Kafka をそのまま使う、ベンダ非依存で完全オープンソースの Operator が欲しい。
- Kubernetes を運用していない場合、または完全マネージドなクラウド Kafka サービスで運用要件を満たせる場合は不向き。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [strimzi/strimzi-kafka-operator (GitHub)](https://github.com/strimzi/strimzi-kafka-operator)
2. [固定コミット 9505103](https://github.com/strimzi/strimzi-kafka-operator/commit/9505103de40c9756faa4d8cf97ca7c2791c46424)
3. [Strimzi is now a CNCF Incubating project!](https://strimzi.io/blog/2024/02/08/strimzi-incubation/)
4. [Strimzi joins the CNCF Incubator (CNCF)](https://www.cncf.io/blog/2024/02/08/strimzi-joins-the-cncf-incubator/)
5. [Strimzi (CNCF projects)](https://www.cncf.io/projects/strimzi/)
6. [Open innovation: Red Hat's impact on the Kafka and Strimzi ecosystem](https://developers.redhat.com/articles/2024/06/26/open-innovation-red-hats-impact-kafka-and-strimzi-ecosystem)
7. [Strimzi Apache Kafka Operator joins the CNCF (2019)](https://strimzi.io/blog/2019/09/06/cncf/)
8. [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md)
9. [Strimzi governance リポジトリ](https://github.com/strimzi/governance/blob/main/GOVERNANCE.md)
10. [Strimzi Quickstarts](https://strimzi.io/quickstarts/)
11. [CNCF Incubates Strimzi to Simplify Kafka on Kubernetes (InfoQ)](https://www.infoq.com/news/2024/03/cncf-strimzi-kafka-kubernetes/)

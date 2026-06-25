# sources: Strimzi

各出典に番号を振り、recon / ドキュメント側の引用と対応させる。アクセス日付き。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | strimzi/strimzi-kafka-operator (GitHub) | <https://github.com/strimzi/strimzi-kafka-operator> | 2026-06-24 |
| 2 | repo | pinned commit 9505103 (clone した src/, 2026-06-23) | <https://github.com/strimzi/strimzi-kafka-operator/commit/9505103de40c9756faa4d8cf97ca7c2791c46424> | 2026-06-24 |
| 3 | blog | Strimzi is now a CNCF Incubating project! (起源 / 0.1.0 / マイルストーン) | <https://strimzi.io/blog/2024/02/08/strimzi-incubation/> | 2026-06-24 |
| 4 | blog | Strimzi joins the CNCF Incubator (CNCF, 1600+ contributors / 180+ orgs / 15 adopters) | <https://www.cncf.io/blog/2024/02/08/strimzi-joins-the-cncf-incubator/> | 2026-06-24 |
| 5 | landscape | Strimzi (CNCF projects, Incubating / 受理日 2019-08-28) | <https://www.cncf.io/projects/strimzi/> | 2026-06-24 |
| 6 | blog | Open innovation: Red Hat's impact on the Kafka and Strimzi ecosystem (Red Hat 2017 起源) | <https://developers.redhat.com/articles/2024/06/26/open-innovation-red-hats-impact-kafka-and-strimzi-ecosystem> | 2026-06-24 |
| 7 | blog | Strimzi Apache Kafka Operator joins the CNCF (2019 Sandbox 当時の告知) | <https://strimzi.io/blog/2019/09/06/cncf/> | 2026-06-24 |
| 8 | repo | ADOPTERS.md (本人申告の採用組織一覧) | <https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md> | 2026-06-24 |
| 9 | repo | GOVERNANCE.md → governance リポジトリ | <https://github.com/strimzi/governance/blob/main/GOVERNANCE.md> | 2026-06-24 |
| 10 | docs | Strimzi Quickstarts (minikube / kind / OKD) | <https://strimzi.io/quickstarts/> | 2026-06-24 |
| 11 | news | CNCF Incubates Strimzi to Simplify Kafka on Kubernetes (InfoQ) | <https://www.infoq.com/news/2024/03/cncf-strimzi-kafka-kubernetes/> | 2026-06-24 |

## path:line アンカー (clone した src/ 基準, commit 9505103)

| 引用 | path:line |
| --- | --- |
| main エントリポイント | `cluster-operator/src/main/java/io/strimzi/operator/cluster/Main.java:62` |
| verticle デプロイ / namespace ごと | `cluster-operator/.../Main.java:151,188-199` |
| leader election | `cluster-operator/.../Main.java:230,247` |
| reconcile 共通骨格 | `cluster-operator/.../operator/assembly/AbstractOperator.java:181,211` |
| Kafka createOrUpdate | `cluster-operator/.../operator/assembly/KafkaAssemblyOperator.java:156` |
| reconcile チェーン | `KafkaAssemblyOperator.java:231,234-249` |
| KafkaReconciler.reconcile | `KafkaReconciler.java:250,252-283` |
| podSet() | `KafkaReconciler.java:904` |
| rollingUpdate | `KafkaReconciler.java:937,940` |
| StrimziPodSetController | `cluster-operator/.../operator/assembly/StrimziPodSetController.java:60` |
| Kafka CR モデル / @Version(V1) | `api/src/main/java/io/strimzi/api/kafka/model/kafka/Kafka.java:80-82,87` |
| KafkaSpec | `api/.../kafka/KafkaSpec.java:35-41` |
| StrimziPodSetSpec | `api/.../podset/StrimziPodSetSpec.java:31-32` |
| NodeRef record | `cluster-operator/.../model/NodeRef.java:16` |
| Java 21 / Kafka 4.3.0 / Fabric8 7.7.0 | `pom.xml:44,87,75` |

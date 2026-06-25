# 内部実装

> コミット `9505103` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `api/` | CRD と API モデル (`Kafka`、`KafkaNodePool`、`StrimziPodSet` など)。CRD はここから生成 |
| `cluster-operator/` | Kafka クラスタ本体と周辺コンポーネントを reconcile する中核 Operator |
| `topic-operator/` | `KafkaTopic` リソースを Kafka のトピックに反映 |
| `user-operator/` | `KafkaUser` リソースをユーザ・ACL・TLS 証明書に反映 |
| `operator-common/` | 共有ユーティリティ: `Reconciliation` コンテキストと Fabric8 resource operator |
| `certificate-manager/` | プロジェクト自前の CA と TLS 証明書の管理 |

## 中核データ構造

`Kafka` (`api/src/main/java/io/strimzi/api/kafka/model/kafka/Kafka.java:82`) はトップレベルのカスタムリソースで、Fabric8 の `CustomResource<KafkaSpec, KafkaStatus>` を継承する。`@Version(Constants.V1)` (`Kafka.java:80`) が付き、kind は `Kafka` (`Kafka.java:87`)。

`KafkaSpec` (`api/src/main/java/io/strimzi/api/kafka/model/kafka/KafkaSpec.java:35`) はクラスタの desired state を保持する: Kafka クラスタ spec、entity operator、`clusterCa` と `clientsCa`、Kafka Exporter、Cruise Control、メンテナンスタイムウィンドウ。

`StrimziPodSetSpec` (`api/src/main/java/io/strimzi/api/kafka/model/podset/StrimziPodSetSpec.java:31`) は意図的に最小限だ: `LabelSelector selector` と、生の pod 定義を持つ `List<Map<String, Object>> pods`。これが StatefulSet なしで pod 群を宣言する仕組みである。

`NodeRef` (`cluster-operator/src/main/java/io/strimzi/operator/cluster/model/NodeRef.java:16`) は不変レコード:

```java
public record NodeRef(String podName, int nodeId, String poolName, boolean controller, boolean broker) {
```

`controller` と `broker` のフラグは、KRaft で 1 ノードが controller・broker・両方のいずれにもなりうることを表す。reconcile 全体でノードを指す共通キーだ。

`Reconciliation` (`operator-common/src/main/java/io/strimzi/operator/common/Reconciliation.java`) は 1 回の reconcile を namespace・name・kind・連番で識別し、ログ・メトリクス・ロックのキーに使う。

## 追う価値のあるパス

`Kafka` の reconcile は `KafkaReconciler.podSet()` (`cluster-operator/src/main/java/io/strimzi/operator/cluster/operator/assembly/KafkaReconciler.java:904`) で pod に到達する:

```java
protected Future<Map<String, ReconcileResult<StrimziPodSet>>> podSet() {
    return strimziPodSetOperator
            .batchReconcile(
                    reconciliation,
                    reconciliation.namespace(),
                    kafka.generatePodSets(imagePullPolicy, imagePullSecrets, this::podSetPodAnnotations),
                    kafka.getSelectorLabels()
            )
            .compose(podSetDiff -> waitForNewNodes().map(podSetDiff));
}
```

`kafka.generatePodSets(...)` が desired な `StrimziPodSet` (それぞれ pod テンプレートのリストを持つ) を作り、`batchReconcile` が現状との diff を取って適用する。得られた `podSetDiffs` を `rollingUpdate(podSetDiffs)` (`KafkaReconciler.java:937`) に渡し、`ReconcilerUtils.reasonsToRestartPod(...)` (`KafkaReconciler.java:940`) が pod 単位で設定変更・証明書変更・FS リサイズのいずれが再起動を要するかを判定する。必要な broker だけを 1 台ずつ再起動する。これが無停止のローリング更新の実体だ。

## 読んで驚いた点

Strimzi は StatefulSet に頼らず pod を直接管理する。`StrimziPodSetController` (`cluster-operator/src/main/java/io/strimzi/operator/cluster/operator/assembly/StrimziPodSetController.java:60`) は `implements Runnable` で、assembly operator が使う Vert.x の reconcile パスではなく、informer と自前の `ArrayBlockingQueue` work queue で動く。コントローラを自前で握るからこそ、再起動順序の制御、個別 broker の操作、broker ごとのストレージと KRaft ロールの割り当てができる。StatefulSet ではこれらが隠れてしまう。

リーダー選出のフェイルオーバは荒削りで、それが狙いだ。レプリカがリーダーでなくなると、Operator は `System.exit(1)` を呼んで Kubernetes にコンテナを再起動させる (`cluster-operator/src/main/java/io/strimzi/operator/cluster/Main.java:247`)。passive プロセスを生かして同期を保とうとはしない。

# Internals

> Read from the source at commit `9505103`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `api/` | CRD and API models (`Kafka`, `KafkaNodePool`, `StrimziPodSet`, and others); CRDs are generated from these |
| `cluster-operator/` | Core operator that reconciles the Kafka cluster and surrounding components |
| `topic-operator/` | Reflects `KafkaTopic` resources onto Kafka topics |
| `user-operator/` | Reflects `KafkaUser` resources onto users, ACLs, and TLS certificates |
| `operator-common/` | Shared utilities: `Reconciliation` context and Fabric8 resource operators |
| `certificate-manager/` | Project CA and TLS certificate management |

## Core data structures

`Kafka` (`api/src/main/java/io/strimzi/api/kafka/model/kafka/Kafka.java:82`) is the top-level custom resource, extending the Fabric8 `CustomResource<KafkaSpec, KafkaStatus>`. It is annotated `@Version(Constants.V1)` (`Kafka.java:80`) and its kind is `Kafka` (`Kafka.java:87`).

`KafkaSpec` (`api/src/main/java/io/strimzi/api/kafka/model/kafka/KafkaSpec.java:35`) holds the cluster's desired state: the Kafka cluster spec, entity operator, `clusterCa` and `clientsCa`, Kafka Exporter, Cruise Control, and maintenance time windows.

`StrimziPodSetSpec` (`api/src/main/java/io/strimzi/api/kafka/model/podset/StrimziPodSetSpec.java:31`) is deliberately minimal: a `LabelSelector selector` and a `List<Map<String, Object>> pods` holding raw pod definitions. This is how Strimzi declares a group of pods without a StatefulSet.

`NodeRef` (`cluster-operator/src/main/java/io/strimzi/operator/cluster/model/NodeRef.java:16`) is an immutable record:

```java
public record NodeRef(String podName, int nodeId, String poolName, boolean controller, boolean broker) {
```

The `controller` and `broker` flags capture that in KRaft a single node can be a controller, a broker, or both. It is the common key for a node across the reconcile.

`Reconciliation` (`operator-common/src/main/java/io/strimzi/operator/common/Reconciliation.java`) identifies a single reconcile run by namespace, name, kind, and a sequence number, and is used as the key for logging, metrics, and locking.

## A path worth tracing

The `Kafka` reconcile reaches the pods through `KafkaReconciler.podSet()` (`cluster-operator/src/main/java/io/strimzi/operator/cluster/operator/assembly/KafkaReconciler.java:904`):

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

`kafka.generatePodSets(...)` builds the desired `StrimziPodSet` objects (each carrying its list of pod templates), and `batchReconcile` diffs them against the cluster and applies the difference. The resulting `podSetDiffs` are handed to `rollingUpdate(podSetDiffs)` (`KafkaReconciler.java:937`), which uses `ReconcilerUtils.reasonsToRestartPod(...)` (`KafkaReconciler.java:940`) to decide, per pod, whether a config change, certificate change, or filesystem resize requires a restart. Only the brokers that need it are restarted, one at a time, which is how Strimzi performs rolling updates without downtime.

## Things that surprised me

Strimzi manages pods directly instead of leaning on a StatefulSet. The `StrimziPodSetController` (`cluster-operator/src/main/java/io/strimzi/operator/cluster/operator/assembly/StrimziPodSetController.java:60`) `implements Runnable` and runs on an informer plus its own `ArrayBlockingQueue` work queue rather than the Vert.x reconcile path used by the assembly operators. Owning the controller is what lets Strimzi control restart order, target individual brokers, and assign per-broker storage and KRaft roles, all of which a StatefulSet would hide.

The leader election failover is blunt and intentional: when a replica stops being leader, the operator calls `System.exit(1)` so Kubernetes restarts the container (`cluster-operator/src/main/java/io/strimzi/operator/cluster/Main.java:247`), rather than trying to keep a passive process alive and in sync.

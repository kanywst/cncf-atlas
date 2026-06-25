# Strimzi

> Run and operate Apache Kafka on Kubernetes through declarative custom resources and operators.

- **Category**: Messaging & Streaming
- **CNCF maturity**: Incubating
- **Language**: Java 21
- **License**: Apache License 2.0
- **Repository**: [strimzi/strimzi-kafka-operator](https://github.com/strimzi/strimzi-kafka-operator)
- **Documented at commit**: `9505103` (2026-06-23)

## What it is

Strimzi runs Apache Kafka on Kubernetes using the operator pattern. You declare what you want with custom resources such as `Kafka`, `KafkaNodePool`, `KafkaTopic`, and `KafkaUser`, and a controller reconciles the cluster to match. The custom resource models live in the `api/` module and are the same Java POJOs from which the CRDs are generated.

The core controller is the Cluster Operator. Its `main` method builds configuration from environment variables and deploys one reconciler per watched namespace (`cluster-operator/src/main/java/io/strimzi/operator/cluster/Main.java:62`). Reconciliation is the standard operator loop: read the desired state from a custom resource, compare it with what runs in the cluster, and apply the difference. The work is idempotent and runs both on Kubernetes watch events and on periodic resync.

Strimzi targets teams that already run Kubernetes and want Kafka managed the same way as everything else: GitOps-friendly YAML, rolling upgrades, TLS, and authentication handled by the operator rather than by hand. It is not a new broker. It packages and operates upstream Apache Kafka (version 4.3.0 at this commit, `pom.xml:87`).

## When to use it

- You run Kafka on Kubernetes and want declarative, version-controlled cluster definitions instead of manual broker administration.
- You need automated rolling upgrades, certificate rotation, and user or topic management driven by custom resources.
- You want a vendor-neutral, fully open-source operator that uses upstream Apache Kafka unchanged.
- It is a poor fit if you do not run Kubernetes, or if a fully managed cloud Kafka service already meets your operational needs.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [strimzi/strimzi-kafka-operator (GitHub)](https://github.com/strimzi/strimzi-kafka-operator)
2. [Pinned commit 9505103](https://github.com/strimzi/strimzi-kafka-operator/commit/9505103de40c9756faa4d8cf97ca7c2791c46424)
3. [Strimzi is now a CNCF Incubating project!](https://strimzi.io/blog/2024/02/08/strimzi-incubation/)
4. [Strimzi joins the CNCF Incubator (CNCF)](https://www.cncf.io/blog/2024/02/08/strimzi-joins-the-cncf-incubator/)
5. [Strimzi (CNCF projects)](https://www.cncf.io/projects/strimzi/)
6. [Open innovation: Red Hat's impact on the Kafka and Strimzi ecosystem](https://developers.redhat.com/articles/2024/06/26/open-innovation-red-hats-impact-kafka-and-strimzi-ecosystem)
7. [Strimzi Apache Kafka Operator joins the CNCF (2019)](https://strimzi.io/blog/2019/09/06/cncf/)
8. [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md)
9. [Strimzi governance repository](https://github.com/strimzi/governance/blob/main/GOVERNANCE.md)
10. [Strimzi Quickstarts](https://strimzi.io/quickstarts/)
11. [CNCF Incubates Strimzi to Simplify Kafka on Kubernetes (InfoQ)](https://www.infoq.com/news/2024/03/cncf-strimzi-kafka-kubernetes/)

# Adoption & Ecosystem

## Who uses it

The organisations below are self-reported in the project's [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md), which records each adopter's use case. The list also includes CERN, SBB CFF FFS, Swisscom, Atruvia, DPG Media, Skillsoft, and Banco Mercantil, and vendors such as Axual and Ænix.

| Organisation | Use case | Source |
| --- | --- | --- |
| Reddit | Runs a Kafka fleet of 500 brokers with Strimzi, data replication via MirrorMaker, and CDC via Kafka Connect | [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md) |
| Decathlon | Data integration with Kafka Connect and Strimzi on Kubernetes | [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md) |
| AppsFlyer | Many high-throughput clusters at tens of millions of messages per second on local ephemeral storage | [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md) |
| Vera C. Rubin Observatory | Observatory Control System and telemetry platform | [ADOPTERS.md](https://github.com/strimzi/strimzi-kafka-operator/blob/main/ADOPTERS.md) |

## Adoption signals

At CNCF Incubating promotion in February 2024, the project reported more than 1600 contributors, more than 180 contributing organisations, and 15 public adopters ([CNCF blog](https://www.cncf.io/blog/2024/02/08/strimzi-joins-the-cncf-incubator/)). GitHub statistics observed on 2026-06-24 via the GitHub API: 5,843 stars, 1,507 forks, 145 open issues, repository created 2016-05-06 ([GitHub repo](https://github.com/strimzi/strimzi-kafka-operator)).

## Ecosystem

Strimzi integrates with a number of Kafka-adjacent components, managed through custom resources: Cruise Control for rebalancing (`KafkaRebalance`), Kafka Connect and MirrorMaker2, the Kafka Bridge for HTTP-to-Kafka, and Kafka Exporter feeding Prometheus and Grafana. It ships an OpenTelemetry tracing agent, integrates with cert-manager for TLS, and supports OAuth and OIDC authentication. Governance is defined in a separate [governance repository](https://github.com/strimzi/governance/blob/main/GOVERNANCE.md). Vendors build on it too, for example Ænix uses Strimzi for Kafka as a Service in Cozystack.

## Alternatives

Strimzi runs upstream Apache Kafka unchanged under neutral CNCF governance and a fully open-source Apache-2.0 license. Its main distinction from new broker projects is that it is not a broker at all; it is an operator that runs Kafka.

| Alternative | Differs by |
| --- | --- |
| Confluent for Kubernetes | Proprietary operator from Confluent, tied to the Confluent platform rather than vendor-neutral |
| Koperator (Banzai Cloud) | A separate open-source Kafka operator implementation with a different architecture |
| NATS / Pulsar | Different messaging systems entirely, not ways to run Apache Kafka on Kubernetes |

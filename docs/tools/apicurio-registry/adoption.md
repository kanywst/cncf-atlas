# Adoption & Ecosystem

## Who uses it

The organisations below are listed in the project's `ADOPTERS.md` (source 8). Each row reflects how that file describes the use case.

| Organisation | Use case | Source |
| --- | --- | --- |
| IBM | Schema registry component bundled in IBM Event Streams (Vendor, since 2020) | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |
| Red Hat | Red Hat build of Apicurio Registry, part of Red Hat Application Foundations (Vendor, since 2020) | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |
| Axual | Streaming platform built on open-source Kafka and Apicurio Registry (Vendor, since 2021) | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |
| Castor | Central schema registry for event streaming and inter-service communication (End-user, since 2024) | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |
| Libon | Source of truth for Kafka Avro schemas across the organisation (End-user, since 2025) | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |
| ZenWave 360 | Storing and versioning canonical references for AsyncAPI and Avro (End-user) | [ADOPTERS.md](https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md) |

## Adoption signals

GitHub repository metadata, observed 2026-06-26 (source 3):

- Stars: 818
- Forks: 322
- Contributors: 123
- Open issues: 338
- Repository created: 2019-07-16

Two commercial downstreams reinforce the adopter list: the Red Hat build of Apicurio Registry and IBM Event Streams, both of which embed the project (source 8). Releases follow Semantic Versioning, with patch releases reserved for security fixes and a support window covering the latest two minor versions (source 1).

## Ecosystem

Apicurio Registry sits in the Kafka and event-streaming ecosystem. The `serdes/` module provides serializers and deserializers for Kafka, NATS, and Pulsar. A Kubernetes operator ships with OLM (Operator Lifecycle Manager) channels per minor version (source 1). An `mcp/` module exposes a Model Context Protocol (MCP) server, and client SDKs cover Java, Go, Python, and TypeScript.

CNCF integration work is tracked in issue #461 (source 5): Strimzi (running Kafka on Kubernetes, where Apicurio can act as both a KafkaSQL store and a schema registry), CloudEvents (as an artifact type extension), and xRegistry (a standard the project aims to conform to).

## Alternatives

The registry exposes a Confluent Schema Registry compatible REST API under `app/.../ccompat/rest/` (packages `v7` and `v8`), so existing Confluent clients can point at it. The differentiation against each alternative below is concrete.

| Alternative | Differs by |
| --- | --- |
| Confluent Schema Registry | The Kafka-world default. Apicurio offers a compatible client API but ships under Apache 2.0 (Confluent uses the Confluent Community License) and supports multiple storage backends and multiple artifact types. |
| AWS Glue Schema Registry | Managed and tied to AWS. Apicurio is self-hosted and portable across clouds and on-premises. |
| Azure Schema Registry | Managed and tied to Azure. Apicurio is self-hosted and portable. |
| Buf Schema Registry (BSR) | Protobuf-focused. Apicurio handles many schema languages plus API definitions such as OpenAPI and AsyncAPI. |

# Apicurio Registry

> A runtime server that stores, versions, and validates API definitions and event schemas so producers and consumers share one source of truth.

- **Category**: Messaging & Streaming
- **CNCF maturity**: Sandbox
- **Language**: Java (source 17, runtime 21), built with Quarkus and Maven
- **License**: Apache License 2.0
- **Repository**: [Apicurio/apicurio-registry](https://github.com/Apicurio/apicurio-registry)
- **Documented at commit**: `3443acd9` (main, 2026-06-25, near tag `v3.3.0`)

## What it is

Apicurio Registry (ARG) is a server that stores artifacts and the schemas that describe them. An artifact is a versioned document such as an Avro schema, a Protobuf definition, a JSON Schema, an OpenAPI or AsyncAPI contract, a GraphQL schema, or a WSDL or XSD file. Clients push and pull these artifacts over a REST (Representational State Transfer) API and reference them at runtime.

The most common use is schema management for event streaming. A Kafka producer registers the Avro schema it writes with, the registry assigns it a global identifier, and consumers fetch that schema by identifier to deserialize messages. The registry enforces rules on every change, so an incompatible schema can be rejected before it reaches a topic. Validity, compatibility, and integrity rules can be set per artifact, per group, or globally.

It runs as a single deployable artifact whose storage backend is chosen at startup. PostgreSQL is the canonical store; Kafka, a Git repository, or Kubernetes ConfigMaps are alternatives. Apicurio also exposes a Confluent Schema Registry compatible API so existing Kafka clients can point at it without code changes.

## When to use it

- You run Kafka, NATS, or Pulsar and want a self-hosted, vendor-neutral schema registry under Apache 2.0.
- You need to store more than one kind of artifact: Avro and Protobuf next to OpenAPI and AsyncAPI definitions.
- You want compatibility checks enforced server-side before a schema change ships.
- You want a Confluent-compatible API without the Confluent Community License.
- It is a weaker fit if you only need a hosted, single-cloud schema registry and do not want to operate a server; a managed offering like AWS Glue Schema Registry may be simpler.
- It is overkill if you have one Protobuf-only service and your build already pins schemas in source control.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. Apicurio Registry README (versioning and support policy, build configuration, storage variants): <https://github.com/Apicurio/apicurio-registry>
2. README getting-started and Docker run instructions: <https://github.com/Apicurio/apicurio-registry/blob/main/README.md>
3. GitHub API repository metadata (stars, forks, contributors, created date, SPDX license): <https://api.github.com/repos/Apicurio/apicurio-registry>
4. CNCF Sandbox application issue #72 (Apicurio Registry, 2023-11): <https://github.com/cncf/sandbox/issues/72>
5. CNCF Sandbox issue #461 (ecosystem integration: Strimzi, CloudEvents, xRegistry, 2026-02): <https://github.com/cncf/sandbox/issues/461>
6. Apicurio Blog (Studio origin 2016, Registry 2019, Studio integration, 3.3.0 GitOps): <https://www.apicur.io/blog/>
7. Apicurio Registry releases (1.0.4.Final through 3.3.0): <https://github.com/Apicurio/apicurio-registry/releases>
8. ADOPTERS.md (Axual, Castor, IBM, Libon, Red Hat, ZenWave 360): <https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md>

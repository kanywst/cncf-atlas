# Microcks

> A spec-driven mock and contract-testing server: point it at an API artifact and it serves a live mock and tests real implementations against the same contract.

- **Category**: Developer Tools
- **CNCF maturity**: Incubating
- **Language**: Java (Spring Boot core; Quarkus async engine; Angular UI)
- **License**: Apache-2.0
- **Repository**: [microcks/microcks](https://github.com/microcks/microcks)
- **Documented at commit**: `24db054` (just before tag `1.15.0-rc1`, 2026-06-22)

## What it is

Microcks turns an API contract into a running mock. You import an artifact (OpenAPI, AsyncAPI, Postman collection, SoapUI project, gRPC, GraphQL, or HAR) and Microcks reads the examples inside it, then exposes them as live mock endpoints. No stub code is written by hand: the examples in the spec become the mock responses.

The same imported assets drive contract testing. Microcks can replay the recorded request/response pairs against a real implementation and report whether the implementation still matches the contract. One server covers REST, SOAP, GraphQL, gRPC, and event-driven (AsyncAPI) APIs.

It is a self-hosted service rather than a library. The core runs on Spring Boot, persists to MongoDB, and authenticates through Keycloak. A separate Quarkus async minion handles event-driven protocols by publishing AsyncAPI messages to brokers such as Kafka, MQTT, AMQP, NATS, Google Pub/Sub, Amazon SNS, and Amazon SQS.

## When to use it

- You want a mock that stays in sync with a spec instead of hand-written stubs that drift.
- You work across more than one protocol (for example REST plus Kafka events) and want one tool for all of them.
- You want the same assets to power both mocking and contract testing in CI.
- You need a shared, Kubernetes-deployable mocking service for a team, not a desktop-only tool.

It is a heavier choice when you only need a single throwaway REST stub on a laptop, where a code-driven or desktop tool may be lighter. It also expects MongoDB and Keycloak, so it is not a zero-dependency single binary.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a mock request flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. microcks/microcks GitHub repository and API metadata: [github.com/microcks/microcks](https://github.com/microcks/microcks)
2. Microcks becomes a CNCF incubating project (CNCF blog, 2026-05-07): [cncf.io](https://www.cncf.io/blog/2026/05/07/microcks-becomes-a-cncf-incubating-project/)
3. Microcks project page (CNCF): [cncf.io/projects/microcks](https://www.cncf.io/projects/microcks/)
4. Microcks Incubation Application (cncf/toc issue #1552): [github.com/cncf/toc/issues/1552](https://github.com/cncf/toc/issues/1552)
5. ADOPTERS.md (microcks/microcks): [ADOPTERS.md](https://github.com/microcks/microcks/blob/main/ADOPTERS.md)
6. Microcks 1.0.0 release (Laurent Broudoux, Medium): [medium.com/microcksio](https://medium.com/microcksio/microcks-1-0-0-release-5a5d0dbaf212)
7. API Mocking Tools Compared (ASOasis): [asoasis.tech](https://asoasis.tech/articles/2026-04-05-0252-api-mocking-tools-comparison/)
8. Testing APIs: WireMock, Prism, Mountebank, MockServer compared (Medium/Strategio): [medium.com/strategio](https://medium.com/strategio/testing-apis-comparison-of-wiremock-spotlight-prism-mountebank-mockserver-and-broadcom-devtest-5f8084a03032)
9. Getting started with Docker Compose (install/docker-compose/README.md): [README.md](https://github.com/microcks/microcks/blob/main/install/docker-compose/README.md)

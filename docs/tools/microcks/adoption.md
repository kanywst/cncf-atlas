# Adoption & Ecosystem

## Who uses it

The organisations below all carry a citable source in the project's `ADOPTERS.md` or the CNCF blog. Adopters without a public source are omitted.

| Organisation | Use case | Source |
| --- | --- | --- |
| J.B. Hunt | Cut a development effort by 7 months using Microcks mocks | [blog post](https://microcks.io/blog/jb-hunt-mock-it-till-you-make-it/) |
| Société Générale | Multi-protocol mocking and testing of cloud-native APIs | [Red Hat Summit 2019](https://www.redhat.com/files/summit/session-assets/2019/T8B6B4.pdf) |
| BNP Paribas | Mocking legacy core/mainframe APIs since 2022 | [ADOPTERS.md](https://github.com/microcks/microcks/blob/main/ADOPTERS.md) |
| Lombard Odier | Mock-as-a-service and APIOps | [APIdays Paris 2022](https://speakerdeck.com/apidays/apidays-paris-2022-adding-a-mock-as-a-service-capability-to-your-api-strategy-portfolio-ludovic-pourrat-lombard-odier) |
| Amadeus | Shift-left mocking and contract testing | [Riviera DEV 2025](https://www.slideshare.net/slideshow/how-to-secure-your-apis-without-compromising-the-developer-experience-pdf/281499574) |
| GSMA | CAMARA API / Open Gateway sandbox | [ADOPTERS.md](https://github.com/microcks/microcks/blob/main/ADOPTERS.md) |
| Deloitte | Backend mocking of 170+ REST/SOAP APIs | [ADOPTERS.md](https://github.com/microcks/microcks/blob/main/ADOPTERS.md) |

`ADOPTERS.md` lists more sourced adopters, including Nordic Semiconductor (nRFCloud.com), Bitso (gRPC contract testing), TransferGo, Michelin, GetYourGuide, Amway, and Banco PAN (external Kafka integration). Other open-source projects embed Microcks too: Traefik (in an API sandbox product), AsyncAPI Generator (CI acceptance tests), and Fluent CI (source 5).

## Adoption signals

- GitHub: 1,969 stars and 341 forks as of 2026-06-24 (source 1).
- The CNCF incubation blog (2026-05-07) reports 645 cumulative contributors, container image downloads exceeding 2.5 million in 2025 (triple the 2024 figure), 34 public adopters (up 13 in 2025), and activity on 342 of the last 365 days (source 2).
- Live contributor and activity metrics are tracked at [microcks.devstats.cncf.io](https://microcks.devstats.cncf.io/) (source 10).

## Ecosystem

The Microcks GitHub organisation ships supporting projects around the core server: a CLI (`microcks-cli`), Testcontainers modules, a Docker Desktop extension, a Kubernetes Operator, and per-language client libraries. CI/CD integration runs through the CLI with GitHub Actions, Jenkins, and Tekton. The required middleware is MongoDB for persistence and Keycloak for authentication, plus Kafka and other brokers when async protocols are used. Newer surface area includes exposing mocks as a Model Context Protocol server (`McpController`) and an OpenAI-backed AI Copilot (`AICopilotController`).

## Alternatives

Microcks is spec-driven: it generates mocks from the examples already in an API artifact and reuses the same assets for contract testing. The main alternatives differ on that axis (sources 7, 8).

| Alternative | Differs by |
| --- | --- |
| WireMock / MockServer | Config- or code-driven stubs written by hand; strong for complex stateful and negative-path scenarios, but specs are followed manually |
| Prism (Stoplight/SmartBear) | Spec-driven for OpenAPI only, CLI-only with no UI and a single process; Microcks adds a UI, server, multiple protocols, and contract testing |
| Mountebank / Mockoon / Hoverfly | Multi-protocol proxy, desktop GUI, and record-and-replay respectively; Microcks unifies REST, SOAP, GraphQL, gRPC, and AsyncAPI events on one Kubernetes-native platform with CNCF backing |

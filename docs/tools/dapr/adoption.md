# Adoption & Ecosystem

## Who uses it

The official adopter list is `ADOPTERS.md` in the `dapr/community` repo, which records organizations at production and testing stages (source 2). Named entries include Residential IoT Services GmbH (Bosch Group), Zeiss, Alibaba Cloud, Tencent, DingTalk, AutoNavi, Man Group, Microsoft Azure, FUJITSU CLOUD TECHNOLOGIES LIMITED, Schwarz IT KG, IBM Research, United Wholesale Mortgage, XiaoHongShu (RED), Hoshino Resorts, 3-shake Inc., NTT DATA, Proximus, and Nexi Group. Two adopters have published CNCF case studies with detail on how they use Dapr.

| Organisation | Use case | Source |
| --- | --- | --- |
| ZEISS | Uses the actor framework to manage the lifecycle of global order processing | [ZEISS case study area](https://www.cncf.io/projects/dapr/) (source 4) |
| Grafana | Event-driven vulnerability scanning on AWS EKS, using resiliency to avoid missed scans and a state store for idempotency checks | [Grafana case study](https://www.cncf.io/case-studies/grafana/) (source 8) |
| Various | Production and testing adopters across IoT, cloud, finance, and retail | [ADOPTERS.md](https://github.com/dapr/community/blob/master/ADOPTERS.md) (source 2) |

## Adoption signals

Measured against the `dapr/dapr` repo on 2026-06-22 via the GitHub API (source 1):

- Stars: 25,852; forks: 2,089; watchers: 399; open issues: 410.
- Contributors: roughly 335 (GitHub API contributor pagination, anonymous included).
- Latest runtime release: v1.18.1, dated 2026-06-16.

CNCF graduated the project on 2024-10-30 (source 3), and the 2025 State of Dapr Report covers adoption trends and AI-related usage (source 12).

## Ecosystem

- **Components**: the `dapr/components-contrib` repo holds the concrete state, pub/sub, and binding implementations (Redis, Kafka, AWS, Azure, GCP, and more).
- **CLI**: `dapr/cli` provides the `dapr` command used for init and run.
- **SDKs**: official SDKs for Go, Java, .NET, Python, JavaScript, Rust, C++, and PHP wrap the HTTP and gRPC APIs.
- **Managed offerings**: Diagrid offers commercial managed products (Catalyst, Conductor).
- **AI direction**: Dapr Agents and Dapr Workflow extend the project toward AI-agent workloads (source 12).

## Alternatives

Dapr sits at the application layer and exposes building blocks (state, pub/sub, actors, workflow). Service meshes sit at the network layer and move traffic transparently. The Dapr docs state the two are complementary and can run together, and that traffic routing and splitting are outside Dapr's scope (source 9).

| Alternative | Differs by |
| --- | --- |
| Istio / Linkerd / Cilium (service mesh) | Infrastructure-layer and transparent, network-centric; handle L7 routing and traffic splitting, which Dapr does not (source 9). Complementary to Dapr |
| Spring Cloud | In-app framework bound mostly to Java; Dapr is callable from any language over HTTP/gRPC and also ships Spring Boot integration |
| Apache Dubbo | RPC framework tied to its own ecosystem; Dapr abstracts state, messaging, and invocation behind language-neutral APIs |

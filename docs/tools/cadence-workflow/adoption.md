# Adoption & Ecosystem

## Who uses it

The organizations below are listed in the project's own `ADOPTERS.md` as production users. Each entry reflects what that file states.

| Organisation | Use case | Source |
| --- | --- | --- |
| Uber Technologies | 2000+ Cadence domains (use cases) across 20+ environments, some hosting 400+ domains: infrastructure rollout, ML training, payments, onboarding | [ADOPTERS.md](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md) |
| NetApp (Instaclustr) | Orchestrates maintenance of fleets of tens of thousands of nodes, and offers managed Cadence | [ADOPTERS.md](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md) |
| DoorDash | ETA, fulfillment, order management, catalog, and ads | [ADOPTERS.md](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md) |
| Cloudera | Core of the control plane: provisioning and backup-restore, including Cloudera Data Warehouse | [ADOPTERS.md](https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md) |

Third-party coverage independently names Uber, DoorDash, and Coinbase as users ([Instaclustr blog](https://www.instaclustr.com/blog/cadence-workflow-uber-cncf-projects/)). HashiCorp was an early external adopter in the project's history ([ia40 interview](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev)).

## Adoption signals

Observed from the GitHub API on 2026-06-27 for [cadence-workflow/cadence](https://github.com/cadence-workflow/cadence):

- Stars: 9,358
- Forks: 898
- Watchers: 1,418
- Contributors: about 178
- Open issues: 192

The project was accepted into the CNCF Sandbox on 2025-05-22 ([CNCF](https://www.cncf.io/projects/cadence-workflow/)). The latest stable release is `v1.4.0` (2026-02-27). Governance is a Technical Steering Committee of four plus a maintainer group (`MAINTAINERS.md`), with the CNCF as neutral host.

## Ecosystem

- Official SDKs: [Go](https://github.com/cadence-workflow/cadence-go-client) and [Java](https://github.com/cadence-workflow/cadence-java-client). Community Python and Ruby SDKs also exist (`README.md:40`).
- Web UI: [cadence-web](https://github.com/cadence-workflow/cadence-web), served on `localhost:8088`.
- DSL layer: [iWF](https://github.com/indeedeng/iwf) runs as a framework on top of Cadence (`README.md:42`).
- Deployment: the [cadence-charts](https://github.com/cadence-workflow/cadence-charts) Helm chart, with a guided Kubernetes install path (`README.md:32-34`).
- Storage and infrastructure: Cassandra, MySQL, PostgreSQL, or SQLite for core state; Elasticsearch, OpenSearch, or Pinot for visibility; Kafka for async workflows. The pluggable backends are loaded in the server entry point (`cmd/server/main.go:30-36`).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Temporal | The 2019 fork of Cadence by its original creators, under the MIT license; same durable-execution model, but moved from Thrift to protobuf and from a custom RPC to gRPC ([ia40](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev), [FAQ](https://cadenceworkflow.io/faq/cadence-vs-temporal)). |
| Netflix Conductor / Conductor OSS | Defines workflows in a JSON DSL rather than native-language code. |
| Apache Airflow / Argo Workflows | DAG-based batch and data-pipeline schedulers; Cadence is general durable execution with arbitrary control flow and long waits. |
| AWS Step Functions / Azure Durable Functions | Managed services in the same family; they are the conceptual roots of Cadence rather than self-hosted engines. |

Pick Cadence when you want self-hosted durable execution with workflows written as native Go or Java code and you can operate the database it needs. Pick a managed Step Functions or Durable Functions when you want no infrastructure to run. Pick Airflow or Argo Workflows when the work is a scheduled data DAG rather than long-running stateful logic.

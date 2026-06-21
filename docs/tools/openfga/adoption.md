# Adoption & Ecosystem

## Who uses it

The CNCF incubation announcement states that 37 organizations have publicly stated production use, and names several of them along with what they contributed (3).

| Organisation | Use case | Source |
| --- | --- | --- |
| Okta | Originated the engine; basis for Auth0/Okta FGA | [CNCF blog](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/) (3) |
| Auth0 | Commercial managed FGA built on OpenFGA | [CNCF blog](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/) (3) |
| Grafana Labs | Contributed the SQLite storage adapter; provides maintainers | [CNCF blog](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/) (3) |
| GitPod | An engineer became an official maintainer | [CNCF blog](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/) (3) |
| TwinTag | Contributed the MySQL storage adapter | [CNCF blog](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/) (3) |

An individual contributor, Maurice Ackel, contributed the Terraform Provider (3). Secondary write-ups also list Docker and Canonical as users, but the primary CNCF text does not name them, so they are noted here as unconfirmed secondary sourcing only (3)(7).

## Adoption signals

- CNCF maturity moved from Sandbox (accepted 2022-09-14) to Incubating (TOC vote 2025-10-28, announced 2025-11-11) (3)(4)(5).
- 37 organizations publicly stating production use at the time of incubation (3).
- Active release cadence: this deep-dive is pinned at `v1.18.0` (2026-06-17) plus one documentation commit (1).
- Maintainership spans multiple companies (Okta, Grafana, GitPod), a signal the CNCF weighs for incubation (3).

## Ecosystem

- **SDKs** in five languages: Go, .NET, JavaScript, Java, and Python (3)(1).
- **Editor tooling**: VS Code and IntelliJ extensions for the model DSL (3).
- **CLI** (`fga`) for managing stores and running model tests (3)(1).
- **Deployment**: Helm charts (Artifact Hub) and a Terraform Provider (3).
- **Observability**: OpenTelemetry tracing, Prometheus metrics, Grafana integration (1).
- **Interoperability**: an OpenID AuthZEN-compatible endpoint ([`pkg/server/authzen.go`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/server/authzen.go)).
- **Managed offering**: Auth0/Okta FGA is built on the same engine (2)(3).

## Alternatives

All three direct alternatives below are Zanzibar-style ReBAC systems (7). OpenFGA differentiates on developer experience (the model DSL, Playground, CLI, five SDKs), a stateless horizontally-scalable design, and dual self-host/managed delivery with CNCF backing. Its default consistency is relaxed, with strong consistency opt-in via `HIGHER_CONSISTENCY` (7).

| Alternative | Differs by |
| --- | --- |
| SpiceDB (AuthZed) | Most complete Zanzibar consistency model (zookie / at-least-as-fresh), more storage backends including CockroachDB and Spanner, a Watch API; thinner on admin UI and audit (7) |
| Ory Keto | Go implementation integrated into the Ory ecosystem; simpler, with coarser consistency control (7) |
| OPA / Rego | Policy-as-code for ABAC; evaluates rules over request context rather than traversing a relationship graph (7) |
| Cedar (AWS) | A dedicated policy language rather than a relationship-tuple store (7) |

# History

## Origin

OpenFGA grew out of Auth0's internal authorization system. Auth0 (later acquired by Okta) ran it in production as Auth0 FGA from December 2021, then open-sourced the engine and announced it publicly in June 2022 (2).

The motivation was concrete. Companies like Airbnb and Carta had each rebuilt their own Zanzibar-style authorization system from scratch, because there was no shared open implementation to start from. OpenFGA set out to be that one reusable implementation. It took the ideas from Google's Zanzibar paper (relationship-based access control, scaling to trillions of access-control entries, p95 latency under 10ms) and made them expressible through a model DSL that can also cover RBAC and ABAC use cases (2).

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | Auth0 FGA runs in production internally (December) (2) |
| 2022 | Engine open-sourced and announced as OpenFGA (June); accepted into the CNCF Sandbox (September 14) (2)(3) |
| 2025 | TOC votes to promote OpenFGA to Incubating (October 28); public announcement (November 11) (3)(5) |

## How it evolved

After open-sourcing, the project broadened beyond a single datastore and a single team. Community contributions added storage backends: Grafana Labs contributed the SQLite adapter and TwinTag contributed the MySQL adapter, alongside the existing PostgreSQL and in-memory engines (3). Maintainership widened past the original Okta engineers to include contributors from Grafana and GitPod, while Auth0/Okta FGA continued to be built on the same OpenFGA engine (2)(3).

The engine itself kept changing internally. The codebase at this commit carries an experimental second-generation Check path gated behind the `ExperimentalWeightedGraphCheck` feature flag, which evaluates the model as a weighted graph and falls back to the original path when a model cannot be represented that way ([`pkg/server/check.go:69-152`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/server/check.go#L69-L152)). The query planner that selects resolution strategies online ([`internal/planner/`](https://github.com/openfga/openfga/tree/9a556d8a134db308a7690f328dade79104922c8a/internal/planner)) is another sign that performance tuning is an ongoing area of work rather than a settled design.

## Where it stands now

OpenFGA is a CNCF Incubating project as of late 2025 (3)(4). Releases are tagged frequently; this deep-dive is pinned one commit after `v1.18.0` (2026-06-17), and that commit is a changelog documentation fix ([commit `9a556d8`](https://github.com/openfga/openfga/commit/9a556d8a134db308a7690f328dade79104922c8a)). The CNCF blog reports 37 organizations publicly stating production use at the time of incubation (3). Governance is shared across maintainers from multiple companies, and the commercial Auth0/Okta FGA product continues to track the open-source engine.

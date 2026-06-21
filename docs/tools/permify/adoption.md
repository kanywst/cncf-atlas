# Adoption & Ecosystem

## Who uses it

The repository does not ship an ADOPTERS file, and no verifiable first-party list of named production users could be confirmed. Acquisition and vendor articles mention companies such as P&G, Mastercard, HPE, and Sennder as customers, but these are second-hand sources with no corroboration inside the repository (Source 1), so they are not asserted here as confirmed adopters. The most reliable public signal is the GitHub repository activity below.

## Adoption signals

Measured on 2026-06-22 via the GitHub API (Source 7):

| Signal | Value |
| --- | --- |
| Stars | ~5,900 |
| Forks | ~320 |
| Contributors | ~78 (including anonymous) |
| Repository created | 2022-07-14 |
| Latest tags | `v1.7.0`, `v1.7.1` (June 2026) |

Vendor and acquisition material claims larger figures (1.2M+ downloads, ~4.3 billion checks per day, 40+ production deployments), but these are second-hand and not independently verified (Sources 1, 3).

## Ecosystem

- APIs over gRPC (port 3478) and REST (port 3476) (`README.md:104-110`).
- A schema Playground (`playground/`) for authoring and testing schemas.
- Language SDKs under `sdk/` and protobuf definitions under `proto/base/v1/`.
- Caching via ristretto and, for distributed setups, a consistent-hash gRPC balancer plus the Kubernetes resolver registered at startup (`cmd/permify/permify.go:16-17`).
- A product-side "Sync Service" (Debezium/Kafka) for real-time data sync, separate from the core engine.
- Following the 2025 acquisition, Permify is positioned alongside FusionAuth as the authorization half of a self-hostable AuthN + AuthZ platform (Sources 3, 4).

## Alternatives

All three below trace back to Zanzibar. The honest split is licensing, datastore breadth, and how much per-request consistency tuning you get.

| Alternative | Differs by |
| --- | --- |
| SpiceDB (AuthZed) | Apache-2.0; the most Zanzibar-faithful, with ZedToken per-request consistency and support for PostgreSQL, MySQL, CockroachDB, and Spanner (Sources 5, 6) |
| OpenFGA (Auth0/Okta) | Apache-2.0; a CNCF Sandbox project, widely adopted, with a similar modeling language (Sources 5, 6) |
| Permify | AGPL-3.0; PostgreSQL-centric (plus in-memory), multi-tenant by design, with native ABAC via attributes and CEL rules and a DSL/Playground developer experience (Sources 5, 6) |

Pick Permify when you want RBAC, ReBAC, and ABAC in one schema, are standardized on PostgreSQL, and the AGPL-3.0 license is acceptable. Pick SpiceDB when you need broad datastore choice or finer per-request consistency control. Pick OpenFGA when you want a permissively licensed, CNCF-governed option.

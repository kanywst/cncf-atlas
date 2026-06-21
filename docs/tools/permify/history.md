# History

## Origin

Permify started in 2022 as an open-source attempt to reproduce Google's Zanzibar, the internal authorization system Google described in a paper but never released. The goal was to give teams a single engine that can express RBAC, ReBAC, and ABAC in one DSL. The repository was created on 2022-07-14, and the project was first shown publicly in July 2022 on Hacker News as "Show HN: Permify". The original pitch leaned on syncing authorization data into relation tuples via database change-data-capture (Source 1).

## Timeline

| Year | Milestone |
| --- | --- |
| 2022 | Repository created (2022-07-14); first public launch on Hacker News (Source 1) |
| 2024 | Permify 1.0 announced on Hacker News (Source 2) |
| 2025 | Acquired by FusionAuth on 2025-11-20; open-source core continues on GitHub (Sources 3, 4) |
| 2026 | Active development on `main`; latest tags `v1.7.0` and `v1.7.1` (June 2026) |

## How it evolved

The early framing was CDC-driven: keep authorization data in sync by capturing database changes and projecting them into relation tuples (Source 1). The product later separated that real-time sync concern into a "Sync Service" that uses Debezium/Kafka, while the core engine settled on resolving checks directly against relation tuples in PostgreSQL with snapshot-based consistency. Permify 1.0 in 2024 marked the move from early service to a stable fine-grained authorization product (Source 2).

The most concrete consistency decision visible in the code is the use of PostgreSQL transaction snapshots (XID8) as the SnapToken, Permify's analogue of Zanzibar's zookie (`internal/storage/postgres/snapshot/token.go`). That ties the project's consistency story to PostgreSQL's native MVCC visibility rather than a dedicated consistency store.

## Where it stands now

On 2025-11-20 FusionAuth acquired Permify to combine authentication (FusionAuth) and authorization (Permify) into one self-hostable platform; the acquisition amount was not disclosed (Sources 3, 4). The companies stated the open-source core continues on GitHub, with two Permify team members joining as contractors, and the GitHub repository description now reads that Permify is part of FusionAuth (Source 7). Development continues on `main` in Go, distributed as the `ghcr.io/permify/permify` container, with recent tags `v1.7.0` and `v1.7.1` from June 2026.

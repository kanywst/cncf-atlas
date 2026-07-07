# History

## Origin

CloudNativePG was conceived by PostgreSQL experts and Kubernetes administrators at 2ndQuadrant, a PostgreSQL consultancy later acquired by EDB (EnterpriseDB). The governance document records that the project was "originally conceived by PostgreSQL experts and Kubernetes administrators within 2ndQuadrant."

It first existed as a proprietary EDB product, "Cloud Native PostgreSQL." On 2022-04-21 EDB renamed it to CloudNativePG, open-sourced it under the Apache License 2.0, and published it with more than 1,400 commits of prior history, releasing v1.15.0 at the same time. EDB's launch blog explains the motivation: bring a Kubernetes-native, level-triggered operator to the PostgreSQL community without depending on an external high-availability tool.

## Timeline

| Year | Milestone |
| --- | --- |
| 2022 | EDB open-sources the operator as CloudNativePG and releases v1.15.0 (2022-04-21), then donates the intellectual property to a vendor-neutral community under Apache-2.0. |
| 2024 | CNCF Sandbox application filed as cncf/sandbox issue #128 (2024-09-24), assigned to the January 2025 review milestone. |
| 2025 | Accepted into the CNCF Sandbox (January 2025 review, gitvote passed). |
| 2026 | Stable line at v1.29.1 (2026-05-08); `main` carries manifests for the v1.30.0-rc1 release candidate. |

## How it evolved

The most significant governance shift was the 2022 donation. EDB moved the code, trademark, and decision-making to an open community with its own GOVERNANCE document, so the project stopped being a single vendor's asset. The community then pursued CNCF membership, which it reached as a Sandbox project in January 2025.

A notable technical shift is the move toward a plugin architecture. Backup and WAL (Write-Ahead Log) handling, originally built into the operator using barman-cloud, is migrating to CNPG-i (the CloudNativePG Plugin Interface), a gRPC-based sidecar plugin mechanism. The barman-cloud functionality now lives behind a plugin (the `cloudnative-pg/barman-cloud` dependency) rather than in the core binary.

## Where it stands now

The project ships a stable minor line (v1.29.x as of mid-2026) and prepares the next minor (v1.30.0) through release candidates carried in the repository's `releases/` directory. Maintainers have publicly stated that the next governance goal is CNCF Incubation; one of the founders, Gabriele Bartolini, described this path in a KubeCon NA 2025 recap. Development is community-governed, with EDB and other organizations among the contributors.

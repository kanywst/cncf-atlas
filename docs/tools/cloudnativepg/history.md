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
| 2026 | v1.30.0 released (2026-06-29), adding a `DatabaseRole` CRD that manages a PostgreSQL role as its own Kubernetes object and a Kubernetes `Lease` that gates primary promotion ([release notes](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/docs/src/release_notes/v1.30.md)). Patch releases v1.30.1 and v1.29.3 followed on 2026-09-23. |
| 2026 | Moved to CNCF Incubating (TOC vote closed 2026-11-02, [cncf/toc#1961](https://github.com/cncf/toc/issues/1961); level change [cncf/toc#2355](https://github.com/cncf/toc/issues/2355)). |

## How it evolved

The most significant governance shift was the 2022 donation. EDB moved the code, trademark, and decision-making to an open community with its own GOVERNANCE document, so the project stopped being a single vendor's asset. The community then pursued CNCF membership, which it reached as a Sandbox project in January 2025.

A notable technical shift is the move toward a plugin architecture. Backup and WAL (Write-Ahead Log) handling, originally built into the operator using barman-cloud, is migrating to CNPG-i (the CloudNativePG Plugin Interface), a gRPC-based sidecar plugin mechanism. The barman-cloud functionality is available as a plugin (the `cloudnative-pg/barman-cloud` dependency), and the v1.30.0 release notes schedule the native in-tree Barman Cloud support for removal in 1.31.0 ([release notes](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/docs/src/release_notes/v1.30.md)).

## Where it stands now

The project maintains more than one stable minor line at a time: v1.30.1 and v1.29.3 were both released on 2026-09-23 and are the latest releases as of November 2026 ([releases](https://github.com/cloudnative-pg/cloudnative-pg/releases)). Release candidates for the next minor are carried in the repository's `releases/` directory before each `.0`. Maintainers named CNCF Incubation as the next governance goal (one of the founders, Gabriele Bartolini, described the path in a KubeCon NA 2025 recap), and the TOC vote on the Incubation application closed on 2026-11-02, moving the project to Incubating ([cncf/toc#1961](https://github.com/cncf/toc/issues/1961)). Development is community-governed, with EDB and other organizations among the contributors.

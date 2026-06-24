# History

## Origin

CloudEvents grew out of the CNCF Serverless Working Group, which the CNCF Technical Oversight Committee formed in early 2017. The group's problem was vendor lock-in in Function-as-a-Service platforms: each provider shipped functions with its own event payload shape, so a function written for one cloud could not consume events from another without rewriting the glue. The group proposed a common event format to ease that, and concrete spec work began in December 2017 under the Serverless WG (sources 4, 6).

The project entered the CNCF Sandbox on 2018-05-15 and was announced at CloudNativeCon EU 2018, with Google, Microsoft, IBM, Red Hat, Oracle, and Huawei among the early participants (source 4). Microsoft shipped the first implementation of the v0.1 draft in Azure Event Grid around April 2018 (source 9).

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | CNCF Serverless WG forms; spec work begins in December (sources 4, 6) |
| 2018 | Accepted into the CNCF Sandbox on 2018-05-15; first v0.1 implementation in Azure Event Grid (sources 4, 9) |
| 2019 | v0.3 simplifies the attribute model in June; v1.0 ships 2019-10-28 alongside promotion to Incubation (sources 4, 6) |
| 2020 | v1.0.1 adds the WebSocket binding (2020-12-10) (source 2) |
| 2022 | v1.0.2 reorganizes the specs repository (2022-02-05); Trail of Bits runs a security assessment (source 2) |
| 2024 | Promoted to CNCF Graduated on 2024-01-25; CloudEvents SQL (CESQL) reaches V1 on 2024-06-13 (sources 2, 3) |

## How it evolved

The spec moved from an experimental attribute model toward a stable one. v0.3 dropped a nested attribute map and simplified batching and error handling (source 6). v1.0 froze the core context attributes and the protocol bindings (HTTP and others), which is the contract implementations still target today (source 4). Later 1.0.x releases added transport bindings such as WebSocket without changing the core (source 2).

Scope grew beyond the envelope. CloudEvents SQL (CESQL) added a SQL-like expression language for filtering and querying events, reaching V1 in June 2024 (source 2). The Go SDK mirrors this: the core lives under `v2/` and CESQL has its own top-level `sql/` tree.

Governance matured in step with the spec. Incubation came with v1.0 in 2019, and Graduation followed in January 2024 after the spec had stabilized, multiple SDKs had shipped, and an external security review had been completed (sources 2, 3).

## Where it stands now

CloudEvents is a CNCF Graduated project. The specification repository is the source of truth, and the project maintains SDKs in Go, JavaScript/TypeScript, Java, C#, Python, Ruby, PHP, PowerShell, and Rust (sources 1, 5). The Go SDK is the most adopted of these. Its latest release tag is `v2.16.2` (2025-09-22), and this deep-dive reads `main` at commit `1e99396` (2026-06-19), which is ahead of that tag (source 1). The CNCF Graduation announcement reports the spec drew 340+ contributors from 122 organizations (source 3).

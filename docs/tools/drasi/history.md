# History

## Origin

Drasi was built inside Microsoft's Azure Incubations team and released as open source on 2024-10-09, announced on the Azure blog by Mark Russinovich, Azure's CTO. It launched under Apache-2.0 with a CNCF Sandbox application already in progress, and it shipped with prebuilt Sources and Reactions for PostgreSQL, Microsoft Dataverse, and Azure Event Grid (Azure blog). The GitHub repository was created earlier, on 2024-05-27 (GitHub API `created_at`), during the run-up to that public release.

The motivating problem the team described is change detection and reaction across systems that do not share a database. The common workaround is to copy data into a central store and poll it, or to write bespoke integration code for each connection. Drasi's premise is to evaluate the condition where the data already lives, as a graph query that can span sources, and to act only on the parts of the result a change actually moves (Azure blog).

The continuous query engine did not start with the Drasi name. Its earlier codename was "Reactive Graph," and traces of that name survive in the vendored engine's tests: a use-case query still declares `apiVersion: query.reactive-graph.io/v1` (`query-container/query-host/drasi-core/shared-tests/src/use_cases/rolling_average_decrease_by_ten/queries.rs:18`).

## Timeline

| Year | Milestone |
| --- | --- |
| 2024 | Repository created (2024-05-27); Drasi open-sourced under Apache-2.0 and announced on the Azure blog (2024-10-09) |
| 2025 | Accepted into the CNCF Sandbox (2025-01-21); Microsoft's open source blog re-announced the acceptance (2025-06-10) |
| 2026 | Active `0.10.x` line; documented here at `62b10c7`, 18 commits past tag `0.10.0` |

## How it evolved

The clearest shift after launch was governance. Drasi entered the CNCF Sandbox on 2025-01-21, one of thirteen projects accepted that month (CNCF project page; cncf/sandbox #296; Palark's January 2025 roundup). Microsoft revisited the milestone with its own open source blog post on 2025-06-10, framing Drasi as a CNCF project for change-driven solutions (Microsoft Open Source blog). The move placed Drasi alongside the team's other CNCF work: the Azure blog introduced it in the same lineage as Dapr, KEDA, Radius, and Copacetic (Azure blog).

The technical shape has stayed consistent with the launch description: Sources feed changes in, Continuous Queries evaluate them in Cypher, and Reactions act on the result set. The engine itself lives in a separate repository, `project-drasi/drasi-core`, and is vendored into the platform as a submodule under `query-container/query-host/drasi-core` (`.gitmodules`), so the query semantics evolve on their own track while the platform packages them for Kubernetes.

## Where it stands now

Drasi is an active CNCF Sandbox project. At the documented commit the platform is 18 commits past tag `0.10.0`, and the project's README describes this as an early release meant for the community to learn the platform and try it in proofs of concept, inviting bug reports and feature requests. Development is coordinated in the open through the `drasi-project` GitHub organization and a public Discord, with contribution, security, and code-of-conduct guides kept in the shared `drasi-project/.github` repository (README). The engine and the platform remain split across two repositories, pinned together by the submodule, so the platform documented here tracks a specific engine commit (`a0273f22`).

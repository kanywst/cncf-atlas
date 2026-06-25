# History

## Origin

Chaos Mesh started inside PingCAP as an internal chaos engineering platform used to test the resilience of TiDB, PingCAP's distributed SQL database. The problem the team described was that deterministic, pre-scripted failure tests no longer matched the failure modes of distributed systems running on Kubernetes. PingCAP open-sourced the project on 2019-12-31 and reported roughly 2,000 stars and 44 contributors within seven months (Announcing Chaos Mesh as a CNCF Sandbox Project, PingCAP).

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Open-sourced on 2019-12-31 by PingCAP. |
| 2020 | Proposed to the CNCF on 2020-02-21 (cncf/tag-app-delivery issue #23) and accepted as a Sandbox project on 2020-07-14. |
| 2021 | Chaos Mesh 2.0 GA (September), adding Workflow and Schedule and reframing the project as a chaos engineering ecology. |
| 2022 | Promoted to CNCF Incubating on 2022-02-16 by TOC vote. |
| 2026 | Latest release v2.8.3 on 2026-06-10. |

## How it evolved

The 1.x line focused on the fault primitives: pod, network, IO, stress, time, kernel, and DNS chaos expressed as CRDs. The 2.0 GA in September 2021 widened the scope from single faults to orchestration, adding Workflow (chaining experiments) and Schedule (cron-style repetition), which the CNCF described as the move toward a chaos engineering ecology (Chaos Mesh 2.0 GA, CNCF).

The CNCF blog announcing Incubating status noted that since entering the Sandbox the project had shipped v1.0 and v2.0 plus 30 minor releases, and was the second CNCF project to originate from PingCAP after TiKV (Chaos Mesh moves to the CNCF Incubator).

## Where it stands now

The project continues to release on the 2.x line, with v2.8.3 dated 2026-06-10. Development happens on `main`; the commit documented here, `8c13a9f`, sits after v2.8.3 on the development branch. Governance is meritocratic and consensus-based, with maintainers listed in the repository's MAINTAINERS file.

## Sources

1. Announcing Chaos Mesh as a CNCF Sandbox Project (PingCAP): <https://www.pingcap.com/press-release/announcing-chaos-mesh-as-a-cncf-sandbox-project/>
2. cncf/tag-app-delivery issue #23 (sandbox proposal): <https://github.com/cncf/tag-app-delivery/issues/23>
3. Chaos Mesh 2.0 GA to a Chaos Engineering Ecology (CNCF): <https://www.cncf.io/blog/2021/09/01/chaos-mesh-2-0-ga-to-a-chaos-engineering-ecology/>
4. Chaos Mesh moves to the CNCF Incubator: <https://www.cncf.io/blog/2022/02/16/chaos-mesh-moves-to-the-cncf-incubator/>
5. GitHub Releases, latest v2.8.3: <https://github.com/chaos-mesh/chaos-mesh/releases>

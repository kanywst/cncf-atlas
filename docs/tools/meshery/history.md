# History

## Origin

Meshery was created in 2019 by Lee Calcote and the team at Layer5, a community focused on service meshes ([CNCF blog](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/)). The GitHub repository dates from 2018-11-14 and the first tagged release, `v0.0.1`, from 2019-07-03 ([GitHub API](https://api.github.com/repos/meshery/meshery), [releases](https://github.com/meshery/meshery/releases)).

The problem at the start was choosing and running a service mesh. Istio, Linkerd, Consul and others each had their own install and configuration story. Layer5 described Meshery as a "service mesh management plane" and said the aim was to make it simpler for IT teams to decide which mesh to use. When Meshery joined the CNCF, Layer5 also donated Service Mesh Performance (SMP), a specification for benchmarking meshes ([Layer5 news, 2021-10-14](https://layer5.io/company/news/cncf-adopts-meshery-to-advance-service-mesh-management/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | First release `v0.0.1` (2019-07-03) |
| 2020 | Listed in the CNCF Landscape (2020-06-01, [Layer5 blog](https://layer5.io/blog/announcements/meshery-lands-in-the-cncf-landscape)) |
| 2021 | `v0.5.0` (2021-03-24); accepted into the CNCF Sandbox on 2021-06-22, announced in October at ServiceMeshCon |
| 2022 | `v0.6.0` (2022-08-24) |
| 2023 | `v0.7.0` (2023-12-08) |
| 2024 | Incubation application filed on 2024-03-01 ([cncf/toc#1264](https://github.com/cncf/toc/issues/1264)), refiled as [cncf/toc#1386](https://github.com/cncf/toc/issues/1386) on 2024-07-31; `v0.8.0` (2024-12-20) |
| 2026 | v1.0 announced at KubeCon EU on 2026-03-23 ([Meshery blog](https://meshery.io/blog/meshery-v1.0-general-availability/)); GitHub release `v1.0.0` published 2026-03-24 |
| 2026 | TOC vote for Incubating passed on 2026-09-14; CNCF announced it on 2026-10-07 |

Release dates are from the [GitHub releases page](https://github.com/meshery/meshery/releases). Sandbox and Incubating dates match the [CNCF project page](https://www.cncf.io/projects/meshery/) and the Meshery entry in [`landscape.yml`](https://github.com/cncf/landscape/blob/master/landscape.yml).

## How it evolved

The scope widened from meshes to infrastructure in general. Technology-specific **adapters** (separate gRPC services such as meshery-istio, one port per mesh) handle operations for a single technology ([Architecture docs](https://docs.meshery.io/concepts/architecture)). Most resource types, though, are described as data: a **model** is a directory of JSON files that defines a technology's components and the relationships between them. At the documented commit the repository ships 479 model directories under `models/`, many of them generated from Helm charts on Artifact Hub (see [Internals](./internals)). The README now introduces Meshery as a "self-service engineering platform" and "cloud native manager" for Kubernetes-based infrastructure ([README](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/README.md)).

v1.0 came with a change in how the project is organised. The code moved into two GitHub organisations: `meshery` for the core platform (server, UI, CLI, Operator, MeshSync) and `meshery-extensions` for the 300+ integrations, adapters and tools. The same release launched the Certified Meshery Contributor programme ([Meshery blog](https://meshery.io/blog/meshery-v1.0-general-availability/)). `GOVERNANCE.md` describes roles across both organisations ([GOVERNANCE.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/GOVERNANCE.md)).

Inside the server, the engine that evaluates relationships in a design was written as Open Policy Agent (Rego) policies. In April 2026 it was ported to native Go ([commit `31b22b91`](https://github.com/meshery/meshery/commit/31b22b91c95a72df2fc456a8a45694ddcafc08d2)). Both engines still exist, selected by an environment variable; [Internals](./internals) traces both.

The road to Incubating took about two and a half years. In January 2025 a TOC reviewer noted open items on the application, among them that adopters had not yet been submitted for interview and that the roadmap was not public ([cncf/toc#1386](https://github.com/cncf/toc/issues/1386)). The vote closed on 2026-09-14 with 8 binding votes in favour, none against, and one abstention.

## Where it stands now

Meshery is a CNCF Incubating project. There is no fixed release cadence: a draft release is kept current on every push to `master` and published by hand, which is why the `v1.0.x` line had reached `v1.0.79` by 2026-11-13 ([AGENTS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/AGENTS.md), [releases](https://github.com/meshery/meshery/releases)). The core maintainers listed in `MAINTAINERS.md` include Lee Calcote (Layer5) and maintainers from other organisations ([MAINTAINERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/MAINTAINERS.md)).

The CNCF announcement lists the stated direction: multi-cluster and fleet management with finer Kubernetes RBAC, a Meshery MCP server with read-only access to the registry and cluster state, distributed performance testing, and a more governed registry with a workflow engine for policy-driven configuration ([CNCF blog](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/)).

# History

## Origin

Headlamp was created by Kinvolk GmbH, the Berlin company also known for Flatcar Container Linux and Inspektor Gadget. The GitHub repository was created on 2019-11-08, the first public commits landed around mid-2020, and the `v0.1.0` tag is dated 2020-10-16 (GitHub API). The motivation was a gap Kinvolk saw in the existing tools: an open-source Kubernetes UI that was modern and highly customizable, going past the read-and-view scope of tools like the Kubernetes Dashboard to cover write operations, RBAC-aware views, and plugin extension (Headlamp blog, 2023-10-12).

The frontend's API layer did not start from scratch. A copyright header in the source records its lineage: the module "was originally taken from the K8dash project before modifications," under Apache-2.0, "Copyright © 2020 Eric Herbrandson" and "Copyright © 2020 Kinvolk GmbH" (`frontend/src/lib/k8s/apiProxy/index.ts:17-24`). Headlamp took K8dash's client-side API access as a starting point and built its own backend, plugin system, and resource model on top.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | GitHub repository created (2019-11-08) |
| 2020 | Kinvolk publishes Headlamp as open source; `v0.1.0` tagged (2020-10-16), frontend API layer derived from K8dash |
| 2021 | Microsoft acquires Kinvolk (2021-04-29); Headlamp stays Apache-2.0 and continues as open source |
| 2023 | Accepted into the CNCF Sandbox (2023-05-17); public announcement (2023-10-12) |
| 2025 | Becomes a Kubernetes SIG UI subproject; repository moves from `headlamp-k8s/headlamp` to `kubernetes-sigs/headlamp` |
| 2026 | Active `v0.43.x` release line; documented here at `dab1a6c5` (tag `v0.43.0`) |

## How it evolved

Two shifts changed who owns Headlamp without changing its license. The first was corporate: on 2021-04-29 Microsoft acquired Kinvolk to accelerate its container work, announced by Brendan Burns on the Azure blog. Headlamp stayed Apache-2.0 and open source, and Microsoft became its principal sponsor. That relationship shows in the codebase's downstream: Azure's AKS desktop experience is built on Headlamp (ADOPTERS.md).

The second shift was governance. Microsoft donated Headlamp to the CNCF, and it was accepted at the Sandbox level on 2023-05-17 (CNCF project page; cncf/sandbox #25), with the public announcement following on 2023-10-12 (Headlamp blog). Then in 2025, presented in a Microsoft keynote at KubeCon + CloudNativeCon Europe 2025 in London, Headlamp became a Kubernetes SIG UI subproject, which is part of the Kubernetes project itself. The repository moved from `headlamp-k8s/headlamp` to `kubernetes-sigs/headlamp`, a move the README's NOTICE documents (README; Cloud Native Now). The container images stay under `ghcr.io/headlamp-k8s` for now.

That leaves Headlamp with a dual status worth stating plainly: on the CNCF landscape it is still a Sandbox project, and inside Kubernetes it is a SIG UI subproject. The two do not conflict, but neither one alone describes where the project lives.

## Where it stands now

Headlamp is under active development on a steady release cadence, with the `v0.43.x` line current as of the documented commit. `v0.43.0` was published on 2026-06-16 and this deep-dive pins the tree one commit later at `dab1a6c5` (2026-07-06). The project carries an OpenSSF Best Practices badge and an OpenSSF Scorecard (README). Its stated direction is to be the graphical UI for Kubernetes as a SIG UI subproject while remaining a CNCF Sandbox project, extended through plugins rather than forks.

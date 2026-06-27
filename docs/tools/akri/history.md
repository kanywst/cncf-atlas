# History

## Origin

Akri started at Microsoft DeisLabs. The team wanted to bring devices that are too small to become Kubernetes nodes (a camera, a USB sensor, an OPC UA server) into a cluster, and to handle the edge specific concerns the stock device plugin framework ignores: discovering devices over a network, coping with intermittent connectivity, and sharing one device across several nodes. The first public discussion and repository appeared in December 2020 under `github.com/deislabs/akri`, and the project initially used the MIT license, following its sister project Krustlet (source 4).

## Timeline

| Year | Milestone |
| --- | --- |
| 2020 | First public release and repository at deislabs/akri, MIT licensed (source 4) |
| 2021 | Accepted into the CNCF Sandbox on 2021-09-14; relicensed to Apache-2.0 and adopted open governance (sources 2, 3) |
| 2021 | Repository moved to the neutral project-akri organization; v0.7.0 marked the move (source 4) |
| 2024 | v0.13.8 tagged 2024-11-10, released 2024-11-20 (still a pre-1.0 release) (source 1) |

## How it evolved

Two shifts stand out. First, governance and licensing changed at CNCF onboarding. The project moved from MIT to Apache-2.0, added a `GOVERNANCE.md` that defines Contributor, Maintainer, and Admin roles, and moved its chat to the `#akri` channel on the Kubernetes Slack (sources 2, 3). The repository was then relocated from the Microsoft owned `deislabs` org to the vendor neutral `project-akri` org; v0.7.0 bumped the minor version purely to mark that move, with no breaking changes (source 4).

Second, the runtime architecture was split. Earlier versions embedded the Discovery Handlers inside the Agent image. The project separated them so handlers run as their own DaemonSets and register with the Agent over gRPC, which let third parties add protocols without rebuilding the Agent (source 6). The device injection path was later rewritten around the Container Device Interface (CDI) v0.6.0 schema instead of writing the device plugin Allocate response directly.

## Where it stands now

Akri remains a CNCF Sandbox project; every published release is still a pre-1.0 pre-release. At the documented commit the workspace version is `0.13.26`, the next in development version after the v0.13.8 tag. The code targets Kubernetes v1.33 and newer on Linux amd64, arm64v8, and arm32v7, and is built as a Rust (edition 2024) Cargo workspace with a Helm chart for deployment (source 6). Governance is open through the [GOVERNANCE.md](https://github.com/project-akri/akri/blob/main/GOVERNANCE.md) role model.

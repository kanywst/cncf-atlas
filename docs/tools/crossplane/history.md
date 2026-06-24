# History

## Origin

Crossplane was created by Upbound in 2018 as a "universal multicloud control plane." The GitHub repository was created on 2018-09-08. The idea was to manage infrastructure across clouds through the Kubernetes API rather than through a separate CLI and state file. The origin and milestones are recounted in the [CNCF graduation blog](https://blog.crossplane.io/crossplane-cncf-graduation/).

## Timeline

| Year | Milestone |
| --- | --- |
| 2018 | Created and open-sourced by Upbound; repository created 2018-09-08 |
| 2020 | Accepted into the CNCF Sandbox on 2020-06-25 |
| 2021 | Promoted to CNCF Incubating on 2021-09-14, around the v1.0 milestone |
| 2025 | v2.0 released in August with a reworked architecture |
| 2025 | Graduated by the CNCF (graduated 2025-10-28, announced 2025-11-06) |

## How it evolved

The major architectural shift was Crossplane v2 in August 2025. It removed patch-and-transform composition and made composition entirely function-based, where each step is a gRPC service. v2 also added namespaced composite resources and the ability to compose any Kubernetes resource, and it deprecated claims. These changes are described in [What's New in v2](https://docs.crossplane.io/latest/whats-new/).

Governance and project infrastructure matured alongside the code. Graduation required two third-party security audits, vendor-neutral governance, an OpenSSF Best Practices badge, an LTS policy, moving the release infrastructure to CNCF ownership, and standing up the community registry `xpkg.crossplane.io`. These requirements are listed in the [CNCF graduation announcement](https://www.cncf.io/announcements/2025/11/06/cloud-native-computing-foundation-announces-graduation-of-crossplane/) and the [graduation blog](https://blog.crossplane.io/crossplane-cncf-graduation/). The application that tracked the process is [cncf/toc#1397](https://github.com/cncf/toc/issues/1397).

## Where it stands now

Crossplane is a CNCF Graduated project. The latest stable release at the documented commit was `v2.3.2` (2026-06-09); the pinned `main` HEAD sits after that release and before `v2.4.0-rc.0`. Package distribution moved to the community registry `xpkg.crossplane.io` as part of graduation. The [CNCF project page](https://www.cncf.io/projects/crossplane/) tracks the maturity timeline.

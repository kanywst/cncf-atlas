# History

## Origin

KubeVela grew out of the Open Application Model (OAM), an application delivery model that Alibaba Cloud and Microsoft Azure proposed together in 2020. KubeVela was the first implementation of OAM. It was derived from the `oam-kubernetes-runtime` project and bootstrapped with contributions from more than eight organizations, including Alibaba Cloud, Microsoft, and Upbound ([CNCF blog 2023-03-31](https://www.cncf.io/blog/2023/03/31/kubevela-the-road-to-cloud-native-application-and-platform-engineering/)).

The problem it set out to solve was the gap between application developers, who want to describe what they ship, and platform teams, who own the Kubernetes primitives underneath. OAM splits this into Components (the workload) and Traits (operational capabilities attached to a component), with the abstraction layer expressed in CUE ([CNCF blog 2023-03-31](https://www.cncf.io/blog/2023/03/31/kubevela-the-road-to-cloud-native-application-and-platform-engineering/)). A historical trace of that lineage still shows in the codebase: the Go module is named `github.com/oam-dev/kubevela` even though the repository now lives under `kubevela/kubevela` (`src/go.mod:1`).

## Timeline

| Year | Milestone |
| --- | --- |
| 2020 | OAM proposed by Alibaba Cloud and Microsoft Azure; KubeVela open-sourced in November as the first OAM implementation ([CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/)) |
| 2021 | v1.0 released in April; accepted as a CNCF Sandbox project on 2021-06-22 ([CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/)) |
| 2023 | Promoted to CNCF Incubating on 2023-02-27 ([CNCF project page](https://www.cncf.io/projects/kubevela/)) |

## How it evolved

The defining design choice from early on was to put the abstraction layer in CUE templates instead of Go code. ComponentDefinitions and TraitDefinitions are written in CUE and evaluated at reconcile time, so new component and trait types can be added without rebuilding the controller (`src/pkg/appfile/appfile.go:553`). This is what let the scope grow from a single application model into a delivery control plane that also handles workflow execution and multi-cluster placement.

By the time of the CNCF incubation review, the project had grown from 90+ to 290+ contributors, from 1,900+ to 4,700+ GitHub stars, and from 20+ to 70+ contributing organizations ([CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/)).

## Where it stands now

The latest stable tag is `v1.10.8`, and the latest pre-release is `v1.11.0-alpha.3` (2026-04-13); the commit documented here is on `master`, ahead of those tags. Governance lives in the `kubevela/community` repository; the in-repo `GOVERNANCE.md` is a pointer to it. Decisions are made by a super-majority vote of maintainers over a one-week private voting window, maintainers inactive for more than six months are removed automatically (extendable by super-majority), and the project follows the CNCF Code of Conduct ([GOVERNANCE.md](https://github.com/kubevela/community/blob/main/GOVERNANCE.md)).

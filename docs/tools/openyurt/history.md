# History

## Origin

Alibaba Cloud open-sourced OpenYurt in May 2020. The first release, `v0.1.0-beta.1`, shipped on 29 May 2020 (`README.md:15-17`). The CNCF blog records it as "originally open-sourced by Alibaba Cloud in May 2020". The starting problem was edge computing on Kubernetes: a single cloud control plane needs to manage nodes across sites that lose connectivity, and the team wanted to do this without forking upstream Kubernetes.

## Timeline

| Year | Milestone |
| --- | --- |
| 2020 | First release `v0.1.0-beta.1` (29 May); accepted into CNCF Sandbox (September) |
| 2025 | Promoted to CNCF Incubating (2 July) |
| 2026 | `v1.7.0` released (6 May), certified up to Kubernetes 1.34 |

## How it evolved

Edge autonomy came first: YurtHub's local cache let edge nodes survive cloud disconnection. The project then added region awareness through NodePool and YurtAppSet for placement scoped to a physical region, Raven for layer-3 edge-to-edge and edge-to-cloud connectivity, and YurtIoTDock to bridge EdgeX Foundry devices into Kubernetes CRDs (`README.md:42-50`).

A more recent shift addresses WAN cost. Pool-scope resources such as `services` and `discovery.k8s.io/endpointslices` are now shared through a leader YurtHub elected per NodePool, rather than every node listing and watching the cloud apiserver independently (`cmd/yurthub/app/options/options.go:126-129`).

## Where it stands now

The current release is `v1.7.0` (6 May 2026), certified to support up to Kubernetes 1.34 (`README.md:53`). When OpenYurt reached CNCF Incubating, the CNCF blog reported maintainers growing from 3 to 9, drawn from Microsoft, Alibaba, VMware, Intel, Inspur, Sangfor, and Tongji University, with around 170 contributors. The project's stated direction stays consistent: extend stock Kubernetes to the edge without intruding on its API.

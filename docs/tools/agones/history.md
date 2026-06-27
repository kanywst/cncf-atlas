# History

## Origin

Agones began in 2017 as a joint project between Google and Ubisoft. Both companies were independently writing private cluster-management and scaling code for their dedicated game servers, and the project set out to replace that with a Kubernetes-native approach built on controllers and custom resources. The README states the goal directly: Kubernetes gains native abilities to create, run, manage, and scale dedicated game server processes using standard Kubernetes tooling and APIs (`README.md:14`, `README.md:18`).

Google Cloud announced Agones publicly on 2018-03-14, releasing it as an open source v0.1 alpha (source 4). The name comes from the Greek word for "contest" or "gathering", matching its role as the place game servers are marshalled.

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | Started as a Google and Ubisoft collaboration (source 2). |
| 2018 | Announced and open-sourced by Google Cloud as v0.1 alpha on 2018-03-14 (source 4). |
| 2026 | Issue #4421 "Moving Agones to CNCF" filed on 2026-01-13 (source 6). |
| 2026 | Accepted into the CNCF Sandbox on 2025-12-21 (source 3). |
| 2026 | Repository moved from `googleforgames/agones` to the `agones-dev/agones` org; move to community governance announced 2026-03-23 (source 2). |

## How it evolved

The core model has been stable since the early releases: declarative `GameServer` resources, controllers that reconcile them, and an SDK sidecar that lets game binaries report their own lifecycle. Higher-level resources were layered on top over time. `GameServerSet` keeps a set of identical game servers running, `Fleet` manages rolling updates of those sets, `FleetAutoscaler` scales them, and `GameServerAllocation` lets a matchmaker claim a ready server. These are the same resource groups defined under `pkg/apis` today (`pkg/apis/agones/v1/gameserver.go:197`, `pkg/apis/agones/v1/fleet.go:41`).

The largest recent shift is governance, not code. After years as a Google-led project, Agones was donated to the CNCF and entered the Sandbox, with the repository relocated to a vendor-neutral org and development opening up to community-driven governance (source 2). At the documented commit the project is on the `1.59.0-dev` line: `install/helm/agones/Chart.yaml:18` pins `appVersion: "1.59.0-dev"`.

## Where it stands now

Agones ships frequent minor releases (the nearest tag to the documented commit is in the `v1.58.x` range, with `1.59.0-dev` in flight per `install/helm/agones/Chart.yaml:19`). The documented commit promotes the `PortRanges` feature gate from Beta to Stable, an example of the project's ongoing feature-gate-driven evolution. The stated direction following CNCF acceptance is to broaden the maintainer base beyond the founding companies and operate under open community governance while keeping the Kubernetes-native, cloud-agnostic design (source 2, `GOVERNANCE.md`).

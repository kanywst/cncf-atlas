# History

## Origin

containerd began in 2014 inside Docker as the runtime manager that sat below the Docker engine. Its job was to manage the runc processes that actually run containers. This followed the 2015 split that turned Docker's libcontainer into runc, the reference OCI runtime. containerd became the layer that drives runc and tracks running containers ([ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md), [CNCF graduation announcement](https://www.cncf.io/announcements/2019/02/28/cncf-announces-containerd-graduation/)).

Docker 1.11 integrated containerd as the engine's core runtime. From that point `docker run` delegated container lifecycle to containerd, which called runc to talk to the kernel ([Docker blog](https://www.docker.com/blog/containerd-vs-docker/), [DataCamp](https://www.datacamp.com/blog/containerd-vs-docker)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2014 | Created inside Docker as the runtime manager below the engine |
| 2016 | Integrated into Docker 1.11 as the core runtime driving runc |
| 2017 | Donated to CNCF as an Incubating project on 2017-03-29 |
| 2017 | 1.0 release: stable API, CRI plugin brought in-tree |
| 2019 | Graduated from CNCF on 2019-02-28, the fifth project to do so |
| 2024+ | 2.x series: module path moves to `/v2`, sandbox API and CRI cleanup |
| 2026 | 2.3 series current; pinned commit `e96fd14b8` reports `2.3.0+unknown` |

## How it evolved

Docker carved containerd out as an independent project and donated it to the CNCF in March 2017, where it entered as Incubating ([graduation announcement](https://www.cncf.io/announcements/2019/02/28/cncf-announces-containerd-graduation/)). The 1.0 release that year settled the public API and pulled the CRI plugin in-tree, so Kubernetes could use containerd directly rather than through Docker.

The 2.0 series moved the Go module path to `github.com/containerd/containerd/v2` and reorganised the runtime, including expanded sandbox APIs for pod-style isolation. The codebase splits domain logic under `core/` from the plugin wiring under `plugins/`, a structure visible at the pinned commit.

## Where it stands now

containerd is a graduated CNCF project on its 2.x line. The pinned commit `e96fd14b8` sits near `v2.3.0`, and the 2.3 release branch ships `v2.3.2`. At graduation the CNCF reported 14 committers, 4,406 commits, and 166 contributors, with participation from Alibaba, Cruise Automation, Docker, Facebook, Google, Huawei, IBM, Microsoft, NTT, and Tesla ([graduation announcement](https://www.cncf.io/announcements/2019/02/28/cncf-announces-containerd-graduation/)). The CNCF project page reports continued growth and an "Excellent" health score ([CNCF project page](https://www.cncf.io/projects/containerd/)).

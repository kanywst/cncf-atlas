# History

## Origin

In 2016 Kubernetes introduced the Container Runtime Interface (CRI), a plugin boundary that lets the kubelet swap container runtimes without recompiling. CRI-O began as the project to fill that boundary with a minimal, Kubernetes-only runtime. It started under the name OCID, led by Red Hat developers in the Kubernetes incubator alongside Google contributors ([CNCF graduation announcement](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/), [Red Hat blog](https://www.redhat.com/en/blog/red-hat-contributes-cri-o-cloud-native-computing-foundation)). The GitHub repository was created on 2016-09-09.

The `o` in the name and the early pod tooling came from libpod, which lived inside CRI-O and provided a Docker-CLI-like experience. That code later grew into Podman, and CRI-O narrowed to the CRI itself ([CNCF announcement](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Kubernetes adds the CRI; the project starts as OCID, then renames to CRI-O ([CNCF](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/)) |
| 2019 | CNCF TOC accepts CRI-O as Incubating on 2019-04-08 ([CNCF](https://www.cncf.io/blog/2019/04/08/cncf-to-host-cri-o/)) |
| 2023 | CRI-O graduates from the CNCF on 2023-07-19 ([CNCF](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/)) |
| 2026 | Released line at `v1.36.1` (2026-06-03); `main` reports `1.37.0` (`internal/version/version.go:6`) |

## How it evolved

When the CNCF accepted CRI-O as Incubating in 2019, its maintainers came from Red Hat, Intel, and SUSE, and early users included Lyft, Red Hat, and SUSE ([CNCF](https://www.cncf.io/blog/2019/04/08/cncf-to-host-cri-o/)). During incubation the project shipped 11 minor versions, around 100 patch releases, and more than 4000 commits, reaching tens of thousands of clusters ([CNCF](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/), [InfoQ](https://www.infoq.com/news/2023/09/cncf-crio-graduation/)).

Graduation in 2023 required the usual CNCF maturity work: updated governance, a Code of Conduct, a security disclosure process, and a third-party security audit by Ada Logics coordinated with the CNCF and OSTIF, plus documented end users and end-user interviews ([CNCF](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/)).

The defining design constant has been scope. CRI-O tracks Kubernetes version for version: a CRI-O `1.x` release targets Kubernetes `1.x`. The README still draws the boundary explicitly, delegating execution, images, storage, and networking to other components rather than absorbing them (`README.md:102-119`).

## Where it stands now

CRI-O releases on the Kubernetes cadence, maintaining recent minor lines (`ReleaseMinorVersions = {1.36, 1.35, 1.34}` per the recon notes). The latest released tag at the pinned commit is `v1.36.1` (2026-06-03), and `main` is on the `1.37.0` development line (`internal/version/version.go:6`). It is a CNCF Graduated project ([CNCF projects](https://www.cncf.io/projects/cri-o/)).

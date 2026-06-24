# Adoption & Ecosystem

## Who uses it

Every adopter below is named in the project's [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) at the pinned commit.

| Organisation | Use case | Source |
| --- | --- | --- |
| Docker / Moby | Engine's underlying runtime, then and now | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| Google Kubernetes Engine | Available from 1.14, default from 1.19; Autopilot containerd-only since launch | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| Amazon EKS / Fargate / Bottlerocket | EKS CRI from 1.21 (default 1.22); Fargate with Firecracker; Bottlerocket core runtime | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| Azure Kubernetes Service | Linux nodes 1.19+, Windows 1.20+ | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| IBM Cloud Kubernetes Service | CRI runtime from 1.11+ | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| k3s (Rancher / SUSE) | Embedded runtime in lightweight Kubernetes | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| Talos Linux, Deckhouse, VMware TKG/TCE | Default CRI runtime | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| Kata Containers, firecracker-containerd | Custom v2 shims driving VM-based containers | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| OpenFaaS faasd, Balena, LinuxKit, BuildKit, Cloud Foundry Guardian | Execution backend | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |

## Adoption signals

- GitHub: 20,870 stars and 3,979 forks ([GitHub API](https://api.github.com/repos/containerd/containerd), observed 2026-06-22).
- CNCF LFX Insights, via the [CNCF project page](https://www.cncf.io/projects/containerd/): 6,382 total contributors (up about 10% year over year), 1,667 contributing organisations, first commit 2015-07-17, health score "Excellent (83)".
- containerd is the default CRI runtime across the three major managed Kubernetes services, which is the strongest practical adoption signal: most Kubernetes clusters run on it.

## Ecosystem

- nerdctl: a Docker-compatible CLI for containerd (around 10k stars).
- BuildKit: image building, run on containerd.
- stargz-snapshotter and SOCI: lazy image pull through snapshotter plugins.
- runwasi: runs Wasm workloads through a shim (Rust).
- CNI plugins for networking, and snapshotters for overlayfs, devmapper, zfs, and btrfs.

## Alternatives

containerd is a general-purpose runtime with a stable API, where CRI is one plugin among many. The honest comparisons:

| Alternative | Differs by |
| --- | --- |
| CRI-O | Kubernetes-only by design; smaller surface, no general runtime API |
| Docker / Moby | Sits above containerd rather than competing; uses it internally |
| Podman | Daemonless, rootless-first; uses conmon + crun, not containerd |
| runc / crun / youki | OCI runtimes that run under containerd, not replacements for it |
| gVisor / Kata / Firecracker | Stronger isolation runtimes that plug in as containerd shims |

Pick containerd when you want the runtime Kubernetes defaults to or a programmable runtime API. Pick CRI-O when you want a minimal Kubernetes-only runtime. Pick Podman when you want a daemonless single-host workflow.

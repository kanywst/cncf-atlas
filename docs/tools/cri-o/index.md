# CRI-O

> A lightweight container runtime that implements the Kubernetes Container Runtime Interface so the kubelet can run pods through OCI runtimes like runc or crun.

- **Category**: Runtime
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [cri-o/cri-o](https://github.com/cri-o/cri-o)
- **Documented at commit**: `68f2617` (2026-06-22, `main`, version line 1.37.0)

## What it is

CRI-O is a single-purpose implementation of the Kubernetes Container Runtime Interface (CRI). The kubelet speaks CRI over gRPC, and CRI-O translates those calls into actions on an OCI runtime, an image store, and a network plugin. It ships one binary, `crio`, which runs as a daemon. There is no general-purpose CLI for end users (`README.md:102-107`).

CRI-O delegates the parts other runtimes try to own. Container execution goes to an OCI runtime such as [runc](https://github.com/opencontainers/runc) or crun, images go through containers/image, storage goes through containers/storage, and networking goes through CNI (`README.md:113-119`). CRI-O itself is the glue between the kubelet and those components.

It targets one consumer, the kubelet, and tracks Kubernetes version for version. A CRI-O `1.x` release lines up with Kubernetes `1.x`. The pinned commit reports version `1.37.0` (`internal/version/version.go:6`), on the development line above the released `v1.36.1`.

## When to use it

- You run Kubernetes and want a runtime scoped to exactly that, with no extra surface to secure or operate.
- You want the runtime version pinned to your Kubernetes minor version.
- You need pluggable isolation per workload: runc or crun for normal pods, Kata Containers for VM-isolated pods, selected by runtime handler.
- Avoid it if you need a standalone container engine for local builds or non-Kubernetes hosts. CRI-O does not ship a user CLI or an image builder; that is out of scope by design (`README.md:102-107`).

## In this deep-dive

- [History](./history): origin as OCID, the path through CNCF incubation to graduation.
- [Architecture](./architecture): the daemon, the OCI abstraction, and how a pod gets created.
- [Adoption & Ecosystem](./adoption): who runs it and the alternatives.
- [Internals](./internals): the core types and the RunPodSandbox path, read from source.
- [Getting Started](./getting-started): install and a minimal working setup.

## Sources

1. [cri-o/cri-o (GitHub)](https://github.com/cri-o/cri-o)
2. [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md)
3. [install.md](https://github.com/cri-o/cri-o/blob/main/install.md)
4. [CNCF Announces Graduation of CRI-O (2023-07-19)](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/)
5. [CNCF to host CRI-O (2019-04-08)](https://www.cncf.io/blog/2019/04/08/cncf-to-host-cri-o/)
6. [Red Hat contributes CRI-O to the CNCF](https://www.redhat.com/en/blog/red-hat-contributes-cri-o-cloud-native-computing-foundation)
7. [InfoQ: CRI-O Graduates from CNCF (2023-09)](https://www.infoq.com/news/2023/09/cncf-crio-graduation/)
8. [CRI-O on CNCF projects](https://www.cncf.io/projects/cri-o/)
9. [OpenShift Container Platform 4 defaults to CRI-O](https://www.redhat.com/en/blog/red-hat-openshift-container-platform-4-now-defaults-cri-o-underlying-container-engine)
10. [Oracle Linux Cloud Native Environment: CRI-O](https://docs.oracle.com/en/operating-systems/olcne/2/kubernetes/crio_concept.html)
11. [containerd](https://github.com/containerd/containerd)
12. [opencontainers/runc](https://github.com/opencontainers/runc)

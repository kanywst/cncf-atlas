# containerd

> An OCI-compliant container runtime daemon that manages the full container lifecycle and serves as the runtime layer beneath Kubernetes and Docker.

- **Category**: Container Runtime
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [containerd/containerd](https://github.com/containerd/containerd)
- **Documented at commit**: `e96fd14b8` (2026-06-19, near `v2.3.0`)

## What it is

containerd is a daemon that manages containers on a single host. It pulls images from registries, unpacks them into filesystem layers, stores metadata, and runs containers through an OCI runtime such as runc. It exposes its services over gRPC, by default on the UNIX socket at `/run/containerd/containerd.sock`.

It sits one level below the tools most people interact with. Docker delegates container lifecycle to containerd, and Kubernetes talks to it through the CRI (Container Runtime Interface) plugin. containerd itself does not build images or manage networks beyond what a CNI plugin provides. It runs the containers and tracks their state.

Internally it is a collection of plugins. Each subsystem (content store, snapshotter, CRI, gRPC services) registers as a `plugin.Registration` and is wired together at daemon startup in dependency order. This keeps the core small and lets operators swap pieces such as the snapshotter or the OCI runtime.

## When to use it

- You run Kubernetes and want the CRI runtime that GKE, EKS, and AKS default to.
- You need a stable, general-purpose runtime API to build a platform on, rather than a Kubernetes-only surface.
- You want the runtime that backs Docker without the full Docker engine.
- You are building VM-isolated or Wasm workloads and want to plug a custom shim into a standard runtime.

It is a poor fit when you want a daemonless, rootless-first single-host tool: Podman fits that better. It is also more than you need if you only want to build images, which BuildKit or nerdctl handle on top of it.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [containerd/containerd (GitHub)](https://github.com/containerd/containerd)
2. [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md)
3. [containerd / CNCF project page](https://www.cncf.io/projects/containerd/)
4. [CNCF announces containerd graduation (2019-02-28)](https://www.cncf.io/announcements/2019/02/28/cncf-announces-containerd-graduation/)
5. [containerd Project Journey Report (CNCF)](https://www.cncf.io/reports/containerd-project-journey-report/)
6. [containerd official site](https://containerd.io/)
7. [containerd vs. Docker (Docker blog)](https://www.docker.com/blog/containerd-vs-docker/)
8. [Containerd vs Docker: Understanding Container Runtimes (DataCamp)](https://www.datacamp.com/blog/containerd-vs-docker)
9. [GitHub REST API repos/containerd/containerd](https://api.github.com/repos/containerd/containerd)
10. [runtime-v2 (shim API) README](https://github.com/containerd/containerd/blob/main/core/runtime/v2/README.md)

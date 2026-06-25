# Lima

> Lima launches Linux virtual machines on macOS, Linux, and Windows with automatic file sharing and port forwarding, originally built to run containerd and nerdctl on a Mac.

- **Category**: Runtime
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [lima-vm/lima](https://github.com/lima-vm/lima)
- **Documented at commit**: `9a3f1c4` (after tag v2.1.3, 2026-06-23)

## What it is

Lima runs a Linux guest in a virtual machine and wires it into your host so that it feels local. When you start an instance, Lima mounts host directories into the guest, forwards guest ports back to the host, and gives you a shell in the VM with one command. The project describes itself as "WSL2 for macOS", though it also runs on Linux, NetBSD, and Windows hosts.

The original goal was to deliver containerd and nerdctl to macOS developers, who otherwise had no native way to run Linux containers. The scope has since widened to Docker, Podman, Kubernetes, and general-purpose Linux VMs. A VM is configured from a single YAML template, so a development environment is reproducible and version-controllable.

Lima drives the VM through a pluggable driver layer. QEMU, Apple Virtualization.framework (vz), WSL2, and krunkit are supported backends, and out-of-tree drivers can be plugged in as separate gRPC processes. A host-side daemon manages SSH, mounts, port forwarding, and DNS for each running instance.

## When to use it

- You develop on macOS or Windows and need real Linux containers (containerd, Docker, Podman) without a commercial Desktop product.
- You want a reproducible Linux dev VM defined as YAML, with host folders and ports shared automatically.
- You want to run an AI coding agent inside an isolated VM so it cannot reach host files or commands directly, a focus area since v2.0.
- Less suitable when you need a polished GUI and bundled features out of the box, or a single-vendor commercial product with support; a Desktop product or OrbStack may fit better.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a `limactl start` flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [lima-vm/lima README](https://github.com/lima-vm/lima) (Adopters, Homebrew install), accessed 2026-06-24.
2. [Pinned commit `9a3f1c4`](https://github.com/lima-vm/lima/commit/9a3f1c443389c673eb619f7b1922b1a4d8e4fd16), accessed 2026-06-24.
3. [Release v2.1.3](https://github.com/lima-vm/lima/releases/tag/v2.1.3), accessed 2026-06-24.
4. [Lima becomes a CNCF incubating project](https://www.cncf.io/blog/2025/11/11/lima-becomes-a-cncf-incubating-project/), CNCF, 2025-11-11.
5. [CNCF project page: Lima](https://www.cncf.io/projects/lima/), accessed 2026-06-24.
6. [Lima v2.0: New features for secure AI workflows](https://www.cncf.io/blog/2025/12/11/lima-v2-0-new-features-for-secure-ai-workflows/), CNCF, 2025-12-11.
7. [Lima v2.1: macOS guests and enhanced AI agent safety](https://www.cncf.io/blog/2026/03/25/lima-v2-1-macos-guests-and-enhanced-ai-agent-safety/), CNCF, 2026-03-25.
8. [Lima documentation](https://lima-vm.io/docs/), accessed 2026-06-24.
9. [GitHub REST API: repos/lima-vm/lima](https://api.github.com/repos/lima-vm/lima), accessed 2026-06-24.

# bootc

> Transactional, in-place operating system updates that ship the whole host as an OCI (Open Container Initiative) image.

- **Category**: Runtime
- **CNCF maturity**: Sandbox
- **Language**: Rust
- **License**: MIT OR Apache-2.0 (dual)
- **Repository**: [bootc-dev/bootc](https://github.com/bootc-dev/bootc)
- **Documented at commit**: `a7f95e7` (near tag v1.16.2)

## What it is

bootc boots and upgrades a Linux host from a container image. You build a bootable operating system the same way you build an application container: a `Containerfile`, `podman build`, and a registry. bootc then installs that image to a disk and applies later versions of the same image tag in place. The repository README states the goal plainly: apply the Docker layer model to bootable host systems, using standard OCI/Docker containers as the transport and delivery format for base operating system updates (`README.md:8-12`).

A bootc system is not a container at runtime. The container image carries a Linux kernel under `/usr/lib/modules`, and that kernel is what boots. Once booted, the base userspace is not running inside a container: systemd runs as pid1 as usual, with no outer process (`README.md:14-17`). The container is purely the packaging and delivery format.

bootc is the successor interface to ostree and rpm-ostree, two projects with the same lineage from Red Hat. It models host state as a Kubernetes-style declarative object and applies updates in an A/B style so a bad update can be rolled back.

## When to use it

- You want fleet hosts defined as an immutable image and updated by changing a registry tag, the way you already ship application containers.
- You need atomic, in-place OS updates with a guaranteed rollback slot rather than per-package upgrades through `apt` or `dnf`.
- You build base images with existing OCI tooling (`podman`, `buildah`, Dockerfiles) and want the host OS to use the same pipeline.
- It is a weaker fit when you need to mutate the running root filesystem freely at runtime, since the deployed `/usr` is read-only by design.
- It is not the tool for managing application workloads on top of an OS; it manages the OS itself.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how an upgrade flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [bootc-dev/bootc repository](https://github.com/bootc-dev/bootc)
2. [bootc source at commit a7f95e7](https://github.com/bootc-dev/bootc/tree/a7f95e743aa54a2f966edc1a0417ef6d509df9af)
3. [bootc CNCF project page](https://www.cncf.io/projects/bootc/)
4. [Making containers bootable for fun and profit (LWN)](https://lwn.net/Articles/979182/)
5. [Changes/OstreeNativeContainerStable (Fedora Project Wiki)](https://fedoraproject.org/wiki/Changes/OstreeNativeContainerStable)
6. [bootc website and documentation](https://bootc.dev/bootc/)

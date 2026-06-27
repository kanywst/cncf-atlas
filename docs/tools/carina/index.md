# Carina

> Carina is a Container Storage Interface (CSI) driver that carves local disks on each Kubernetes node into volumes, aimed at databases that run best on raw local disk performance.

- **Category**: Storage & Database
- **CNCF maturity**: Sandbox
- **Language**: Go 1.19
- **License**: Apache License 2.0
- **Repository**: [carina-io/carina](https://github.com/carina-io/carina)
- **Documented at commit**: `aec3a9f` (2025-04-15)

## What it is

Carina is a CSI (Container Storage Interface, the Kubernetes plugin standard for storage) driver for local storage. Instead of pooling disks across the network, it manages the bare disks attached to each node with LVM (Logical Volume Manager, the Linux logical volume layer) and hands out volumes that live on the node where the pod runs. The CSI driver name is `carina.storage.io` (`constants.go:23`).

The project targets stateful workloads that already replicate their own data, such as databases and middleware. The README Background argues that distributed storage duplicates the replication and consistency the database already does, wasting capacity and adding latency. Carina takes the opposite stance: keep the storage layer thin and let the application get the raw performance of a local disk.

Three components split the work. A cluster-level controller turns each PersistentVolumeClaim (PVC) into a custom resource, a per-node agent does the actual disk work, and a scheduler plugin places pods on nodes that have free capacity. The Kubernetes API server is the message bus between them.

## When to use it

- You run databases or middleware that handle their own replication and want local disk performance without a distributed storage layer in the path.
- You want one driver to serve LVM volumes, raw disk partitions, and host directories from the same StorageClass set.
- You want automatic tiering of slow and fast disks (a hard disk drive plus a solid state drive) behind a single volume using bcache.
- It is not a fit when you need volumes that survive node loss or move between nodes. Data is pinned to one node, so node failure means the volume is unavailable until the node returns.
- It is not a fit when you need ReadWriteMany. Only the `SINGLE_NODE_WRITER` access mode is accepted (`pkg/csidriver/driver/controller.go:109`).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. carina-io/carina source, README, and deploy manifests: <https://github.com/carina-io/carina>
2. Carina CNCF project page (Sandbox, accepted 2022-12-14): <https://www.cncf.io/projects/carina/>
3. carina-io/carina releases (latest v0.14.0, 2025-04-16): <https://github.com/carina-io/carina/releases>
4. cncf/toc #974, Carina Sandbox onboarding: <https://github.com/cncf/toc/issues/974>
5. cncf/sandbox #204, Carina onboarding: <https://github.com/cncf/sandbox/issues/204>
6. GitHub REST API for carina-io/carina (stars, forks, license, pushed): <https://api.github.com/repos/carina-io/carina>

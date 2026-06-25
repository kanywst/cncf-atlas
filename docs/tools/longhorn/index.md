# Longhorn

> Kubernetes-native distributed block storage that gives every volume its own lightweight engine and replicas.

- **Category**: Storage & Database
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [longhorn/longhorn-manager](https://github.com/longhorn/longhorn-manager)
- **Documented at commit**: `3b8885a` (master, committer date 2026-06-23)

## What it is

Longhorn is distributed block storage for Kubernetes. It turns the local disks on your nodes into replicated `PersistentVolumes` without a separate storage appliance. The umbrella project lives at [longhorn/longhorn](https://github.com/longhorn/longhorn); the Go control plane this deep-dive reads lives at [longhorn/longhorn-manager](https://github.com/longhorn/longhorn-manager).

Its defining choice is microservice per volume. Instead of pooling all disks behind one shared controller, Longhorn gives each volume its own engine (the storage controller) plus N replica processes, each a separate process scheduled onto a node. The control plane is `longhorn-manager`, a DaemonSet of CRDs and controllers. The data plane is `longhorn-engine` and `longhorn-instance-manager`, which run the actual block I/O.

The manager does not serve I/O. It reconciles desired state (a `Volume` spec) against observed state by creating `Replica` and `Engine` custom resources, scheduling them onto nodes and disks, and asking the per-node instance manager to start the matching processes over gRPC.

## When to use it

- You want replicated persistent block storage on Kubernetes using the disks you already have, with no external SAN or cloud volume service.
- You run edge or small-to-medium clusters where Rook/Ceph operational weight is hard to justify.
- You need per-volume snapshots, backups to S3 or NFS, and a UI, installable in one manifest.
- Avoid it when you need a single system that also serves object and file storage natively, or when production reports show it needs dedicated disks and replica tuning your team cannot commit to. See [Adoption & Ecosystem](./adoption) for the honest counterpoints.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. longhorn/longhorn umbrella repository: <https://github.com/longhorn/longhorn>
2. longhorn/longhorn-manager control plane (cloned and read at commit `3b8885a`): <https://github.com/longhorn/longhorn-manager>
3. Longhorn brings cloud native distributed storage to the CNCF Incubator: <https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/>
4. CNCF project page (Longhorn, Incubating): <https://www.cncf.io/projects/longhorn/>
5. Longhorn Accepted into CNCF (Rancher, 2019): <https://www.rancher.com/blog/2019/longhorn-accepted-into-cncf/>
6. CNCF welcomes Longhorn to its sandbox (DEVCLASS): <https://devclass.com/2019/10/29/cncf-welcomes-longhorn-to-its-sandbox/>
7. Persistent Block Storage for Kubernetes: SUSE Storage, powered by Longhorn: <https://www.suse.com/c/persistent-block-storage-for-kubernetes-suse-storage-powered-by-longhorn/>
8. Longhorn project site: <https://longhorn.io/>
9. Longhorn install docs: <https://longhorn.io/docs/latest/deploy/install/>
10. Longhorn Provides Persistent Storage for 35,000 Kubernetes Nodes (Altoros): <https://www.altoros.com/blog/longhorn-provides-persistent-storage-for-35000-kubernetes-nodes/>
11. Why Replicated moved away from recommending Longhorn for kURL: <https://www.replicated.com/blog/why-replicated-has-moved-away-from-recommending-longhorn-for-kurl-storage>
12. Longhorn on Production Clusters: tuning and gotchas (CloudCasa): <https://cloudcasa.io/blog/longhorn-on-production-clusters-storage-configuration-tuning-and-gotchas>
13. Longhorn vs OpenEBS vs Rook/Ceph 2025: <https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025>
14. longhorn/longhorn-engine: <https://github.com/longhorn/longhorn-engine>

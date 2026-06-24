# Rook

> A Kubernetes operator that turns the Ceph storage system into a set of custom resources, so block, file, and object storage are declared and reconciled like any other Kubernetes object.

- **Category**: Storage & Database
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [rook/rook](https://github.com/rook/rook)
- **Documented at commit**: `63eed4e` (2026-06-19, `master`)

## What it is

Rook is an operator for running [Ceph](https://ceph.io) on Kubernetes. It does not implement a storage engine of its own. Instead it packages Ceph, an established distributed storage system, and drives it through Custom Resource Definitions so that an administrator declares the desired cluster in YAML and Rook reconciles the running Ceph daemons toward that state.

The whole project ships as a single Go binary named `rook` whose `ceph operator` subcommand runs the operator, while other subcommands act as in-pod helpers (`cmd/rook/main.go:27`). The operator registers one controller per storage concept (pools, filesystems, object stores, and more) and translates each custom resource into Ceph monitors, managers, OSDs, and the CSI driver that carries the actual data path.

It sits at the storage layer of a cluster. An application requests a PersistentVolumeClaim, the Ceph CSI driver provisions it from a pool that Rook configured, and Rook keeps the underlying mon/mgr/OSD topology healthy as nodes and disks come and go.

## When to use it

- You need block, file, and S3-compatible object storage from a single system, all provisioned inside Kubernetes.
- You want to run Ceph but do not want to manage its daemons, keyrings, and upgrades by hand.
- You run stateful workloads on-premises or across cloud nodes where managed storage is unavailable.
- Avoid it when one volume type is enough and operational simplicity matters more; a lighter project such as Longhorn carries far less learning cost than Ceph's CRUSH maps and placement groups.
- Avoid it on tiny clusters where Ceph's CPU and memory overhead outweighs the benefit.

## In this deep-dive

- [History](./history): origin at Upbound, the move to CNCF, and the narrowing to Ceph.
- [Architecture](./architecture): the operator, its controllers, and how a CephCluster is reconciled.
- [Adoption & Ecosystem](./adoption): cited adopters, signals, and alternatives.
- [Internals](./internals): the CephCluster reconcile path, read from source.
- [Getting Started](./getting-started): install the operator and create a first cluster.

## Sources

1. [rook/rook GitHub repository](https://github.com/rook/rook)
2. [Rook Ceph Documentation (Getting Started)](https://rook.github.io/docs/rook/latest-release/Getting-Started/intro/)
3. [CNCF to host the Rook project](https://www.cncf.io/blog/2018/01/29/cncf-host-rook-project-cloud-native-storage-capabilities/)
4. [CNCF Announces Rook Graduation](https://www.cncf.io/announcements/2020/10/07/cloud-native-computing-foundation-announces-rook-graduation/)
5. [Rook Expands Support, Ceph Moves to Stable (Upbound)](https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable)
6. [Rook.io homepage](https://rook.io/)
7. [Longhorn vs OpenEBS vs Rook-Ceph 2025 (onidel)](https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025)
8. [Kubernetes Storage Showdown 2025 (darumatic)](https://darumatic.com/blog/2025-k8s-storage-showdown)
9. [ADOPTERS.md (rook/rook)](https://github.com/rook/rook/blob/master/ADOPTERS.md)
10. [OWNERS.md / GOVERNANCE.md (rook/rook)](https://github.com/rook/rook/blob/master/OWNERS.md)

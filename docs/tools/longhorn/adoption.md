# Adoption & Ecosystem

## Who uses it

The CNCF Incubator promotion blog (2021-11-04) names production users with described use cases ([source 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/)).

| Organisation | Use case | Source |
| --- | --- | --- |
| Cerner | Healthcare IT; persistent storage and highly available data replication. | [source 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/) |
| Tribunal Regional Eleitoral do Pará | Brazilian regional electoral court; storage backend for Prometheus and similar workloads. | [source 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/) |
| Tyk | Open-source API and service management; backs hundreds of dynamically provisioned cluster nodes. | [source 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/) |

An honest counterpoint: not every adoption is a success story. Replicated removed Longhorn as the default storage in kURL, attributing drive corruption, mount failures, and unrecoverable state after reboot to Longhorn ([source 11](https://www.replicated.com/blog/why-replicated-has-moved-away-from-recommending-longhorn-for-kurl-storage)). Production guidance also stresses that Longhorn expects dedicated disks and replica-count tuning rather than defaults ([source 12](https://cloudcasa.io/blog/longhorn-on-production-clusters-storage-configuration-tuning-and-gotchas)).

## Adoption signals

Measured on 2026-06-24 via `gh`:

- `longhorn/longhorn` (umbrella): 7,805 stars, 712 forks, roughly 162 contributors. Community metrics concentrate on this umbrella repository.
- Individual implementation repos: `longhorn-engine` 386 stars, `longhorn-manager` 211, `longhorn-instance-manager` 27.
- The `longhorn` GitHub org holds 41 repositories.

For scale, the CNCF cited 34,000+ running nodes at promotion time (2021-11), and SUSE engineers later referenced 35,000 active nodes ([source 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/), [source 10](https://www.altoros.com/blog/longhorn-provides-persistent-storage-for-35000-kubernetes-nodes/)).

## Ecosystem

- **Kubernetes CSI**: dynamic provisioning, snapshots, and volume expansion.
- **RWX volumes**: served through a built-in NFS share manager.
- **Backups**: to S3 or NFS targets; Velero integration for cluster backup and restore.
- **Observability**: Prometheus metrics.
- **One-click install**: from Rancher and SUSE Rancher Prime.
- **Sibling data-plane repos**: `longhorn-engine` (the v1 storage controller, "World's smallest storage controller", [source 14](https://github.com/longhorn/longhorn-engine)) and `longhorn-instance-manager` (the per-node gRPC service that starts engine and replica processes), plus the SPDK-based v2 engine components.

## Alternatives

The real distinction is scope. Longhorn is block-only and runs replica management itself; the alternatives trade that simplicity for breadth or raw speed ([source 13](https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025)).

| Alternative | Differs by |
| --- | --- |
| Rook/Ceph | Serves block, file, and object from one system, at the cost of CRUSH map and placement-group learning curve and higher CPU overhead. Longhorn is block-only and simpler to operate, aimed at edge and mid-size clusters. |
| OpenEBS | Lets you pick engines: Mayastor (NVMe-oF/SPDK, fast) or cStor/Jiva (simpler). Longhorn ships one product and owns replica management end to end. |
| Portworx | Commercial; strong on application-aware snapshots and DR, but carries license cost. |

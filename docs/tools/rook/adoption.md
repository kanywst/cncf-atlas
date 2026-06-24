# Adoption & Ecosystem

## Who uses it

The project's [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) lists only organisations that have publicly disclosed production use. The named adopters below are drawn from it.

| Organisation | Use case | Source |
| --- | --- | --- |
| Calit2 | Runs one of the largest known Rook production clusters | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |
| NAV (Norwegian Labour and Welfare Administration) | A public agency handling roughly a third of Norway's national budget; uses Rook to simplify Ceph operation | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |
| Replicated | Ships Rook as a standard add-on of its open-source kURL installer | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |
| Discogs | Runs Rook behind one of the largest music databases and marketplaces | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |
| Gini | Uses Ceph with Rook for redundant S3-compatible storage | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |
| Alauda | Uses Rook Ceph for data services in its container platform (ACP) | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |

ADOPTERS.md lists further organisations including Finleap Connect, CENGN, Avisi, and Cloudways.

## Adoption signals

Measured on 2026-06-22 from the GitHub API: about 13,553 stars, 2,827 forks, and roughly 384 contributors (the contributor count is derived from the last page of a `per_page=1` query) ([rook/rook](https://github.com/rook/rook)). Rook reached CNCF Graduated status in 2020 as the first block, file, and object storage project to do so ([CNCF graduation announcement](https://www.cncf.io/announcements/2020/10/07/cloud-native-computing-foundation-announces-rook-graduation/)).

## Ecosystem

Rook deploys and depends on [ceph-csi](https://github.com/ceph/ceph-csi), the CSI driver that carries the actual data path for provisioned volumes. Installation is a two-chart layout: the `rook-ceph` Helm chart installs the operator and the `rook-ceph-cluster` chart creates the cluster, both under `deploy/charts` ([Getting Started](https://rook.github.io/docs/rook/latest-release/Getting-Started/intro/)). Rook integrates with Prometheus through the Ceph mgr's exporter and supports CSI snapshots. Through its CRDs it exposes RBD (block), CephFS (file), and RGW (S3-compatible object) from a single product, plus NFS, NVMe-of, object buckets, and COSI.

## Alternatives

Rook and Ceph deliver block, file, and object storage from one system. The cost is operational: CRUSH maps, placement groups, and a higher CPU and memory footprint than the lighter alternatives ([onidel comparison](https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025), [darumatic comparison](https://darumatic.com/blog/2025-k8s-storage-showdown)).

| Alternative | Differs by |
| --- | --- |
| Longhorn | Simpler block storage aimed at edge and mid-size clusters; far lower learning curve, no object/file in one product ([onidel](https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025)) |
| OpenEBS | Mayastor engine targets fast NVMe-of; cStor and Jiva engines aim at simpler setups ([onidel](https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025)) |
| Portworx | Commercial product with application-aware snapshots and disaster recovery ([darumatic](https://darumatic.com/blog/2025-k8s-storage-showdown)) |

# Adoption & Ecosystem

## Who uses it

The repository ships an `ADOPTERS.md` file with one named organisation. BoCloud, the company that started the project, lists itself as a production adopter and says its customers have run Carina in production and testing for years, typically for cloud native middleware (`ADOPTERS.md:9`). No other organisation is listed there, and there is no separate CNCF case study, so the public adopter list is short and self-reported.

| Organisation | Use case | Source |
| --- | --- | --- |
| BoCloud (BeyondCent) | Cloud native middleware on local disks, in production and testing | [ADOPTERS.md](https://github.com/carina-io/carina/blob/main/ADOPTERS.md) |

## Adoption signals

Because the named adopter list is thin, GitHub signals are the more useful measure. As of 2026-06-26 the GitHub REST API reports roughly 724 stars, 86 forks, about 20 contributors, and 40 open issues. The latest release is v0.14.0 (2025-04-16), and the last push was the same week; commits stop after April 2025, which signals slowing maintenance. The project is registered with the OpenSSF (Open Source Security Foundation) Best Practices badge program as project 6908 and displays a FOSSA license scan badge, both linked from the README.

## Ecosystem

- **Standard CSI (Container Storage Interface)**: volumes are requested through a normal StorageClass with `provisioner: carina.storage.io` (`deploy/kubernetes/storageclass-lvm.yaml:6`).
- **kube-scheduler framework**: the scheduler plugin integrates as a `Filter` and `Score` extension rather than a separate scheduler.
- **Prometheus**: metrics live in `pkg/metrics` with a ServiceMonitor manifest at `deploy/kubernetes/prometheus-service-monitor.yaml`.
- **Linux storage stack**: it builds directly on LVM2 (Logical Volume Manager) and the bcache kernel module for tiering.

## Alternatives

Carina sits in the LVM-based local CSI family. The closest peers manage local disks on each node; the distributed systems below take a different approach by replicating over the network.

| Alternative | Differs by |
| --- | --- |
| TopoLVM | The original CRD-mediated, scheduler-extended LVM local CSI design that Carina follows; Carina adds raw-partition and host-path volume types and bcache tiering. |
| OpenEBS LocalPV-LVM | Also LVM-based local provisioning, part of the broader OpenEBS suite; Carina is narrower and database-focused. |
| HwameiStor | Another local-disk CSI family that publishes a comparison table placing OpenEBS, Carina, and TopoLVM in the same category. |
| Rook/Ceph, Longhorn, CubeFS | Distributed storage that replicates over the network for availability; Carina deliberately keeps data on one node for raw local performance. |

# Adoption & Ecosystem

## Who uses it

The repository keeps an `ADOPTERS.md` file with a production and testing split. The named adopters below all come from that file (S1) or from CNCF's graduation announcement (S3).

| Organisation | Use case | Source |
| --- | --- | --- |
| JD.com | In production since 2018: 3000+ workloads, 50+ PB, 5000+ servers; ads, search, AI training | [ADOPTERS.md](https://github.com/cubefs/cubefs/blob/master/ADOPTERS.md) |
| OPPO | Backend storage for a Kubernetes-based AI platform | [ADOPTERS.md](https://github.com/cubefs/cubefs/blob/master/ADOPTERS.md) |
| NetEase (网易) | Backend for Elasticsearch, 2+ PB | [ADOPTERS.md](https://github.com/cubefs/cubefs/blob/master/ADOPTERS.md) |
| Meizu, BEIKE, LinkSure, Reconova, BIGO, Vipshop | Listed under production | [ADOPTERS.md](https://github.com/cubefs/cubefs/blob/master/ADOPTERS.md) |
| Xiaomi, Shopee, CreditEase, TD Tech | Listed in production or testing tables | [ADOPTERS.md](https://github.com/cubefs/cubefs/blob/master/ADOPTERS.md) |

At graduation CNCF reported over 200 organizations using CubeFS and about 350 PB under management as of January 2025 (S3, S4).

## Adoption signals

- GitHub: 5,593 stars and 703 forks (gh API, 2026-06-22).
- Contributors: the GitHub contributors API paginated to 127 (about 127 accounts, 2026-06-22). CNCF reports a separate count growing from 27 to 379 contributors across 42 companies (S3, S4).
- Organizations: CNCF states adoption grew from roughly 10 to over 200 across the Sandbox-to-graduation period (S3).
- Releases: latest is v3.5.3, dated 2025-12-23 (S10).

## Ecosystem

- CSI driver: `cubefs/cubefs-csi`, a separate sub-project repo (S1).
- Helm chart: `cubefs/cubefs-helm`, a separate sub-project repo (S1).
- Client surfaces: S3 SDKs through ObjectNode, Hadoop FileSystem, and POSIX FUSE.
- Observability: Prometheus metrics through `util/exporter`.

## Alternatives

CubeFS is compared directly with Ceph in its origin paper, which benchmarks metadata operations against CephFS and RADOS (S7). Other systems in the same space:

| Alternative | Differs by |
| --- | --- |
| Ceph (CephFS/RADOS) | Unified object, block, and file with CRUSH placement; the SIGMOD baseline CubeFS measured against (S7) |
| MinIO | S3 object storage only; no POSIX or HDFS file semantics |
| JuiceFS | POSIX file system that keeps metadata in an external database rather than in-memory B-Trees |
| Alluxio | A caching and data-orchestration layer over existing stores, not a primary store |
| HDFS | The HDFS-compatible API CubeFS offers is meant to let it stand in for HDFS |

The distinctions that matter: CubeFS serves file and object in one system and lets a volume choose multi-replica or erasure coding; it keeps metadata in memory and places it by memory usage, which it argues avoids rebalancing on capacity growth (S7); and the Master stays off the data path.

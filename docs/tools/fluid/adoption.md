# Adoption & Ecosystem

## Who uses it

Adopters below are named either in the CNCF Incubating announcement or in the repository's `ADOPTERS.md`. Both are cited; nothing here is inferred.

| Organisation | Use case | Source |
| --- | --- | --- |
| Alibaba Cloud PAI | Deep learning containers, production | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| Weibo | Production data acceleration | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| Bilibili | Production data acceleration | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| Qihoo 360 | Production data acceleration | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| OPPO | Production data acceleration | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| NetEase Games | Production data acceleration | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| China Telecom Cloud | Production data acceleration | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| Xiaomi | Named adopter | [CNCF blog](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/) |
| Inceptio Technology | Autonomous driving workloads | [CNCF blog](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/) |
| Metabit Trading, JoinQuant | Quantitative finance | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |

The CNCF announcement additionally lists Huya, Zuoyebang, Unisound, DP Technology, and others; `ADOPTERS.md` also tracks Tencent Cloud, Baidu AI Cloud, and Xiaomi in testing or staging phases.

## Adoption signals

- GitHub stars: 1,942; forks: 1,265 ([GitHub API](https://api.github.com/repos/fluid-cloudnative/fluid), observed 2026-06-24). The CNCF blog rounds this to "1.9k stars".
- Contributors: the CNCF blog cites 979 (DevStats, all-time including docs); the GitHub contributors API shows roughly 480 (observed 2026-06-24).
- Releases: the CNCF blog cites 28 releases; the latest tag is `v1.0.8` (2025-10-31).
- Maturity: moved to CNCF Incubating on 2026-01-08 ([CNCF project page](https://www.cncf.io/projects/fluid/)).

## Ecosystem

Fluid integrates with cache and storage engines rather than competing with them: Alluxio, JuiceFS, JindoFS/JindoCache (Alibaba), Vineyard (in-memory intermediate data), EFC (Alibaba elastic file cache), and 3FS or Curvine via `ThinRuntime`. Under-file-system backends include S3, OSS, HDFS, and NFS. On the Kubernetes side it works with the scheduler (data affinity), CSI, and Prometheus for metrics, and is commonly paired with AI training job managers such as Arena and KubeDL.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Raw Alluxio or JuiceFS, self-operated | You run and tune the cache engine yourself; Fluid wraps these in CRDs and adds data-affinity scheduling and a multi-engine abstraction. |
| Cloud CSI drivers (EFS, FSx, OSS) | They provide persistent storage; Fluid's value is node-local caching of remote data plus scheduling, not being the store of record. |
| CubeFS, Rook/Ceph | These are distributed storage systems (the system of record); Fluid is an orchestration layer that accelerates access to data living elsewhere. |

# Adoption & Ecosystem

## Who uses it

The names below are taken from the project's [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md). They are self-reported by the project rather than independent case studies.

| Organisation | Use case | Source |
| --- | --- | --- |
| Huawei Cloud | Intelligent EdgeFabric (IEF) edge service | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |
| China Unicom | WoCloud edge offering | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |
| Raisecom Technology | Factory worker-safety AI monitoring, designed with China Telecom Research Institute | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |
| KubeSphere | Edge support in the platform | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |
| DaoCloud | Edge support in the platform | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |
| XingHai IoT | Smart campus, 741 projects across 80 Chinese cities | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |

ADOPTERS.md also lists Two Win, PITS, jylink, ICTNJ, and Jingying Shuzhi.

## Adoption signals

At graduation on 2024-10-15 the CNCF reported maintainers from 15 organisations and over 1,600 contributors from more than 110 organisations across 35+ countries ([CNCF announcement](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/)). That 1,600+ figure is a broad CNCF count, not code committers. Measured from the repository on 2026-06-22, GitHub showed roughly 309 code contributors, 7,485 stars, and 1,951 forks ([kubeedge/kubeedge](https://github.com/kubeedge/kubeedge)). Releases follow a roughly quarterly minor cadence, with v1.23.0 published 2026-03-11 ([releases](https://github.com/kubeedge/kubeedge/releases)).

## Ecosystem

KubeEdge runs on top of upstream Kubernetes (vendored; the v1.22 line built against Kubernetes v1.31.12). It connects IoT devices through an MQTT broker via the `eventbus` module, and new device protocols can be added through the mapper framework under `staging/src/github.com/kubeedge/mapper-framework`. Platforms including KubeSphere and DaoCloud package KubeEdge as their edge layer (per ADOPTERS.md).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| K3s (SUSE/Rancher) | Ships a full but trimmed Kubernetes that runs as-is at the edge; no built-in offline-first split control plane or device CRDs. |
| OpenYurt (CNCF, Alibaba origin) | Closest competitor, also focused on node and edge autonomy; KubeEdge goes further into MQTT and Device CRD based IoT management. |
| Akri (CNCF) | Focused only on discovering leaf devices at the edge; overlaps with KubeEdge's devicetwin/mapper but with a narrower scope. |
| SuperEdge | Another edge Kubernetes distribution with a similar node-autonomy goal. |

Pick KubeEdge when nodes go offline and you also manage physical devices. Pick K3s when you want a normal smaller Kubernetes with stable connectivity. Pick OpenYurt when you want edge autonomy without the device-management surface.

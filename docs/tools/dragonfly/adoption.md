# Adoption & Ecosystem

## Who uses it

The repository's `ADOPTERS.md` lists the organizations below. Each entry comes from that file ([source 1](https://github.com/dragonflyoss/dragonfly)).

| Organisation | Use case | Source |
| --- | --- | --- |
| Alibaba Group | Large-scale image and file distribution | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Ant Group | Large-scale image and file distribution | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| DiDi | Large-scale image and file distribution | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Kuaishou | Large-scale image and file distribution | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Bilibili | Large-scale image and file distribution | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| JFrog | Image and file distribution | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Datadog | Image distribution with lazy loading | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Google Cloud | Click-to-deploy / GKE Marketplace integration | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Volcano Engine | VKE / Container Registry integration | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Baidu AI Cloud | CCE integration | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Alibaba Cloud | ACK P2P acceleration | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |

`ADOPTERS.md` lists more organizations, including miHoYo, Xiaomi, Qunar, Yahoo, Meituan, JD, NetEase, Huawei, Shopee, China Unicom, ZTE, iQIYI, and Lazada.

## Adoption signals

At graduation on 2025-10-28 the project reported contributions from 130 companies and 271 people across roughly 26,000 commits ([source 5](https://thenewstack.io/cncf-dragonfly-speeds-container-model-sharing-with-p2p/)). As observed on 2026-06-22 via the GitHub API, `dragonflyoss/dragonfly` had 3,212 stars, 406 forks, and 26 open issues, with about 105 non-anonymous contributors ([source 1](https://github.com/dragonflyoss/dragonfly)). CNCF Graduated status was confirmed on the CNCF project page ([source 3](https://www.cncf.io/projects/dragonfly/)).

## Ecosystem

Dragonfly integrates as a containerd or Docker registry mirror and as a Harbor-fronted distribution path. It works with Nydus for lazy image loading, and it natively handles Hugging Face and ModelScope model sources ([source 8](https://www.cncf.io/blog/2026/04/06/peer-to-peer-acceleration-for-ai-model-distribution-with-dragonfly/)). The project ships a Helm chart (`dragonflyoss/helm-charts`) and a console (`dragonflyoss/console`), and the data-plane client lives in `dragonflyoss/client`.

## Alternatives

Dragonfly distributes arbitrary artifacts, files, images, and AI models, and optimizes parent selection with a central scheduler that builds a DAG per task. The cost is operating several components. The alternatives below trade some of that range for simpler operation.

| Alternative | Differs by |
| --- | --- |
| [Uber Kraken](https://github.com/uber/kraken) | BitTorrent-based; the tracker only mediates the connection graph while peers transfer data. Scales for large blobs, but development has been quiet since 2020. |
| [Spegel](https://spegel.dev/docs/architecture/) | Stateless; reuses containerd's existing cache and discovers peers with a Kademlia DHT over libp2p. Built into K3s and RKE2, but scoped to a cluster-local containerd mirror. |

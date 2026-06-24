# Adoption & Ecosystem

## Who uses it

The named adopters below are cited from Linkerd's own adopters page (source 7), the in-repo `ADOPTERS.md` (source 8), and a 2025 case study (source 14). The list is large, so this is a sample, not the full set.

| Organisation | Use case | Source |
| --- | --- | --- |
| Adidas | Production service mesh on Kubernetes | [ADOPTERS.md](https://github.com/linkerd/linkerd2/blob/main/ADOPTERS.md) |
| AT&T | Production adopter | [ADOPTERS.md](https://github.com/linkerd/linkerd2/blob/main/ADOPTERS.md) |
| Docker | Production adopter | [ADOPTERS.md](https://github.com/linkerd/linkerd2/blob/main/ADOPTERS.md) |
| Xbox Cloud Gaming | Case study on Linkerd's adopters page | [Adopters](https://linkerd.io/community/adopters/) |
| Nordstrom | Case study on Linkerd's adopters page | [Adopters](https://linkerd.io/community/adopters/) |
| DB Schenker AG | Case study on Linkerd's adopters page | [Adopters](https://linkerd.io/community/adopters/) |
| Imagine Learning | Reported over 80% compute reduction and a 97% drop in mesh-related CVEs in 2024 | [InfoQ](https://www.infoq.com/news/2025/09/linkerd-cost-savings/) |
| H-E-B | Reference customer cited in the CNCF graduation announcement | [CNCF](https://www.cncf.io/announcements/2021/07/28/cloud-native-computing-foundation-announces-linkerd-graduation/) |

## Adoption signals

Measured on the `linkerd/linkerd2` repository on 2026-06-22 (source 5): about 11,421 GitHub stars, 1,354 forks, and 214 open issues. The repository was created on 2017-12-04 and its primary language is Go. The GitHub contributors API lists roughly 377 contributors. CNCF reported that Linkerd grew 118% in Europe and North America in 2021, surpassing Istio adoption in those regions (source 9).

## Ecosystem

Linkerd integrates with the Kubernetes Gateway API and with Prometheus and Grafana for metrics through its `viz` extension (source 12). It installs via the `linkerd` CLI or via the `linkerd-crds` and `linkerd-control-plane` Helm charts, and is commonly delivered through Flux or Argo for GitOps. Buoyant offers the commercial Buoyant Enterprise for Linkerd distribution and the Buoyant Cloud management plane. A third-party security audit was conducted in 2024 and published in 2025 (source 10).

## Alternatives

Linkerd's defining difference is its data plane: a purpose-built Rust micro-proxy (`linkerd2-proxy`) rather than Envoy, aimed at low latency, low memory, and memory safety, with mTLS on by default and CLI-driven operation (sources 12, 13).

| Alternative | Differs by |
| --- | --- |
| Istio | Uses Envoy (C++) as the data plane and has the broadest feature set; heavier to operate. Recent ambient mode (ztunnel plus waypoint) moves away from per-pod sidecars (source 12). |
| Cilium Service Mesh | Processes traffic in the kernel with eBPF and avoids sidecars in many cases; runs Envoy per node for L7 (source 12). |
| Consul Connect | HashiCorp's mesh, with multi-platform (non-Kubernetes) reach (source 12). |
| Kuma / Kong Mesh | Envoy-based mesh from the Kong ecosystem (source 12). |

## Sources

- Source 1: [CNCF Announces Linkerd Graduation](https://www.cncf.io/announcements/2021/07/28/cloud-native-computing-foundation-announces-linkerd-graduation/)
- Source 5: [linkerd/linkerd2 (control plane and CLI)](https://github.com/linkerd/linkerd2)
- Source 7: [Linkerd 2.x Adopters & Case Studies](https://linkerd.io/community/adopters/)
- Source 8: [ADOPTERS.md (linkerd2)](https://github.com/linkerd/linkerd2/blob/main/ADOPTERS.md)
- Source 9: [Linkerd surpasses Istio adoption with 118% growth in 2021](https://www.cncf.io/blog/2022/03/04/linkerd-surpasses-istio-adoption-in-europe-and-north-america-with-118-growth-in-2021/)
- Source 10: [Linkerd 2024 Security Audit](https://linkerd.io/2025/02/18/linkerd-2024-security-audit/)
- Source 12: [Linkerd vs Istio (Buoyant)](https://www.buoyant.io/linkerd-vs-istio)
- Source 13: [What is a service mesh? (linkerd.io)](https://linkerd.io/what-is-a-service-mesh/)
- Source 14: [Imagine Learning highlights Linkerd cost savings (InfoQ)](https://www.infoq.com/news/2025/09/linkerd-cost-savings/)

# Linkerd

> A Kubernetes service mesh that adds mTLS, traffic metrics, and reliability to pod-to-pod traffic through a lightweight Rust sidecar proxy.

- **Category**: Service Mesh & Networking
- **CNCF maturity**: Graduated
- **Language**: Go (control plane and CLI) and Rust (policy controller and data plane proxy)
- **License**: Apache-2.0
- **Repository**: [linkerd/linkerd2](https://github.com/linkerd/linkerd2)
- **Documented at commit**: `7977d50` (near tag `edge-26.6.3`)

## What it is

Linkerd is a service mesh for Kubernetes. It runs a small proxy next to each meshed pod and routes that pod's TCP traffic through the proxy. Once traffic flows through the proxies, the mesh gives you mutual TLS between pods, golden metrics (success rate, request rate, latency), retries, and traffic splitting without changing application code.

The project spans two repositories. The control plane and the `linkerd` CLI live in `linkerd/linkerd2` (Go, with a Rust policy controller). The data plane proxy lives in `linkerd/linkerd2-proxy`, a purpose-built micro-proxy written in Rust (source 6). The defining choice is that proxy: Linkerd does not use Envoy. It ships a small Rust proxy aimed at low latency, low memory, and memory safety (sources 12, 13).

Linkerd was the project that introduced the term "service mesh" (sources 4, 13). It joined the CNCF in 2017 and became the first service mesh to reach Graduated status in 2021 (sources 1, 2).

## When to use it

- You run on Kubernetes and want mTLS between services turned on by default with minimal configuration.
- You want golden metrics and traffic-level reliability (retries, timeouts, traffic splits) without editing application code.
- You value a small operational surface: a CLI-driven install, a compact codebase, and a proxy that needs no per-workload tuning.
- It is a weaker fit if you need the full breadth of Istio's feature set or non-Kubernetes workloads, since Linkerd is Kubernetes-focused.
- It is a weaker fit if you want sidecar-free, kernel-level networking, where Cilium's eBPF model is the closer match (source 12).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

- Source 1: [CNCF Announces Linkerd Graduation](https://www.cncf.io/announcements/2021/07/28/cloud-native-computing-foundation-announces-linkerd-graduation/)
- Source 2: [Announcing Linkerd's Graduation (linkerd.io)](https://linkerd.io/2021/07/28/announcing-cncf-graduation/)
- Source 3: [Linkerd (CNCF projects page)](https://www.cncf.io/projects/linkerd/)
- Source 4: [Linkerd Joins the CNCF (2017)](https://linkerd.io/2017/01/24/linkerd-joins-the-cloud-native-computing-foundation/)
- Source 5: [linkerd/linkerd2 (control plane and CLI)](https://github.com/linkerd/linkerd2)
- Source 6: [linkerd/linkerd2-proxy (Rust data plane)](https://github.com/linkerd/linkerd2-proxy)
- Source 7: [Linkerd 2.x Adopters & Case Studies](https://linkerd.io/community/adopters/)
- Source 8: [ADOPTERS.md (linkerd2)](https://github.com/linkerd/linkerd2/blob/main/ADOPTERS.md)
- Source 9: [Linkerd surpasses Istio adoption with 118% growth in 2021](https://www.cncf.io/blog/2022/03/04/linkerd-surpasses-istio-adoption-in-europe-and-north-america-with-118-growth-in-2021/)
- Source 10: [Linkerd 2024 Security Audit](https://linkerd.io/2025/02/18/linkerd-2024-security-audit/)
- Source 11: [CNCF TAG Contributor Strategy: Linkerd governance review (#648)](https://github.com/cncf/tag-contributor-strategy/issues/648)
- Source 12: [Linkerd vs Istio (Buoyant)](https://www.buoyant.io/linkerd-vs-istio)
- Source 13: [What is a service mesh? (linkerd.io)](https://linkerd.io/what-is-a-service-mesh/)
- Source 14: [Imagine Learning highlights Linkerd cost savings (InfoQ)](https://www.infoq.com/news/2025/09/linkerd-cost-savings/)

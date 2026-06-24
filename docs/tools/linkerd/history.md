# History

## Origin

Linkerd was built at Buoyant by William Morgan and Oliver Gould starting around 2015 to 2016. It drew on Finagle, the Scala/JVM RPC library that ran at Twitter, and reframed those patterns as a standalone networking layer for microservices. Linkerd was the project that put the term "service mesh" into common use (sources 4, 13).

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Linkerd 1.x released by Buoyant, built on the JVM (sources 4, 13) |
| 2017 | Joins the CNCF, the fifth hosted project after Kubernetes, Prometheus, OpenTracing, and Fluentd (source 4) |
| 2018 | Full rewrite as Linkerd 2.x; data plane becomes a Rust micro-proxy, the first CNCF project to adopt Rust (sources 1, 6) |
| 2018 | Accepted into the CNCF Incubating tier (source 3) |
| 2021 | Reaches CNCF Graduated status, the first service mesh to graduate (sources 1, 2) |
| 2024 | Third-party security audit conducted, results published February 2025 (source 10) |

## How it evolved

The defining shift was the 1.x to 2.x rewrite in 2018. Linkerd 1.x was JVM-based and heavy. The 2.x line replaced the data plane with `linkerd2-proxy`, a purpose-built micro-proxy written in Rust, which made Linkerd the first CNCF project to ship Rust (sources 1, 6). This is the source of Linkerd's reputation for low latency and small memory footprint, since the proxy is not a general-purpose Envoy build.

CNCF reported that Linkerd grew 118% in Europe and North America in 2021, surpassing Istio adoption in those regions (source 9). In 2024 the CNCF TAG Contributor Strategy ran a governance review and confirmed vendor neutrality (source 11).

## Where it stands now

Linkerd ships on a fast-moving edge release channel; this deep-dive is pinned near tag `edge-26.6.3`. The control plane and CLI are developed in `linkerd/linkerd2` (source 5) and the data plane proxy in `linkerd/linkerd2-proxy` (source 6). Buoyant remains the primary commercial backer, offering Buoyant Enterprise for Linkerd and Buoyant Cloud, while the project stays CNCF Graduated with a confirmed neutral governance model (sources 3, 11).

## Sources

- Source 1: [CNCF Announces Linkerd Graduation](https://www.cncf.io/announcements/2021/07/28/cloud-native-computing-foundation-announces-linkerd-graduation/)
- Source 2: [Announcing Linkerd's Graduation (linkerd.io)](https://linkerd.io/2021/07/28/announcing-cncf-graduation/)
- Source 3: [Linkerd (CNCF projects page)](https://www.cncf.io/projects/linkerd/)
- Source 4: [Linkerd Joins the CNCF (2017)](https://linkerd.io/2017/01/24/linkerd-joins-the-cloud-native-computing-foundation/)
- Source 5: [linkerd/linkerd2 (control plane and CLI)](https://github.com/linkerd/linkerd2)
- Source 6: [linkerd/linkerd2-proxy (Rust data plane)](https://github.com/linkerd/linkerd2-proxy)
- Source 9: [Linkerd surpasses Istio adoption with 118% growth in 2021](https://www.cncf.io/blog/2022/03/04/linkerd-surpasses-istio-adoption-in-europe-and-north-america-with-118-growth-in-2021/)
- Source 10: [Linkerd 2024 Security Audit](https://linkerd.io/2025/02/18/linkerd-2024-security-audit/)
- Source 11: [CNCF TAG Contributor Strategy: Linkerd governance review (#648)](https://github.com/cncf/tag-contributor-strategy/issues/648)
- Source 13: [What is a service mesh? (linkerd.io)](https://linkerd.io/what-is-a-service-mesh/)

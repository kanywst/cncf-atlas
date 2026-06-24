# Adoption & Ecosystem

## Who uses it

These organisations have a public Istio case study.

| Organisation | Use case | Source |
| --- | --- | --- |
| eBay | Istio underpins "Isolates", a production-like isolated test environment platform, at a scale of hundreds of thousands of containers | [case study](https://istio.io/latest/about/case-studies/ebay/) |
| Airbnb | Handles the majority of internal traffic on Istio, using the external control plane model, in production for five years | [case study](https://istio.io/latest/about/case-studies/airbnb/) |
| Salesforce | Pivoted from Envoy plus a homegrown control plane to Istio; is both an end user and a contributor | [case study](https://istio.io/latest/about/case-studies/salesforce/) |
| T-Mobile | Runs 100+ clusters and 100+ Istio instances for fraud detection, billing, sales, and APIs | [case study](https://istio.io/latest/about/case-studies/t-mobile/) |

## Adoption signals

- GitHub: 38,237 stars, 8,329 forks, 471 open issues (gh API, 2026-06-22).
- Contributors: over 1,400 including anonymous (contributors API, last page 1432, 2026-06-22).
- CNCF surveys have reported Istio as the most adopted service mesh ([CNCF blog](https://www.cncf.io/blog/2022/09/28/istio-sails-into-the-cloud-native-computing-foundation/)).
- The project reports the control plane and sidecar container images each passing 10B+ downloads on Docker Hub ([Happy 7th Birthday](https://istio.io/latest/blog/2024/happy-7th-birthday/)).
- Release cadence is a regular minor line; latest tag at the documented commit is 1.30.1.

## Ecosystem

Istio sits in a stack of CNCF projects. Envoy is the data-plane proxy. SPIFFE is the workload identity model behind its certificates. The Kubernetes Gateway API grew out of Istio's traffic management model. Prometheus, Grafana, and Jaeger provide the metrics, dashboards, and tracing the mesh feeds. Commercial distributions from Tetrate and Solo.io add FIPS and other compliance packaging.

## Alternatives

Istio's draw is the most mature L7 traffic management (header routing, fault injection, mirroring, rate limiting), ambient mode giving sidecarless operation with opt-in L7, and SPIFFE-based identity. The trade-offs against the main alternatives:

| Alternative | Differs by |
| --- | --- |
| [Linkerd](https://www.solo.io/topics/istio/linkerd-vs-istio) | Purpose-built Rust micro-proxy; lighter control plane (200-300MB vs istiod's 1-2GB), but sidecar-only; 2024 Buoyant license change disrupted OSS use |
| [Cilium](https://istio.io/latest/blog/2024/ambient-vs-cilium/) | eBPF in-kernel processing tied to the CNI; L4 in the kernel where Istio ambient uses user-space ztunnel. Istio's own benchmarks claim user-space can win once L7 and encryption are added, though these are vendor benchmarks |
| Consul Connect | Multi-platform reach beyond Kubernetes and strong service discovery; Envoy data plane by default |

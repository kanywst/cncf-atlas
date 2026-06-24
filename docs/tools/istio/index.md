# Istio

> A service mesh that puts a programmable proxy next to every workload, so traffic management, mTLS, and telemetry live outside application code.

- **Category**: Service Mesh & Networking
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [istio/istio](https://github.com/istio/istio)
- **Documented at commit**: `58e9892` (2026-06-20, master)

## What it is

Istio is a service mesh. It has a control plane, `istiod`, written in Go, and a data plane of proxies that sit in the request path. The control plane watches Kubernetes and Istio configuration, computes per-proxy config, and ships it to the proxies over xDS, the gRPC discovery protocol Envoy speaks.

The traditional data plane is an Envoy sidecar injected into each pod. The newer ambient mode drops the per-pod sidecar: a per-node Rust proxy called ztunnel handles L4 mTLS and routing, and a waypoint Envoy is added per namespace or service only when L7 features are needed. Both modes are driven by the same `istiod` over xDS.

The point of the mesh is to move concerns out of application code. Mutual TLS between services, request routing, retries, traffic mirroring, and telemetry are configured declaratively and enforced by the proxy. The application keeps making plain calls.

## When to use it

- You run many services on Kubernetes and want mTLS between them without changing application code.
- You need L7 traffic control: header-based routing, canary splits, fault injection, mirroring.
- You want uniform metrics, traces, and access logs across services written in different languages.
- You want a workload identity model (SPIFFE) and a CA that issues short-lived certificates.

When it is the wrong tool:

- A handful of services with no mTLS or fine-grained routing requirement. The control plane and per-proxy overhead are not worth it.
- You only need L4 connectivity and policy that a CNI can already enforce in the kernel.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [istio/istio source, commit 58e9892](https://github.com/istio/istio)
2. [How the Istio Service Mesh Became Critical Infrastructure (Tetrate)](https://tetrate.io/blog/how-the-istio-service-mesh-became-critical-infrastructure-for-cloud-native-applications)
3. [CNCF reaffirms Istio maturity with project graduation](https://www.cncf.io/announcements/2023/07/12/cloud-native-computing-foundation-reaffirms-istio-maturity-with-project-graduation/)
4. [Istio sails into the CNCF (Incubating)](https://www.cncf.io/blog/2022/09/28/istio-sails-into-the-cloud-native-computing-foundation/)
5. [Istio graduates (TechCrunch)](https://techcrunch.com/2023/07/12/istio-graduates/)
6. [Istio: The Highest-Performance Solution for Network Security (ambient GA)](https://istio.io/latest/blog/2025/ambient-performance/)
7. [Ambient vs Cilium benchmark](https://istio.io/latest/blog/2024/ambient-vs-cilium/)
8. [Happy 7th Birthday, Istio!](https://istio.io/latest/blog/2024/happy-7th-birthday/)
9. [Istio case studies](https://istio.io/latest/about/case-studies/)
10. [eBay case study](https://istio.io/latest/about/case-studies/ebay/)
11. [Airbnb case study](https://istio.io/latest/about/case-studies/airbnb/)
12. [Salesforce case study](https://istio.io/latest/about/case-studies/salesforce/)
13. [T-Mobile case study](https://istio.io/latest/about/case-studies/t-mobile/)
14. [Istio getting started](https://istio.io/latest/docs/setup/getting-started/)
15. [Linkerd vs Istio (Solo.io)](https://www.solo.io/topics/istio/linkerd-vs-istio)

# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS.md` file. Only adopters with a citable source are listed here.

| Organisation | Use case | Source |
| --- | --- | --- |
| Lyft | Origin and production operator; all edge and service-to-service traffic runs through Envoy. | [How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f) |
| Google, Apple, Microsoft, eBay | Engineers from these companies moved to adopt Envoy soon after the open-source release. | [5 years of Envoy OSS](https://mattklein123.dev/2021/09/14/5-years-envoy-oss/) |
| Istio | Uses Envoy as its data plane; istiod configures each Envoy over xDS (LDS/RDS/CDS/EDS/SDS). | [Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/) |

## Adoption signals

As of 2026-06-22 the repository shows 28,455 GitHub stars and 5,442 forks (`gh api repos/envoyproxy/envoy`). The CNCF project page reports 8,444 contributors and a health score of 84 ([CNCF project page](https://www.cncf.io/projects/envoy/), 2026-06-22). Envoy graduated from the CNCF on 2018-11-28, the third project to do so.

## Ecosystem

Envoy is the shared proxy core for a range of higher-level systems. Istio uses it for both sidecar and ambient data planes. Envoy Gateway implements the Kubernetes Gateway API on top of Envoy, and Contour and Emissary-ingress use it as an ingress data plane. AWS App Mesh and gRPC interoperate with it. Extensions can be written in C++, or at request time through WebAssembly (proxy-wasm) and Lua.

## Alternatives

Envoy's differentiator is the universal data plane API (xDS v3): it makes the proxy a generic component a control plane drives, which is why so many meshes and ingress projects reuse it.

| Alternative | Differs by |
| --- | --- |
| NGINX / HAProxy | Fast, but configuration is largely static and reload-based; Envoy centres on dynamic xDS config and hot restart. |
| Traefik | Go, Kubernetes-native, easy to adopt; Envoy goes deeper on L7 features and has a wider xDS ecosystem. |
| linkerd2-proxy | Lightweight Rust sidecar tied to Linkerd; Envoy is a general-purpose data plane independent of any one mesh. |

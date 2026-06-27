# Adoption & Ecosystem

## Who uses it

The named adopters below come from the project's `ADOPTERS.md` (source [6]), which is self-reported through issue #748. Treat it as a list of organisations that registered, not as independently verified case studies. The clearest first-party adopter is Baidu, where the engine originated and runs in production (source [2]). A representative selection from the file:

| Organisation | Use case | Source |
| --- | --- | --- |
| Baidu | Origin of BFE; production traffic platform | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (source [6]) |
| Shenzhen Stock Exchange | Listed adopter | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (source [6]) |
| China Merchants Bank | Listed adopter | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (source [6]) |
| Postal Savings Bank of China | Listed adopter | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (source [6]) |
| State Grid | Listed adopter | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (source [6]) |
| Sichuan Airlines | Listed adopter | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (source [6]) |

Other entries in the file include CCTV, China Life, SPD Bank, Yillion Bank, Duxiaoman Financial, Haier, USTC, and 360.

## Adoption signals

GitHub signals from the repository API, observed 2026-06-26 (source [3]):

- Stars: 6,249
- Forks: 942
- Contributors: roughly 102 non-anonymous (about 115 including anonymous)
- Commits on `develop`: roughly 1,227
- Latest release: v1.8.2, published 2026-05-08

The project is a CNCF Sandbox member, accepted 2020-06-25 (source [1]).

## Ecosystem

The control plane and adjacent tooling live in separate repositories under the bfenetworks organisation (source [7]):

- API-Server: stores, generates, and validates configuration.
- Conf-Agent: pulls the latest configuration and triggers a reload on the server.
- Dashboard: a GUI for managing configuration.
- ingress-bfe: a Kubernetes Ingress controller backed by BFE.

The README lists integration targets (source [2]): Kubernetes via ingress-bfe, Prometheus for built-in metrics, Jaeger for distributed tracing through `mod_trace`, and Fluentd for logs. BFE is typically deployed behind an L4 load balancer.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Envoy (CNCF Graduated) | C++; dynamic xDS configuration; the de facto service-mesh data plane. Broader, but more complex to configure |
| NGINX / OpenResty | C with Lua scripting; the most widely deployed proxy. BFE extends with compiled Go modules instead of Lua |
| HAProxy | C; a high-performance load balancer focused on L4 and L7 proxying |
| Traefik | Go; cloud-native auto-discovery, the closest peer for Go and Kubernetes users |
| Emissary-ingress / Contour | Envoy-based Kubernetes API gateways; the most direct cloud-native comparison |

Pick BFE when you want content-based routing expressed as conditions, two-stage GSLB plus SLB load balancing in the core, and Go-module extensibility. Pick Envoy when you need a large ecosystem and dynamic xDS, or NGINX when a simpler static proxy is enough.

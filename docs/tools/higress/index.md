# Higress

> Higress is an API gateway that turns Kubernetes Ingress and nginx-style annotations into Envoy configuration by embedding a forked Istio Pilot, and adds a Wasm plugin layer for traffic, microservice, and AI use cases.

- **Category**: API Gateway
- **CNCF maturity**: Sandbox (announced 2026-03-25)
- **Language**: Go (control plane, `go 1.24.4`); Envoy data plane; Wasm plugins in Go, Rust, and JS
- **License**: Apache-2.0
- **Repository**: [higress-group/higress](https://github.com/higress-group/higress) (Go module path is still `github.com/alibaba/higress/v2`)
- **Documented at commit**: `bd9c4c5` (main, 2026-07-07, near tag `v2.2.3`)

## What it is

Higress is an API gateway built from two existing projects: Istio for the control plane and Envoy for the data plane. Most Ingress controllers read Kubernetes Ingress objects and program a proxy directly. Higress does not. It forks Istio's Pilot control plane, vendors it into the repository under `istio/`, and plugs its own translation layer in as a config source. That layer reads Kubernetes Ingress plus a set of nginx-compatible annotations and turns them into Istio configuration (VirtualService, Gateway, DestinationRule, and others). The embedded Pilot then compiles that configuration into Envoy's xDS API and pushes it to the Envoy data plane.

The practical effect is that route changes take effect without reloading a proxy process. An nginx-based Ingress controller reloads its config on change, which disrupts long-lived connections. Higress updates Envoy through xDS instead, so the data plane keeps running while routes change. The README, citing a Sealos migration writeup, claims route propagation roughly ten times faster than nginx Ingress on that workload.

On top of routing, Higress hosts a Wasm plugin layer. Plugins compiled to WebAssembly run inside Envoy's HTTP filter chain and implement features such as authentication, rate limiting, and an AI proxy that normalizes many LLM provider APIs to an OpenAI-compatible shape. The repository ships 59 Go Wasm extensions at the documented commit. Higress positions this as a single control plane covering three gateway roles: north-south traffic, east-west microservices (with service discovery from Nacos, Consul, Eureka, and ZooKeeper), and AI.

## When to use it

- You run Kubernetes Ingress with nginx annotations and want to move off nginx Ingress without rewriting your routing config: Higress reimplements about 25 nginx annotation families so the same objects keep working.
- You need route changes to apply without dropping long-lived connections (gRPC, WebSocket, streaming), where an nginx reload would hurt.
- You want an AI gateway in front of LLM providers: the `ai-proxy` plugin exposes many providers behind one OpenAI-compatible API, with caching and other AI-specific plugins alongside.
- You run microservices registered in Nacos, Consul, Eureka, or ZooKeeper and want one gateway to route to them alongside Kubernetes services.
- Less of a fit if you have no Istio or Envoy in play and want a small, single-binary proxy: Higress carries a forked Istio Pilot and Envoy, which is a heavier footprint than a standalone gateway.
- Less of a fit if you need full upstream Gateway API conformance as the primary interface; Higress supports Gateway API but leads with Ingress plus annotations and its Wasm and AI features.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a request flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [higress-group/higress (LICENSE, go.mod, tags)](https://github.com/higress-group/higress) (accessed 2026-07-09)
2. [Higress README](https://github.com/higress-group/higress/blob/main/README.md) (accessed 2026-07-09)
3. [Higress Joins CNCF: Delivering an enterprise-grade AI gateway (CNCF blog, 2026-03-25)](https://www.cncf.io/blog/2026/03/25/higress-joins-cncf-delivering-an-enterprise-grade-ai-gateway-and-a-seamless-path-from-nginx-ingress/) (accessed 2026-07-09)
4. [Higress ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md) (accessed 2026-07-09)
5. [CNCF Sandbox Projects listing](https://www.cncf.io/sandbox-projects/) (accessed 2026-07-09)
6. [Higress developer architecture docs](https://higress.cn/en/docs/latest/dev/architecture/) (accessed 2026-07-09)
7. [Sealos: Envoy vs Nginx for 2000 tenants (nginx-ingress to Higress migration)](https://sealos.io/blog/sealos-envoy-vs-nginx-2000-tenants) (accessed 2026-07-09)
8. [higress-group/higress repository signals (stars, forks, contributors)](https://github.com/higress-group/higress) (accessed 2026-07-09)

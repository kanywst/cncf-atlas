# Envoy

> An out-of-process L4/L7 proxy and universal data plane that gives polyglot microservices consistent networking, observability, and dynamic configuration.

- **Category**: Service Mesh & Networking
- **CNCF maturity**: Graduated
- **Language**: C++ (C++17/20; tooling in Go, Python, Rust, Starlark)
- **License**: Apache-2.0
- **Repository**: [envoyproxy/envoy](https://github.com/envoyproxy/envoy)
- **Documented at commit**: `6a45c7d` (near tag `v1.38.2`)

## What it is

Envoy is a proxy that runs alongside or in front of application services and handles their network traffic. It terminates and forwards connections at L4 (TCP/UDP) and parses application protocols at L7 (HTTP/1.1, HTTP/2, HTTP/3, gRPC), applying routing, load balancing, retries, rate limiting, and authorization along the way. It was built so that service networking logic lives in one place outside the application, instead of being reimplemented in a library per language.

The process is a single static binary with a fixed set of worker threads. The main thread owns configuration and lifecycle; workers each run their own event loop and handle connections without sharing locks. Configuration can be a static file or streamed at runtime through the xDS APIs, which is what lets a control plane reconfigure a fleet of Envoys without restarts.

Envoy is the data plane that many higher-level systems build on. Istio, Envoy Gateway, Contour, and Emissary-ingress all drive Envoy through xDS rather than writing their own proxy. The entry point is `source/exe/main.cc:16`, which hands off to `Envoy::MainCommon::main`.

## When to use it

- You run polyglot microservices and want one consistent networking, retry, and observability layer instead of per-language libraries.
- You need a data plane that a control plane can reconfigure dynamically over xDS without restarting the proxy.
- You are building a service mesh or API gateway and want a proven proxy core rather than writing your own.
- You need deep L7 features (HTTP/2 and HTTP/3, gRPC, header-based routing, outlier detection) at the edge or between services.

It is less of a fit when a static NGINX or HAProxy config already covers your needs, or when you want a single small dependency: Envoy is a large C++ binary with a learning curve around its configuration model.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [envoyproxy/envoy](https://github.com/envoyproxy/envoy), pinned at commit `6a45c7d9fee960d6457c44205faf6307157efc24` (2026-06-22).
2. [CNCF project page: Envoy](https://www.cncf.io/projects/envoy/) (2026-06-22).
3. [Envoy joins the CNCF (Matt Klein, Lyft Eng)](https://eng.lyft.com/envoy-joins-the-cncf-dc18baefbc22) (2026-06-22).
4. [5 years of Envoy OSS (Matt Klein)](https://mattklein123.dev/2021/09/14/5-years-envoy-oss/) (2026-06-22).
5. [How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f) (2026-06-22).
6. [Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/) (2026-06-22).
7. [Envoy GOVERNANCE.md](https://github.com/envoyproxy/envoy/blob/main/GOVERNANCE.md) (2026-06-22).
8. [Envoy quick start: run Envoy](https://www.envoyproxy.io/docs/envoy/latest/start/quick-start/run-envoy) (2026-06-22).
9. [Official Envoy documentation](https://www.envoyproxy.io/) (2026-06-22).

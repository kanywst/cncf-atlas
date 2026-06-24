# Dapr

> A sidecar runtime that gives any app portable building-block APIs for state, pub/sub, service invocation, secrets, and actors over HTTP or gRPC.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [dapr/dapr](https://github.com/dapr/dapr)
- **Documented at commit**: `9f2dcfd9` (2026-06-19, near `v1.18.1`)

## What it is

Dapr (Distributed Application Runtime) runs as a sidecar next to your application. Your code talks to the local sidecar over HTTP or gRPC, and the sidecar handles the distributed-systems work: calling another service by its app ID, persisting state, publishing and subscribing to messages, reading secrets, and running actors and workflows. The sidecar binary is `daprd` and its entry point is a single `app.Run()` call (`cmd/daprd/main.go:21`).

The features are grouped into building blocks. Each one maps to a field on the in-memory component registry (`pkg/runtime/compstore/compstore.go:42`): state stores, pub/sub, bindings, secret stores, locks, crypto, workflows, and conversation (LLM) components. A building block exposes a stable API while the concrete backend (Redis, Kafka, a cloud service) is swapped through configuration.

The single `dapr/dapr` repository ships both the data plane (the `daprd` sidecar) and the control plane (operator, injector, sentry, placement, scheduler). On Kubernetes the injector adds the sidecar to annotated pods; in self-hosted mode the CLI runs the sidecar alongside your process.

## When to use it

- You build microservices in more than one language and want one consistent API for state, messaging, and service-to-service calls instead of a separate SDK for each backend in each language.
- You want to defer the choice of state store or message broker to deployment time, swapping Redis for a cloud service without touching app code.
- You need the virtual-actor model or durable workflows without writing the placement and persistence machinery yourself.
- It is a weaker fit when you only need transparent L7 traffic routing and traffic splitting at the network layer; that is a service-mesh concern, and Dapr does not do it (source 9).
- It adds a process per app instance, so an extremely latency- or footprint-sensitive single-language monolith may not benefit.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [dapr/dapr](https://github.com/dapr/dapr) (pinned `9f2dcfd95ad44178d9553a08c181b0e6ea46232a`)
2. [dapr/community ADOPTERS.md](https://github.com/dapr/community/blob/master/ADOPTERS.md)
3. [CNCF announces Dapr graduation](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-dapr-graduation/)
4. [Dapr project page (CNCF)](https://www.cncf.io/projects/dapr/)
5. [Dapr joins CNCF Incubator](https://www.cncf.io/blog/2021/11/03/dapr-distributed-application-runtime-joins-cncf-incubator/)
6. [How Dapr has grown since its announcement (Microsoft Open Source Blog)](https://cloudblogs.microsoft.com/opensource/2020/04/29/distributed-application-runtime-dapr-growth-community-update/)
7. [Microsoft's Dapr open-source project hits 1.0 (TechCrunch)](https://techcrunch.com/2021/02/17/microsofts-dapr-open-source-project-hits-1-0/)
8. [How Grafana used Dapr to improve vulnerability scans (CNCF)](https://www.cncf.io/case-studies/grafana/)
9. [Dapr and service meshes (Dapr Docs FAQ)](https://docs.dapr.io/concepts/faq/service-mesh/)
10. [Dapr (Wikipedia)](https://en.wikipedia.org/wiki/Dapr)
11. [Dapr official site / testimonials](https://dapr.io/testimonials/)
12. [2025 State of Dapr Report (CNCF)](https://www.cncf.io/announcements/2025/04/01/cloud-native-computing-foundation-releases-2025-state-of-dapr-report-highlighting-adoption-trends-and-ai-innovations/)

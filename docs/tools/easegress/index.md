# Easegress

> Easegress is a Go traffic gateway that runs requests through a pipeline of filters, with configuration shared across an embedded etcd cluster for high availability.

- **Category**: API Gateway
- **CNCF maturity**: Sandbox (accepted 2023-12-19)
- **Language**: Go (`go 1.26`)
- **License**: Apache-2.0
- **Repository**: [easegress-io/easegress](https://github.com/easegress-io/easegress)
- **Documented at commit**: `3bdb192` (main, near tag `v2.11.0`, 2026-03-17)

## What it is

Easegress is a layer 7 traffic gateway. It sits in front of backend services and handles inbound requests: routing, load balancing, rate limiting, authentication, request and response transformation, and resilience such as circuit breaking and retries. It speaks HTTP, gRPC, and MQTT, and it can also act as a service mesh sidecar.

The core model is a pipeline of filters. A traffic gate (an HTTP server, for example) accepts a request, matches it to a route, and hands it to a pipeline. The pipeline runs the request through an ordered list of filters, and each filter returns a short result string. That result drives a jump table, so the pipeline is a small directed graph: a validator that returns `invalid` can send the request to a fallback filter, while an empty result means continue to the next filter. This makes traffic handling declarative and protocol independent.

Configuration lives in an etcd cluster that Easegress embeds in its own binary. There is no separate etcd process to run: each server node carries an `embed.Etcd`, elects a leader over Raft, and shares the same objects across the cluster. A single binary is both the data plane and the control plane, which keeps the operational surface small at the cost of bundling etcd into the process.

## When to use it

- You want one gateway to cover HTTP, gRPC, and MQTT traffic with a shared filter and routing model, rather than stitching together separate tools per protocol.
- You want declarative traffic orchestration where request handling branches on filter results (validate, then rate limit, then proxy, with fallbacks), expressed as configuration.
- You want a self-contained HA cluster without standing up an external configuration store, and you accept an embedded etcd inside the gateway binary.
- You need built-in resilience (circuit breaker, retry, time limiter) attached to the proxy rather than bolted on as separate hops.
- Not the right fit if you already run Envoy with an external control plane (Istio) and want the data plane configured over xDS; Easegress is self-configuring rather than xDS-driven.
- Not the right fit if you want the breadth of an established plugin marketplace; Easegress extends through Go filters and WebAssembly rather than a large third-party plugin ecosystem.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a request flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [easegress-io/easegress (GitHub repo)](https://github.com/easegress-io/easegress) (accessed 2026-07-08)
2. [Filter interface (`pkg/filters/filters.go`)](https://github.com/easegress-io/easegress/blob/main/pkg/filters/filters.go) (accessed 2026-07-08)
3. [Pipeline and FlowNode (`pkg/object/pipeline/pipeline.go`)](https://github.com/easegress-io/easegress/blob/main/pkg/object/pipeline/pipeline.go) (accessed 2026-07-08)
4. [go.mod (module path, Go version)](https://github.com/easegress-io/easegress/blob/main/go.mod) (accessed 2026-07-08)
5. [README (features, use cases, install)](https://github.com/easegress-io/easegress/blob/main/README.md) (accessed 2026-07-08)
6. [Easegress project page (CNCF, Sandbox, accepted 2023-12-19)](https://www.cncf.io/projects/easegress/) (accessed 2026-07-08)
7. [\[SANDBOX PROJECT ONBOARDING\] easegress (cncf/sandbox #193)](https://github.com/cncf/sandbox/issues/193) (accessed 2026-07-08)
8. [Easegress (MegaEase official product page)](https://megaease.com/easegress/) (accessed 2026-07-08)
9. [Releases (v1.0.0 = 2021-06-02)](https://github.com/easegress-io/easegress/releases) (accessed 2026-07-08)
10. [The Next Generation Service Gateway (MegaEase, CodeX)](https://medium.com/codex/the-next-generation-service-gateway-7cf4bd50c9bd) (accessed 2026-07-08)
11. [The New Version of Easegress (v2.0 announcement, MegaEase)](https://megaease.com/blog/2022/08/09/the-new-version-of-easegress/) (accessed 2026-07-08)
12. [Easegress in the Open Policy Agent Ecosystem](https://www.openpolicyagent.org/ecosystem/entry/easegress) (accessed 2026-07-08)

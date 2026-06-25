# Emissary-Ingress

> Kubernetes-native API gateway and ingress built on Envoy Proxy, driven entirely by CRDs.

- **Category**: API Gateway
- **CNCF maturity**: Incubating
- **Language**: Go and Python
- **License**: Apache-2.0
- **Repository**: [emissary-ingress/emissary](https://github.com/emissary-ingress/emissary)
- **Documented at commit**: `65b0dd9ae` (near tag `v4.0.1`, 2026-05-01)

## What it is

Emissary-Ingress is an ingress controller and API gateway for Kubernetes. It runs Envoy Proxy as the data plane and configures it from Kubernetes custom resources. You declare routing with `Listener`, `Host`, and `Mapping` resources, and Emissary turns them into Envoy configuration. Kubernetes is the source of truth; there is no separate database.

A single pod runs four cooperating pieces: a Go `entrypoint` process, a Python `diagd` configuration engine, an Envoy process, and a Go ADS server called `ambex`. The Go side watches the cluster and assembles a snapshot, the Python side compiles that snapshot into Envoy configuration, and `ambex` streams the result to Envoy over the xDS aggregated discovery service (ADS).

The open-source project is the core of the commercial Ambassador Edge Stack, which adds ACME/TLS automation, OAuth/OIDC, rate limiting, and a developer portal on top of the same engine.

## When to use it

- You want an Envoy-based edge gateway configured declaratively through CRDs rather than annotations.
- You need richer L7 control (header-based routing, traffic shifting, rate limiting hooks) than a plain NGINX ingress offers.
- You run high request volumes and want Envoy's dynamic xDS updates without restarting the proxy.
- It is a weaker fit when you already run a service mesh that ships its own gateway, or when a single minimal ingress binary is all you need.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [emissary-ingress/emissary (GitHub)](https://github.com/emissary-ingress/emissary)
2. [emissary-ingress (formerly Ambassador) is now a CNCF incubating project (CNCF)](https://www.cncf.io/blog/2021/04/13/emissary-ingress-formerly-ambassador-is-now-a-cncf-incubating-project/)
3. [CNCF Adopts Ambassador's API Gateway, Emissary Ingress (The New Stack)](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)
4. [Emissary-Ingress (CNCF projects)](https://www.cncf.io/projects/emissary-ingress/)
5. [Quick Start (emissary-ingress.dev 3.10)](https://emissary-ingress.dev/docs/3.10/quick-start/)
6. [Install with Helm (getambassador.io)](https://www.getambassador.io/docs/emissary/latest/topics/install/helm)
7. [Install manually / yaml-install (getambassador.io)](https://www.getambassador.io/docs/emissary/latest/topics/install/yaml-install)

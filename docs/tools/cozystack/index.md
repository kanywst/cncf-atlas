# Cozystack

> A framework for building a private cloud (managed Kubernetes, VMs, and databases) on bare metal, where every user-facing resource is a thin declaration that becomes a Flux HelmRelease.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [cozystack/cozystack](https://github.com/cozystack/cozystack)
- **Documented at commit**: `f5c408d` (main, 2026-06-27; nearest tag `v1.5.1`)

## What it is

Cozystack turns a set of bare-metal machines into a platform that offers managed Kubernetes clusters, virtual machines, and managed databases to internal or paying tenants. It is aimed at hosting providers and platform teams who want to run their own cloud instead of reselling a public one. Rather than inventing a new stack, it composes existing CNCF and Kubernetes projects: Talos Linux for the immutable OS, Flux for GitOps delivery, KubeVirt for VMs, Kamaji with Cluster API for tenant control planes, CloudNativePG for Postgres, LINSTOR and Piraeus for storage, and Cilium with Kube-OVN for networking (README, source 2).

The part that makes it a platform rather than a bundle is a single API surface. A tenant creates a `Postgres`, a `Kubernetes`, or a `VMInstance` object in their namespace, and the platform provisions the real thing. This API is served by `cozystack-api`, an aggregated Kubernetes apiserver that translates each of those objects into a Flux `HelmRelease` and lets Flux do the actual reconciliation (`pkg/registry/apps/application/rest.go:1605`). The catalog of what can be provisioned lives in Helm charts under `packages/apps/`, so adding a new managed service is a packaging task, not a Go change.

The result is an API that looks like a cloud REST API but is backed by Helm and GitOps underneath. Cozystack itself keeps no separate database of tenant resources; the Flux `HelmRelease` objects are the store of record.

## When to use it

- You run bare metal and want to offer managed Kubernetes, VMs, and DBaaS to tenants from one platform, with tenant isolation built in.
- You want the operational surface to stay within Kubernetes and Flux rather than a bespoke IaaS control plane.
- You want a curated, opinionated catalog of managed services (Postgres, ClickHouse, Kafka, and more) that you can extend by adding Helm charts.
- It is a weaker fit if you only need application delivery on an existing cluster; plain Flux or Argo CD is lighter for that.
- It is a weaker fit if you are on a public cloud already and do not need to build the IaaS layer yourself.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [cozystack/cozystack repository](https://github.com/cozystack/cozystack) (source, LICENSE, go.mod, Makefile), accessed 2026-06-26.
2. [cozystack/cozystack README.md](https://github.com/cozystack/cozystack/blob/main/README.md), accessed 2026-06-26.
3. [cozystack/cozystack ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md), accessed 2026-06-26.
4. [CNCF project page: Cozystack](https://www.cncf.io/projects/cozystack/), accessed 2026-06-26.
5. [Open Source PaaS Cozystack Becomes a CNCF Sandbox Project (CNCF)](https://www.cncf.io/blog/2025/04/28/open-source-paas-cozystack-becomes-a-cncf-sandbox-project/), accessed 2026-06-26.
6. [Cozystack Becomes a CNCF Sandbox Project (Andrei Kvapil, Ænix)](https://blog.aenix.io/cozystack-becomes-a-cncf-sandbox-project-3702b8906971), accessed 2026-06-26.
7. [Cozystack Getting Started](https://cozystack.io/docs/getting-started/), accessed 2026-06-26.
8. [GitHub REST API: repos/cozystack/cozystack](https://api.github.com/repos/cozystack/cozystack), accessed 2026-06-29.

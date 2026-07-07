# Clusternet

> Clusternet is a Kubernetes addon that manages many child clusters from a single parent cluster, letting you reach and deploy to them as if you were browsing the internet.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [clusternet/clusternet](https://github.com/clusternet/clusternet)
- **Documented at commit**: `e8b5a0c` (2026-05-10, `main` ahead of tag `v0.18.1`)

## What it is

Clusternet is a multi-cluster management addon. You run its control plane in one Kubernetes cluster (the parent), register any number of other clusters (children) into it, and from then on you schedule applications across all of them and reach each one with ordinary `kubectl`. The name is short for "Cluster Internet": the goal is to treat a fleet of clusters the way you treat the internet, reachable from one place regardless of where each cluster sits.

Two design choices set it apart. A shadow API in the parent lets you submit a plain `kubectl apply -f deployment.yaml` and have Clusternet turn it into multi-cluster distribution material, so you do not have to learn new resource types to start. A reverse WebSocket tunnel lets the parent run `kubectl` against a child that lives behind NAT (Network Address Translation) or a firewall, because the child dials out to the parent and the parent re-dials requests back through that tunnel.

It is a lightweight addon, not a distribution or a hosted control plane. The parent cluster runs four components: an aggregated API server, a scheduler, a controller manager, and an agent on each child. CRDs (Custom Resource Definitions) such as Subscription, Base, and Description model the distribution pipeline.

## When to use it

- You operate several Kubernetes clusters and want one place to deploy the same workload to many of them, either as a full copy per cluster or split by capacity.
- Some clusters sit behind NAT or a firewall and you still want `kubectl` and `client-go` access to them from a central cluster.
- You want to keep using existing manifests, Helm charts, and `kubectl` rather than adopting a new application model.
- It is a weaker fit when you only have one cluster, or when a single-vendor managed fleet already gives you cross-cluster deploys and you do not need the proxy or shadow API.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [clusternet/clusternet](https://github.com/clusternet/clusternet) (README, core features, contributors).
2. [Clusternet official site](https://clusternet.io).
3. [Introduction: four-component architecture](https://clusternet.io/docs/introduction/).
4. [CNCF Projects: Clusternet](https://www.cncf.io/projects/clusternet/) (Sandbox, accepted 2023-03-07).
5. [cncf/sandbox submission issue #10](https://github.com/cncf/sandbox/issues/10).
6. [GitHub REST API: clusternet/clusternet](https://api.github.com/repos/clusternet/clusternet).
7. [GitHub Releases](https://api.github.com/repos/clusternet/clusternet/releases).
8. [GitHub Contributors](https://api.github.com/repos/clusternet/clusternet/contributors).
9. [LICENSE (Apache-2.0)](https://github.com/clusternet/clusternet/blob/main/LICENSE).
10. [MAINTAINERS.md](https://github.com/clusternet/clusternet/blob/main/MAINTAINERS.md).
11. [Palark: CNCF Sandbox projects 2023 H1](https://palark.com/blog/cncf-sandbox-2023-h1/).
12. [rancher/remotedialer](https://github.com/rancher/remotedialer).

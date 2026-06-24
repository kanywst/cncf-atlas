# Dragonfly

> A peer-to-peer distribution system that accelerates delivery of container images, files, and AI models across large clusters.

- **Category**: Runtime
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [dragonflyoss/dragonfly](https://github.com/dragonflyoss/dragonfly)
- **Documented at commit**: `0041afa` (main, 2026-06-22)

## What it is

Dragonfly distributes large artifacts by turning the consumers into the distributors. When many machines need the same container image, file, or model weights, pulling each copy straight from the origin saturates the registry and the network. Dragonfly has each node fetch pieces from peers that already hold them, falling back to the origin only when needed. The origin then serves the data a small number of times instead of once per node.

This repository holds two Go control-plane services: the manager and the scheduler. The manager (`manager/`) owns dynamic configuration, cluster state, the console UI, and access control. The scheduler (`scheduler/`) decides, for each download, which peers a given node should pull pieces from. The actual data transfer runs in a separate client (`dfdaemon`/`dfget`), written in Rust in the `dragonflyoss/client` repository. The scheduler only returns instructions over gRPC.

Dragonfly began as an image-acceleration system at Alibaba Cloud and has grown to distribute any artifact, including Hugging Face and ModelScope model files. It sits below the container runtime as a registry mirror and pull accelerator, so workloads pull through Dragonfly without changing how they reference images.

## When to use it

- You run large clusters that repeatedly pull the same images or files, and the registry or cross-region bandwidth is the bottleneck.
- You distribute AI/ML model weights to many nodes and want peer sharing instead of every node hitting object storage.
- You want a registry mirror that works across registries and arbitrary file URLs, not one tied to a single runtime.
- It is a poor fit when your cluster is small or pulls are rare: the manager, scheduler, and seed-peer components add operating cost that only pays off at scale.
- If you only need a cluster-local containerd mirror with minimal moving parts, a lighter stateless option may suit better.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [dragonflyoss/dragonfly repository](https://github.com/dragonflyoss/dragonfly) (README, ADOPTERS, LICENSE, source), accessed 2026-06-22.
2. [Pinned commit `0041afa`](https://github.com/dragonflyoss/dragonfly/commit/0041afa00d64585052476d99b4b00a62111a88ed), accessed 2026-06-22.
3. [CNCF projects: Dragonfly](https://www.cncf.io/projects/dragonfly/), accessed 2026-06-22.
4. [CNCF blog: TOC votes to move Dragonfly into CNCF incubator](https://www.cncf.io/blog/2020/04/09/toc-votes-to-move-dragonfly-into-cncf-incubator/), accessed 2026-06-22.
5. [The New Stack: CNCF Dragonfly Speeds Container, Model Sharing with P2P](https://thenewstack.io/cncf-dragonfly-speeds-container-model-sharing-with-p2p/), accessed 2026-06-22.
6. [The New Stack: Dragonfly Brings Peer-to-Peer Image Sharing to Kubernetes](https://thenewstack.io/dragonfly-brings-peer-to-peer-image-sharing-to-kubernetes/), accessed 2026-06-22.
7. [Alibaba Cloud: P2P-Based Intelligent Image Acceleration System of Dragonfly](https://www.alibabacloud.com/blog/p2p-based-intelligent-image-acceleration-system-of-dragonfly_599645), accessed 2026-06-22.
8. [CNCF blog: Peer-to-Peer acceleration for AI model distribution with Dragonfly](https://www.cncf.io/blog/2026/04/06/peer-to-peer-acceleration-for-ai-model-distribution-with-dragonfly/), accessed 2026-06-22.
9. [Dragonfly Kubernetes quick start](https://d7y.io/docs/getting-started/quick-start/kubernetes/), accessed 2026-06-22.

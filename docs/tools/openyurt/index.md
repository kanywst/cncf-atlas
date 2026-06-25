# OpenYurt

> Extend a vanilla Kubernetes control plane to edge nodes with offline autonomy, keeping the upstream API intact.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache License 2.0
- **Repository**: [openyurtio/openyurt](https://github.com/openyurtio/openyurt)
- **Documented at commit**: `f01cbf5` (2026-06-22)

## What it is

OpenYurt extends a standard Kubernetes cluster to manage edge nodes. The control plane stays in the cloud, runs unmodified upstream Kubernetes, and manages edge nodes that sit across unreliable or intermittent networks. Edge nodes are grouped by physical region into a unit OpenYurt calls a `Pool` (`README.md:31-34`).

The defining choice is non-intrusiveness. OpenYurt does not fork or rewrite the Kubernetes control plane. It adds a per-node reverse proxy (YurtHub), a set of controllers and webhooks (Yurt-Manager), and optional agents for cross-region networking and IoT device bridging. The project states it "preserves intact Kubernetes API compatibility" (`README.md:24-25`).

The practical payoff is edge autonomy. When an edge node loses its link to the cloud apiserver, YurtHub serves cached responses from local disk so that kubelet and kube-proxy keep working and workloads keep running.

## When to use it

- You run a single Kubernetes control plane in the cloud and want to manage nodes in remote sites such as retail, factory, or telco edge over unreliable links.
- You need edge nodes to keep running workloads when the cloud connection drops.
- You want region-aware placement without rewriting the Kubernetes control plane.
- It is a weaker fit when all nodes share a reliable LAN with the control plane; the autonomy and pool machinery add little there.
- It is not a lightweight Kubernetes distribution. If you need a small single-binary cluster at the edge, a distro like k3s targets a different problem.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [openyurtio/openyurt repository](https://github.com/openyurtio/openyurt)
2. [OpenYurt Becomes a CNCF Incubating Project (CNCF blog, 2025-07-02)](https://www.cncf.io/blog/2025/07/02/openyurt-becomes-a-cncf-incubating-project/)
3. [CNCF project page: OpenYurt](https://www.cncf.io/projects/openyurt/)
4. [OpenYurt README](https://github.com/openyurtio/openyurt/blob/master/README.md)
5. [OpenYurt LICENSE (Apache 2.0)](https://github.com/openyurtio/openyurt/blob/master/LICENSE)
6. [OpenYurt docs: YurtHub core concept](https://openyurt.io/docs/next/core-concepts/yurthub)
7. [OpenYurt docs: installation summary](https://openyurt.io/docs/installation/summary)
8. [KubeEdge](https://kubeedge.io)

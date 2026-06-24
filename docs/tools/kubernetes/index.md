# Kubernetes

> A platform for running containers across many machines, where you declare the desired state and controllers drive the cluster toward it.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes)
- **Documented at commit**: `8c64324b` (master, 2026-06-22)

## What it is

Kubernetes runs containerized workloads on a pool of machines. You submit objects such as Pods, Deployments, and Services to an API server. The API server stores them in etcd, and a set of controllers continuously compares the desired state against the observed state and acts to close the gap. This reconcile loop is the core idea.

The control plane decides what should run where, and a per-node agent (the kubelet) makes it happen. A scheduler picks a node for each Pod, controllers manage higher level objects such as replica counts and rollouts, and the kubelet starts containers through a container runtime. Everything is declarative: you describe the end state, not the steps.

It sits below application frameworks and above raw compute. Cloud providers, networking, storage, and runtimes plug in through defined interfaces (CRI, CNI, CSI), so Kubernetes itself stays focused on the orchestration model rather than any single environment.

## When to use it

- You run more than a handful of containers and need scheduling, self-healing, and rollouts without scripting them by hand.
- You want a declarative API plus controllers so the system converges to a target state on its own.
- You need a portable substrate that works the same across clouds and on-premises through pluggable interfaces.
- You want to extend the platform with custom resources and controllers rather than fork it.

It is overkill for a single container on one host, or for a small static workload where a process manager or a managed serverless runtime would be simpler to operate.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes) (master, pinned `8c64324b`), accessed 2026-06-22.
2. [CNCF Projects: Kubernetes](https://www.cncf.io/projects/kubernetes/), accessed 2026-06-22.
3. [IBM: The History of Kubernetes](https://www.ibm.com/think/topics/kubernetes-history), accessed 2026-06-22.
4. [Google Cloud: The Kubernetes origin story](https://cloud.google.com/blog/products/containers-kubernetes/from-google-to-the-world-the-kubernetes-origin-story), accessed 2026-06-22.
5. [Wikipedia: Kubernetes](https://en.wikipedia.org/wiki/Kubernetes), accessed 2026-06-22.
6. [Kubernetes case study: Spotify](https://kubernetes.io/case-studies/spotify/), accessed 2026-06-22.
7. [Kubernetes case study: adidas](https://kubernetes.io/case-studies/adidas/), accessed 2026-06-22.

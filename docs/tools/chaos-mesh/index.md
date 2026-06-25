# Chaos Mesh

> A Kubernetes-native chaos engineering platform that injects faults into pods, networks, filesystems, and the kernel through custom resources.

- **Category**: Chaos Engineering
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [chaos-mesh/chaos-mesh](https://github.com/chaos-mesh/chaos-mesh)
- **Documented at commit**: `8c13a9f` (2026-06-22, after v2.8.3)

## What it is

Chaos Mesh runs controlled fault injection experiments on a Kubernetes cluster. You describe a fault as a custom resource, apply it with `kubectl`, and the platform injects the fault into the selected pods, then recovers them when the experiment ends. Faults include killing pods, adding network latency and packet loss, filling disks, stressing CPU and memory, skewing the clock, and injecting JVM and kernel failures.

The system has three parts. A controller-manager watches the chaos CRDs and decides what to inject. A privileged DaemonSet (`chaos-daemon`) runs on every node and performs the actual injection inside the target container's namespaces. A dashboard provides a web UI and API for designing and observing experiments.

It is built for teams who want to verify that distributed systems survive real failures: dropped packets, slow disks, clock drift, and dead nodes. It originated at PingCAP to test the TiDB distributed database and was donated to the CNCF.

## When to use it

- You run workloads on Kubernetes and want fault injection expressed as version-controlled CRDs that fit a GitOps flow.
- You need low-level faults that generic tools lack: clock skew (TimeChaos), kernel faults, JVM faults, and fine-grained IO faults.
- You want to validate distributed consensus, lock TTLs, retry logic, or failover under realistic network and node failures.
- It is a weaker fit when you are not on Kubernetes, or when you cannot run a privileged DaemonSet on your nodes.

## In this deep-dive

- [History](./history): origin at PingCAP, CNCF milestones, and why it exists.
- [Architecture](./architecture): the three components and how a reconcile flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the reconcile pipeline and the daemon injection path, read from source.
- [Getting Started](./getting-started): install with Helm and run a first experiment.

## Sources

1. chaos-mesh/chaos-mesh, GitHub repository: <https://github.com/chaos-mesh/chaos-mesh>
2. Pinned commit `8c13a9fb8d69a4299af99de9ddc9370c61ebf247`: <https://github.com/chaos-mesh/chaos-mesh/commit/8c13a9fb8d69a4299af99de9ddc9370c61ebf247>
3. Chaos Mesh moves to the CNCF Incubator: <https://www.cncf.io/blog/2022/02/16/chaos-mesh-moves-to-the-cncf-incubator/>
4. Announcing Chaos Mesh as a CNCF Sandbox Project (PingCAP): <https://www.pingcap.com/press-release/announcing-chaos-mesh-as-a-cncf-sandbox-project/>
5. Chaos Mesh project page (CNCF): <https://www.cncf.io/projects/chaosmesh/>

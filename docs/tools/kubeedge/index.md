# KubeEdge

> An edge computing framework that extends a Kubernetes control plane out to edge nodes and IoT devices over an unreliable network.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache License 2.0
- **Repository**: [kubeedge/kubeedge](https://github.com/kubeedge/kubeedge)
- **Documented at commit**: `864f45eb1` (89 commits after v1.23.0, 2026-06-22)

## What it is

KubeEdge splits a cluster into two planes. The cloud plane runs `cloudcore`, a control-plane process that sits next to a normal Kubernetes API server. The edge plane runs `edgecore`, a lightweight agent on each edge node that manages Pods and talks to local IoT devices. The two planes connect over a single WebSocket or QUIC channel and exchange messages across it.

Both processes are built from modules registered on Beehive, an in-tree messaging framework. A module declares a name, a group, and a restart policy, then communicates with other modules only through a message bus. This keeps the cloud controllers and the edge agent loosely coupled and lets either side run a different subset of modules.

The edge agent stores desired state in a local SQLite database, so an edge node keeps running its workloads when the link to the cloud drops. KubeEdge adds device management on top of plain workload orchestration: it models physical devices as Kubernetes custom resources and bridges them through an MQTT broker.

## When to use it

- You run Kubernetes workloads on nodes that lose connectivity to the control plane and must keep operating offline (edge autonomy).
- You manage IoT or field devices and want them as Kubernetes objects with a desired/reported state twin.
- Your edge hardware is too constrained for a full kubelet but can run a trimmed agent.
- It is a poor fit when every node has a stable, low-latency link to the API server; a standard cluster or a thin distribution is simpler then.
- It is also a poor fit when you only need a smaller Kubernetes and have no device or offline requirement.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [kubeedge/kubeedge (GitHub)](https://github.com/kubeedge/kubeedge)
2. [KubeEdge ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md)
3. [CNCF Announces KubeEdge Graduation](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/)
4. [KubeEdge has Graduated within the CNCF](https://kubeedge.io/blog/cncf-graduation-announcement/)
5. [KubeEdge v1.22 is live](https://kubeedge.io/blog/release-v1.22/)
6. [KubeEdge Releases](https://github.com/kubeedge/kubeedge/releases)
7. [Install KubeEdge with keadm](https://kubeedge.io/docs/setup/install-with-keadm)
8. [Huawei Cloud: KubeEdge Becomes a CNCF Graduated Project](https://www.huaweicloud.com/intl/en-us/news/20241018154136583.html)

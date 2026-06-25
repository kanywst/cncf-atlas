# OpenKruise

> A suite of Kubernetes controllers that extends the standard workloads and swaps a container image without recreating the Pod.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache License 2.0
- **Repository**: [openkruise/kruise](https://github.com/openkruise/kruise)
- **Documented at commit**: `439d98db` (master, tagged near `v1.9.0`, 2026-06-21)

## What it is

OpenKruise is a set of Kubernetes controllers and CRDs that replace and extend the built-in workload controllers. CloneSet, Advanced StatefulSet, and Advanced DaemonSet are supersets of the upstream Deployment, StatefulSet, and DaemonSet. They add in-place container image updates, partition-based canary rollouts, per-Pod PVC templates, parallel update windows, and deletion-cost control.

Its signature feature is in-place update. When a workload change is limited to the container `image` field (and, since v1.8, to resource requests via the resize subresource), OpenKruise patches the running Pod instead of deleting and recreating it. The kubelet restarts the container without rescheduling, so the change skips the scheduler, CNI, and CSI, and avoids PVC rebinding. This matters at large scale where Pod churn is expensive.

The project runs as two deployment units: a central `kruise-manager` that hosts the controllers and the admission webhook, and a per-node `kruise-daemon` DaemonSet that pre-pulls images, reports runtime container metadata, recreates containers, and runs Pod probes (`cmd/daemon/main.go:85`). In-place update only works because all three parts cooperate: the controller, the mutating webhook, and the daemon.

## When to use it

- You run large fleets where recreating Pods on every image bump is too slow or too disruptive.
- You need canary rollouts gated by partition or priority without bolting on a separate progressive-delivery tool.
- You want sidecar injection and independent sidecar upgrades (SidecarSet) decoupled from the main container lifecycle.
- You need workload primitives the upstream lacks: broadcast jobs, advanced cron jobs, image pre-pull jobs, resource distribution across namespaces.
- It is not a progressive-delivery engine. If your goal is metric-analyzed canary or blue-green with traffic shifting, Argo Rollouts or Flagger sit at a different layer (and Argo Rollouts can drive a CloneSet).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [openkruise/kruise (GitHub)](https://github.com/openkruise/kruise)
2. [Source tree at v1.9.0, pinned `439d98db`](https://github.com/openkruise/kruise/tree/v1.9.0)
3. [OpenKruise becomes a CNCF incubating project (CNCF blog)](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/)
4. [OpenKruise (CNCF projects page)](https://www.cncf.io/projects/openkruise/)
5. [OpenKruise: The Cloud-Native Platform for Alibaba's Double 11 (Alibaba Cloud)](https://www.alibabacloud.com/blog/openkruise-the-cloud-native-platform-for-the-comprehensive-process-of-alibabas-double-11_596966)
6. [OpenKruise v1.0, reaching new peaks of application automation (CNCF)](https://www.cncf.io/blog/2021/12/23/openkruise-v1-0-reaching-new-peaks-of-application-automation/)
7. [InPlace Update (OpenKruise docs)](https://openkruise.io/docs/core-concepts/inplace-update)
8. [CloneSet (OpenKruise docs)](https://openkruise.io/docs/user-manuals/cloneset)
9. [SidecarSet (OpenKruise docs)](https://openkruise.io/docs/user-manuals/sidecarset)
10. [Installation (OpenKruise docs)](https://openkruise.io/docs/installation)
11. [OpenKruise v1.7: SidecarSet Supports Native Kubernetes Sidecar Containers (Alibaba Cloud)](https://www.alibabacloud.com/blog/openkruise-v1-7-sidecarset-supports-native-kubernetes-sidecar-containers_601775)
12. [GitHub REST API repos/openkruise/kruise](https://api.github.com/repos/openkruise/kruise)
13. [Releases (v1.9.0, 2026-06-21)](https://github.com/openkruise/kruise/releases)

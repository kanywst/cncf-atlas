# Karmada

> Kubernetes-native control plane that propagates and schedules workloads across many clusters and clouds.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [karmada-io/karmada](https://github.com/karmada-io/karmada)
- **Documented at commit**: `658499d` (2026-06-22, master, near tag `v1.19.0-alpha.0`)

## What it is

Karmada runs a dedicated control plane (its own `karmada-apiserver` plus etcd) where you store plain Kubernetes resource templates (a normal `Deployment`, `Service`, and so on) alongside Karmada's own CRDs. You register member clusters, then declare where each template should go with a `PropagationPolicy`. Karmada copies and schedules the workload into the chosen clusters. The application manifests stay unchanged.

The system works in two modes. In Push mode the control plane reaches out to each member cluster's API directly. In Pull mode a `karmada-agent` runs inside the member cluster and pulls work toward itself, which suits clusters the control plane cannot reach over the network.

It is the successor to the deprecated KubeFed effort. Beyond simple copying, Karmada adds cross-cluster scheduling: it can split a single Deployment's replicas across clusters by weight or available capacity, apply per-cluster overrides, and reschedule when capacity changes. A Lua-based resource interpreter lets you teach Karmada about arbitrary CRDs without recompiling Go.

## When to use it

- You run workloads across several Kubernetes clusters (multi-region, multi-cloud, or on-prem plus cloud) and want one place to declare and schedule them.
- You want to split a workload's replicas across clusters by static weight or by real available capacity, not just pin it to one cluster.
- You need per-cluster customization (image registry, replica counts, env) on top of a shared template via override policies.
- You manage non-Deployment CRDs (Flink, Ray, Kubeflow jobs) and want them spread across clusters without changing the operator.

When a single cluster is enough, or when you only need GitOps-style delivery to a few statically labelled clusters, the extra control plane is overhead you do not need.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [karmada-io/karmada](https://github.com/karmada-io/karmada) (README, code), accessed 2026-06-24.
2. [Karmada Adopters](https://karmada.io/adopters/), accessed 2026-06-24.
3. [Karmada website](https://karmada.io/), accessed 2026-06-24.
4. [Karmada brings Kubernetes multi-cloud capabilities to CNCF Incubator](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/), CNCF blog, accessed 2026-06-24.
5. [Karmada CNCF project page](https://www.cncf.io/projects/karmada/), accessed 2026-06-24.
6. [Karmada and Open Cluster Management: two new approaches](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/), CNCF blog, accessed 2026-06-24.
7. [Karmada launches Adopter Group](https://www.cncf.io/blog/2025/03/26/karmada-launches-adopter-group/), CNCF blog, accessed 2026-06-24.
8. [GitHub REST API: repos/karmada-io/karmada](https://api.github.com/repos/karmada-io/karmada), accessed 2026-06-24.

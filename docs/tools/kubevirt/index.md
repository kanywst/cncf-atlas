# KubeVirt

> Run and manage KVM virtual machines as first-class Kubernetes workloads.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Incubating
- **Language**: Go (`go.mod:1`, `go 1.24.0`)
- **License**: Apache-2.0 (`LICENSE:1`)
- **Repository**: [kubevirt/kubevirt](https://github.com/kubevirt/kubevirt)
- **Documented at commit**: `55a003d` (main HEAD, 2026-06-24)

## What it is

KubeVirt is a Kubernetes add-on that runs full virtual machines next to containers on the same cluster. It defines a set of custom resources, the central one being `VirtualMachineInstance` (VMI), and a set of controllers that turn those resources into running KVM/QEMU guests. A VM becomes a regular Kubernetes object that you create, watch, and delete with `kubectl`.

Each VM runs inside its own Pod. KubeVirt places libvirt and QEMU inside that Pod, so the guest inherits Kubernetes scheduling, Pod networking, persistent volumes, and eviction. There is no separate hypervisor control plane to operate alongside the cluster.

It is for teams that already run Kubernetes and need to keep workloads that cannot be containerised, such as legacy VM images, appliances, or guests that need a full kernel. The project's stated design rule is to prefer Kubernetes conventions over virtualization conventions when the two conflict (see [v1.0 announcement](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/)).

## When to use it

- You run Kubernetes and have workloads that must stay as VMs (legacy images, full-kernel guests, appliances) but want one control plane for both.
- You want VMs to share the cluster's scheduler, `NetworkPolicy`, `StorageClass`, and monitoring stack instead of a separate virtualization platform.
- You are consolidating off a standalone hypervisor and want a Kubernetes-native target.
- It is a weaker fit when you do not run Kubernetes already: standing up a cluster only to host VMs adds a layer a traditional hypervisor would not.
- It is a weaker fit when nodes cannot expose hardware virtualization and you cannot accept software emulation's performance cost.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [kubevirt/kubevirt repository](https://github.com/kubevirt/kubevirt) (commit `55a003d`)
2. [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md)
3. [docs/getting-started.md](https://github.com/kubevirt/kubevirt/blob/main/docs/getting-started.md)
4. [docs/updates.md](https://github.com/kubevirt/kubevirt/blob/main/docs/updates.md)
5. [CNCF: KubeVirt becomes a CNCF incubating project](https://www.cncf.io/blog/2022/04/19/kubevirt-becomes-a-cncf-incubating-project/)
6. [CNCF projects: KubeVirt](https://www.cncf.io/projects/kubevirt/)
7. [CNCF: KubeVirt v1.0 has landed!](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/)
8. [Red Hat: What is KubeVirt?](https://www.redhat.com/en/topics/virtualization/what-is-kubevirt)
9. [InfoQ: CNCF Accepts KubeVirt as an Incubating Project](https://www.infoq.com/news/2022/06/cncf-kubevirt-incubating-project/)

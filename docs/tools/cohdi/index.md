# CoHDI

> CoHDI (Composable Hardware in Disaggregated Infrastructure) is a Kubernetes operator that attaches and detaches GPUs to nodes at runtime by driving a Composable Device Infrastructure (CDI) fabric API.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Sandbox (accepted 2025-12-19)
- **Language**: Go (`go 1.24.0`)
- **License**: Apache-2.0
- **Repository**: [CoHDI/composable-resource-operator](https://github.com/CoHDI/composable-resource-operator)
- **Documented at commit**: `761a00b` (tag v0.2.0, 2026-06-23)

## What it is

CoHDI ("Cody") is a CNCF Sandbox project for composable hardware on Kubernetes. Its core software is the `composable-resource-operator`, a controller that physically attaches and detaches PCIe and CXL devices (today, NVIDIA GPUs) to cluster nodes without rebooting them. Kubernetes has no native concept of composable hardware; resources are bound to a node at boot. The operator closes that gap by talking to a vendor CDI fabric manager that controls a PCI switch.

The operator exposes two Custom Resource Definitions (CRDs). `ComposabilityRequest` is the user-facing request for a number of devices of a given type and model. `ComposableResource` is the internal, per-device lifecycle object the operator manages. A request is decomposed into one `ComposableResource` per device, each running its own attach and detach state machine.

CoHDI is one of three components in the wider project. The other two are `composable-dra-driver` (publishes free pool devices into Kubernetes Dynamic Resource Allocation (DRA) ResourceSlices) and `dynamic-device-scaler` (watches for pending Pods and asks the operator to compose hardware). This deep-dive covers the `composable-resource-operator`, the component that issues the actual attach and detach calls.

## When to use it

- You run GPU workloads on bare-metal Kubernetes backed by a composable fabric (a PCIe or CXL switch) and want GPUs assigned to nodes on demand instead of statically pinned at boot.
- Your hardware is managed by a supported CDI provider: Fujitsu FTI_CDI (Composition Manager or Fabric Manager), SNIA Sunfish, or NEC CDIM (Composable Disaggregated Infrastructure Manager).
- You want utilisation and power gains from sharing a pool of accelerators across nodes rather than over-provisioning each node.
- It is not the right tool when nodes have fixed local GPUs with no composable fabric: there is nothing to attach or detach, and plain DRA or the NVIDIA GPU Operator covers that case.
- It is early. The pinned release is `v0.2.0`, the project is CNCF Sandbox, and the README describes itself as a proof of concept.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [CoHDI/composable-resource-operator](https://github.com/CoHDI/composable-resource-operator) (commit 761a00b, tag v0.2.0).
2. [CoHDI GitHub organization](https://github.com/CoHDI).
3. [CoHDI/.github profile README](https://github.com/CoHDI/.github/blob/main/profile/README.md).
4. [CoHDI ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md).
5. [cncf/sandbox Issue #361 (CoHDI Sandbox proposal)](https://github.com/cncf/sandbox/issues/361).
6. [CNCF project page: CoHDI](https://www.cncf.io/projects/cohdi/).
7. [KEP-5007 device-attach-before-pod-scheduled](https://github.com/kubernetes/enhancements/tree/master/keps/sig-scheduling/5007-device-attach-before-pod-scheduled).

# metal3-io

> Kubernetes-native bare metal host provisioning that drives OpenStack Ironic through the BareMetalHost CRD.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [metal3-io/baremetal-operator](https://github.com/metal3-io/baremetal-operator)
- **Documented at commit**: `56169b71` (main, 2026-06-24)

## What it is

Metal3 ("Metal Kubed") manages physical servers as first-class Kubernetes resources. Its core component, the baremetal-operator (BMO), exposes a `BareMetalHost` (BMH) custom resource and runs a controller that reconciles each host toward the state you declared. Behind the API, BMO does not reinvent provisioning. It drives OpenStack Ironic, which performs the real work: power control over IPMI or Redfish, booting over PXE or virtual media, wiping disks, and writing an OS image.

BMO is the bridge between the Kubernetes control plane and server hardware. It owns the CRD and the reconcile state machine; Ironic owns the hardware interaction. The two are split on purpose, so the operator stays a thin Kubernetes-native orchestrator over a mature bare metal provisioning engine.

It is built for operators of on-premises and edge infrastructure who want to manage hardware with the same declarative, controller-driven model they already use for workloads. It is also the native infrastructure backend for Cluster API through `cluster-api-provider-metal3`, so you can stand up Kubernetes clusters directly on bare metal.

## When to use it

- You run on-premises or edge servers and want to declare host lifecycle (inspect, provision, deprovision) as Kubernetes resources.
- You are building Kubernetes clusters on bare metal with Cluster API and need an infrastructure provider.
- You want to reuse Ironic's broad vendor coverage (iLO, iDRAC, iRMC, and others) instead of writing BMC integrations yourself.
- It is a poor fit if you have no Kubernetes cluster to host the operator, or if your servers lack a supported BMC and a network or virtual media boot path.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [metal3-io/baremetal-operator (source, pinned `56169b71`)](https://github.com/metal3-io/baremetal-operator)
2. [Metal3.io becomes a CNCF incubating project (CNCF, 2025-08-27)](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)
3. [Metal³: Baremetal Provisioning for Kubernetes (2019-04-30)](https://metal3.io/blog/2019/04/30/Metal-Kubed-Baremetal-Provisioning-for-Kubernetes.html)
4. [Baremetal Operator (2019-09-11)](https://metal3.io/blog/2019/09/11/Baremetal-operator.html)
5. [Introducing Metal³, KubeCon NA 2019 (2019-12-04)](https://metal3.io/blog/2019/12/04/Introducing_metal3_kubernetes_native_bare_metal_host_management.html)
6. [Metal3 Book: Bare Metal Operator introduction](https://book.metal3.io/bmo/introduction)
7. [Metal³ project site](https://metal3.io/)
8. [Bare Metal in a Cloud Native World (The New Stack)](https://thenewstack.io/bare-metal-in-a-cloud-native-world/)
9. [awesome-baremetal (alternatives landscape)](https://github.com/alexellis/awesome-baremetal/blob/master/README.md)
10. [Provision Bare Metal K8s with Cluster API & Canonical MAAS (Spectro Cloud)](https://www.spectrocloud.com/blog/how-to-provision-bare-metal-k8s-clusters-with-cluster-api-and-canonical-maas)

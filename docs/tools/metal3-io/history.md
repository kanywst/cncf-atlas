# History

## Origin

Metal3 started at Red Hat in 2019, with Ericsson joining early. It was first called "MetalKube". The founding design choice was explicit: do not reinvent bare metal provisioning, build on the proven OpenStack Ironic instead. The April 2019 announcement framed the project as Kubernetes-native bare metal provisioning ([source 3](https://metal3.io/blog/2019/04/30/Metal-Kubed-Baremetal-Provisioning-for-Kubernetes.html)). The baremetal-operator repository was created on 2019-01-23 ([source 1](https://github.com/metal3-io/baremetal-operator)).

A September 2019 post introduced the baremetal-operator itself: it abstracts BMC vendors (iLO, iDRAC, iRMC, and others) over IPMI and Redfish, and drives Ironic through the steps of wiping disks, writing an OS image, rebooting, and registering the node ([source 4](https://metal3.io/blog/2019/09/11/Baremetal-operator.html)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Red Hat starts MetalKube; baremetal-operator repo created 2019-01-23; Ericsson joins early ([source 3](https://metal3.io/blog/2019/04/30/Metal-Kubed-Baremetal-Provisioning-for-Kubernetes.html)) |
| 2019 | KubeCon NA: "Introducing Metal³" positions the project as a Cluster API infrastructure backend ([source 5](https://metal3.io/blog/2019/12/04/Introducing_metal3_kubernetes_native_bare_metal_host_management.html)) |
| 2020 | Accepted into the CNCF Sandbox ([source 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)) |
| 2025 | Promoted to CNCF Incubating on 2025-08-27 ([source 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)) |

## How it evolved

At KubeCon NA 2019, Russell Bryant and Doug Hellmann (Red Hat) presented "Introducing Metal³" and positioned it as a Cluster API infrastructure backend, so bare metal hosts could feed cluster creation the same way cloud instances do ([source 5](https://metal3.io/blog/2019/12/04/Introducing_metal3_kubernetes_native_bare_metal_host_management.html)).

Two later shifts stand out. First, the way Ironic itself is deployed moved from shell-based scripts toward the Ironic Standalone Operator (IrSO), which runs Ironic on Kubernetes. Second, the provisioner backend became swappable through Go's `plugin` mechanism, loaded as a `.so` at runtime, so the Ironic integration is decoupled from the core controller (see [Internals](./internals)).

## Where it stands now

Metal3 reached CNCF Incubating on 2025-08-27. During its Sandbox period the project counted 57 active contributing organizations, with Ericsson and Red Hat leading ([source 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)). The latest baremetal-operator release at the documented commit is v0.13.0, and main sits ahead of that tag ([source 1](https://github.com/metal3-io/baremetal-operator)). The project spans several repositories: baremetal-operator (the core), `cluster-api-provider-metal3`, `ip-address-manager`, and `ironic-standalone-operator`.

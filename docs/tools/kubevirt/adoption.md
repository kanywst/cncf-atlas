# Adoption & Ecosystem

## Who uses it

The following are listed in the project's [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md), verified against the repository file at commit `55a003d`. The year is the entry's listed start year.

| Organisation | Use case | Source |
| --- | --- | --- |
| NVIDIA | Kubernetes and KubeVirt underpin offerings such as GeForce NOW (2018) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| Cloudflare | KubeVirt in core data centres for hard-to-containerise uses like CI runners (2018) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| CoreWeave | GPU-focused Kubernetes-native cloud co-locating non-containerised workloads such as VDI on bare metal (2020) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| Civo | Tenant cluster provisioning (2020) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| Arm | Performance optimisation of KubeVirt on aarch64 (2021) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| Aussie Broadband | Bridging VMs and containers on bare metal (2023) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| Microsoft | Hosting VM workloads in Azure Operator Nexus (Vendor, 2023) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |

CNCF reports a Swisscom case study using KubeVirt with Kube-OVN for a sovereign cloud ([CNCF blog](https://www.cncf.io/blog/2022/04/19/kubevirt-becomes-a-cncf-incubating-project/)).

## Adoption signals

- GitHub stars: 6,917; forks: 1,710 (via `gh repo view`, observed 2026-06-24).
- Contributors: roughly 361 (GitHub contributors API pagination, observed 2026-06-24).
- Release cadence: three releases per year since v1.0; latest `v1.8.4` (2026-06-16).
- Reported in the CNCF Graduation process with 41 listed adopters as of November 2025 ([CNCF projects: KubeVirt](https://www.cncf.io/projects/kubevirt/)).

## Ecosystem

KubeVirt is meant to be composed with the rest of the cloud-native stack rather than replace it. Reported integrations: storage via CDI and Rook, L2 networking via Multus and Kube-OVN, service mesh via Istio, automation via Tekton and Argo CD, and migration via Konveyor ([CNCF v1.0 blog](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/)). Two products embed KubeVirt: Red Hat OpenShift Virtualization ([Red Hat](https://www.redhat.com/en/topics/virtualization/what-is-kubevirt)) and SUSE Rancher Harvester ([SUSE](https://www.suse.com/c/rancher_blog/comparing-hyperconverged-infrastructure-solutions-harvester-and-openstack/)).

## Alternatives

The essential difference: KubeVirt stands up no separate hypervisor platform. It loads VMs onto an existing Kubernetes cluster via CRDs so VMs and Pods share namespaces, `NetworkPolicy`, `StorageClass`, and the monitoring stack. Harvester and OpenShift Virtualization are products built on top of it.

| Alternative | Differs by |
| --- | --- |
| SUSE Harvester | KubeVirt + Longhorn + RKE2 packaged as an HCI appliance ISO rather than raw KubeVirt ([SUSE](https://www.suse.com/c/rancher_blog/comparing-hyperconverged-infrastructure-solutions-harvester-and-openstack/)) |
| OpenShift Virtualization | Red Hat's commercial distribution of KubeVirt ([Red Hat](https://www.redhat.com/en/topics/virtualization/what-is-kubevirt)) |
| OpenStack | Full cloud platform, strong on bare-metal and networking but not Kubernetes-native and weaker at app management ([Ubuntu](https://ubuntu.com/blog/kubernetes-vs-openstack)) |
| VMware vSphere | Traditional enterprise standard; post-Broadcom licensing changes are driving migration interest ([Portworx](https://portworx.com/blog/top-5-kubernetes-based-alternatives-to-vmware/)) |

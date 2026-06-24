# Adoption & Ecosystem

## Who uses it

The repository's [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) lists 174 self-reported entries, with a stated rule that listings are for production use. The named organizations below come from that file.

| Organisation | Use case | Source |
| --- | --- | --- |
| Google | GKE Dataplane V2 is built on Cilium | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Amazon Web Services | Cloud/infrastructure provider listing | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Alibaba Cloud | Cloud/infrastructure provider listing | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| DigitalOcean | Cloud/infrastructure provider listing | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Datadog | End-user listing | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Adobe | End-user listing | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Capital One | End-user listing | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| GitLab | End-user listing | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| ByteDance | End-user listing | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Canonical | Vendor/end-user listing | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |

Other entries in the same file include Equinix, Exoscale, Gcore, Civo, CoreWeave, Kakao, IKEA IT AB, Confluent, Elastic Path, Guidewire, Daimler Truck AG, F5, Cybozu, and Bitnami. The CNCF also tracks adoption scale separately in its [Cilium Project Journey Report](https://www.cncf.io/reports/cilium-project-journey-report/).

## Adoption signals

From the GitHub API for `cilium/cilium`, observed 2026-06-22: 24,565 stars, 3,842 forks, 307 watchers, and 1,004 open issues; the repository was created on 2015-12-16 ([GitHub API](https://api.github.com/repos/cilium/cilium)). Contributor count from the GitHub contributors API paginates to roughly 1,300 or more including anonymous contributors. At graduation the CNCF cited seven maintainer companies and more than 800 individual contributors ([CNCF announcement](https://www.cncf.io/announcements/2023/10/11/cloud-native-computing-foundation-announces-cilium-graduation/)).

Governance: maintainers and committers are listed in [MAINTAINERS.md](https://github.com/cilium/cilium/blob/main/MAINTAINERS.md). The governance document and contributor ladder live in the separate [cilium/community](https://github.com/cilium/community/blob/main/GOVERNANCE.md) repository.

## Ecosystem

Cilium spans several layers, and its surrounding tools follow. Hubble (same project) provides flow visualization on top of the eBPF datapath. Tetragon, the sibling project, adds eBPF-based runtime security and pairs with Cilium. As a platform integration, Cilium is the basis of GKE Dataplane V2 and is selectable on EKS and AKS. Within the project, features include kube-proxy replacement, BGP, WireGuard/IPsec encryption, ClusterMesh for multi-cluster networking, Gateway API and Ingress support, and an Egress Gateway ([CNCF announcement](https://www.cncf.io/announcements/2023/10/11/cloud-native-computing-foundation-announces-cilium-graduation/), [The New Stack](https://thenewstack.io/cilium-cncf-graduation-could-mean-better-observability-security-with-ebpf/)).

## Alternatives

Because Cilium spans multiple layers, the competition differs per layer. At the CNI layer the alternatives are Calico, Flannel, Weave Net, Antrea, and AWS VPC CNI. At the service-mesh layer it overlaps with Istio and Linkerd, where Cilium's pitch is a sidecar-less mesh using eBPF plus per-node Envoy ([The New Stack](https://thenewstack.io/cilium-cncf-graduation-could-mean-better-observability-security-with-ebpf/)).

| Alternative | Differs by |
| --- | --- |
| Calico | Also offers an eBPF dataplane, but Cilium treats eBPF as first-class throughout |
| Flannel | Simple overlay networking without identity-based policy or kube-proxy replacement |
| Weave Net | Overlay networking without an eBPF datapath |
| Antrea | Open vSwitch-based datapath rather than eBPF |
| AWS VPC CNI | Ties pods directly to VPC ENIs; no identity-based policy engine of its own |
| Istio / Linkerd | Service-mesh focused; sidecar (or per-node proxy) model versus Cilium's eBPF plus per-node Envoy |

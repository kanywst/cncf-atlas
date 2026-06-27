# Adoption & Ecosystem

## Who uses it

The organizations below are listed with a success story in the project's
ADOPTERS file ([source 8](https://github.com/antrea-io/antrea/blob/main/ADOPTERS.md)).
VMware vSphere Kubernetes Service (VKS) uses Antrea as its default CNI
([source 6](https://thenewstack.io/vmwares-antrea-brings-programmable-networks-to-kubernetes/)).

| Organisation | Use case | Source |
| --- | --- | --- |
| Glasnostic | Uses Antrea's Open vSwitch support to tune how services interact in Kubernetes clusters | [ADOPTERS.md](https://github.com/antrea-io/antrea/blob/main/ADOPTERS.md) |
| Transwarp | Uses Antrea ClusterNetworkPolicy and NetworkPolicy to protect a multi-tenant big-data platform, Egress to keep the source IP, and OVS for pod-to-pod across flannel and Antrea clusters | [ADOPTERS.md](https://github.com/antrea-io/antrea/blob/main/ADOPTERS.md) |
| TeraSky | Uses Antrea Cluster Network Policies, Network Policies, and Egress in internal clusters and customer environments | [ADOPTERS.md](https://github.com/antrea-io/antrea/blob/main/ADOPTERS.md) |
| VMware vSphere Kubernetes Service (VKS) | Ships Antrea as the default CNI | [The New Stack](https://thenewstack.io/vmwares-antrea-brings-programmable-networks-to-kubernetes/) |

## Adoption signals

Measured on the repository on 2026-06-26 via `gh api repos/antrea-io/antrea`
and the contributors API ([source 1](https://github.com/antrea-io/antrea)):

- Stars: 1,794
- Forks: 477
- Open issues: 201
- Unique contributors: 142
- Latest release: v2.6.2, 2026-06-13 ([source 10](https://github.com/antrea-io/antrea/releases/tag/v2.6.2))

The project carries an OpenSSF Best Practices badge (project 4173), shown in the
repository README ([source 1](https://github.com/antrea-io/antrea)).

## Ecosystem

- Flow Aggregator (`cmd/flow-aggregator`) collects IPFIX flow records from
  agents and exports them to external collectors such as Grafana.
- `antctl` (`cmd/antctl`) is the operational CLI for inspecting agent and
  controller state.
- Theia, a separate project, builds network flow visualization on top of the
  Flow Aggregator output.
- Open vSwitch, a Linux Foundation project, is the data plane Antrea programs.
- Antrea Multi-cluster (`multicluster/`) extends policy and service reach across
  clusters.

## Alternatives

Antrea's distinguishing trait is the OVS data plane: mature observability
(IPFIX, NetFlow, sFlow, SPAN) and first-class Windows support, since the
Windows code paths exist alongside Linux ones (`*_windows.go` files across
packages). The eBPF-based options center on Linux.

| Alternative | Differs by |
| --- | --- |
| Cilium | eBPF data plane (no OVS); CNCF Graduated; pick it when eBPF and L7 identity-aware policy are hard requirements |
| Calico | BGP or eBPF data plane from Tigera; pick it for BGP-native routing and a large managed-Kubernetes footprint |
| flannel | Simple overlay with no built-in NetworkPolicy; pick it when you only need basic pod connectivity |
| kube-router | BGP routing plus services and policy in one daemon; lighter, fewer advanced policy features |
| Weave Net | Mesh overlay; simpler model, far less active than Antrea today |

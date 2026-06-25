# Adoption & Ecosystem

## Who uses it

The CNI core repository has no `ADOPTERS.md`, so the honest framing is who consumes the contract, not a list of organizations using the library directly. The consumers are container runtimes and the plugins that implement the spec.

| Consumer | Use case | Source |
| --- | --- | --- |
| Kubernetes (kubelet) | Calls a CNI plugin when a pod is created | [Kubernetes Network Plugins](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/) |
| containerd, CRI-O | Embed `libcni` and run plugins before calling runc or hcsshim | `libcni/api.go:17-21` |
| GKE Dataplane V2, Azure CNI Powered by Cilium | Managed offerings built on a CNI implementation (Cilium) | [Kubernetes CNI comparison 2026](https://oneuptime.com/blog/post/2026-02-20-kubernetes-cni-comparison/view) |

Cilium, Calico, Flannel, Multus, and AWS VPC CNI are implementations of the spec rather than users of this library. They appear in the ecosystem section below.

## Adoption signals

- GitHub stars: 6,054; forks: 1,149 (`gh repo view containernetworking/cni`, observed 2026-06-24).
- Contributors: about 148 (GitHub contributors API, observed 2026-06-24).
- Latest tagged release: `v1.3.0` (2025-04-07). The documented commit is later main work (2025-12-15).

The strongest adoption signal is indirect: Kubernetes mandates CNI for pod networking, so every conformant Kubernetes cluster runs a CNI plugin through this contract ([Kubernetes Network Plugins](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/)).

## Ecosystem

The reference plugins (bridge, host-local, macvlan, ipvlan, portmap, bandwidth) ship from [containernetworking/plugins](https://github.com/containernetworking/plugins). Beyond those, the production data planes implement the spec:

- Flannel: minimal overlay networking, no NetworkPolicy support.
- Calico: BGP routing with strong NetworkPolicy, and an eBPF data plane.
- Cilium: eBPF-native, L7 policy, observability, and service-mesh features.
- Multus: a meta-plugin that multiplexes several CNIs to attach multiple interfaces to a pod.
- AWS VPC CNI and other cloud-specific plugins, often chained with Cilium.

Sources: [Kubernetes CNI comparison 2026](https://oneuptime.com/blog/post/2026-02-20-kubernetes-cni-comparison/view), [Civo: Calico vs Flannel vs Cilium](https://www.civo.com/blog/calico-vs-flannel-vs-cilium).

## Alternatives

The only direct alternative is at the spec level: Docker's Container Network Model. The names below are implementations you choose under CNI, not replacements for the interface.

| Alternative | Differs by |
| --- | --- |
| Docker CNM (libnetwork) | A competing spec tied to Docker; Kubernetes chose CNI and CNM lost ground ([Nuage](https://www.nuagenetworks.net/blog/container-networking-standards/)) |
| Flannel | A CNI implementation: simple overlay, no NetworkPolicy |
| Calico | A CNI implementation: BGP routing plus rich NetworkPolicy |
| Cilium | A CNI implementation: eBPF data plane, L7 policy, observability |

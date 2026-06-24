# Cilium

> eBPF-based networking, security, and observability for Kubernetes, where the data path runs in the kernel and policy is written against workload identity instead of IP addresses.

- **Category**: Service Mesh & Networking
- **CNCF maturity**: Graduated
- **Language**: Go (agent, operator, control plane) with C compiled to eBPF bytecode for the datapath
- **License**: Apache-2.0
- **Repository**: [cilium/cilium](https://github.com/cilium/cilium)
- **Documented at commit**: `fe36ad62` (2026-06-22, `main`, `VERSION` reads `1.20.0-dev`)

## What it is

Cilium is a CNI (Container Network Interface) plugin for Kubernetes. It connects pods, load-balances service traffic, and enforces network policy. What sets it apart is where the work happens: the actual packet processing runs inside the Linux kernel as eBPF programs attached to tc and XDP hooks, while a user-space Go agent decides what those programs should do.

The model that ties it together is identity. Cilium maps each workload's label set to a numeric security identity and writes policy against those identities, not against IP addresses. A user-space agent (`cilium-agent`, one per node via DaemonSet) computes configuration and pushes it into eBPF maps; the kernel then handles real traffic without round-tripping back to user space. A cluster-scoped operator handles IPAM, identity garbage collection, and CRD management.

On top of the datapath, Cilium ships Hubble for flow observability and offers a sidecar-less service mesh built on per-node Envoy. It is the networking layer behind GKE Dataplane V2 and is selectable on EKS and AKS.

## When to use it

- You run Kubernetes and want a CNI that replaces kube-proxy, doing L4 load balancing in eBPF rather than iptables.
- You need network policy that scales with workload count instead of IP count, because rules are keyed on identity (label sets) rather than addresses.
- You want L7-aware policy (HTTP, gRPC, Kafka) or flow-level observability via Hubble without deploying sidecars.
- You need multi-cluster networking (ClusterMesh), transparent encryption (WireGuard/IPsec), BGP, or an Egress Gateway from one integrated stack.

It is less of a fit when your nodes run kernels too old for the eBPF features Cilium needs, or when a managed platform pins you to a different CNI you cannot replace.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [cilium/cilium repository](https://github.com/cilium/cilium)
2. [cilium/cilium USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md)
3. [cilium/cilium MAINTAINERS.md](https://github.com/cilium/cilium/blob/main/MAINTAINERS.md)
4. [cilium/community GOVERNANCE.md](https://github.com/cilium/community/blob/main/GOVERNANCE.md)
5. [GitHub API repos/cilium/cilium](https://api.github.com/repos/cilium/cilium)
6. [CNCF announces Cilium graduation (2023-10-11)](https://www.cncf.io/announcements/2023/10/11/cloud-native-computing-foundation-announces-cilium-graduation/)
7. [Cilium on CNCF projects](https://www.cncf.io/projects/cilium/)
8. [CNCF Cilium Project Journey Report](https://www.cncf.io/reports/cilium-project-journey-report/)
9. [Cloud Native Now: The Cilium Story So Far](https://cloudnativenow.com/features/the-cilium-story-so-far/)
10. [Heavybit Kubelist Podcast Ep.30: Cilium and eBPF with Thomas Graf](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-30-cilium-and-ebpf-with-thomas-graf-of-isovalent)
11. [The Register: Cisco acquires Isovalent (2023-12-22)](https://www.theregister.com/2023/12/22/cisco_acquires_isovalent)
12. [The New Stack: Cisco Gets Cilium](https://thenewstack.io/cisco-gets-cilium-what-it-means-for-developers/)
13. [The New Stack: Cilium CNCF Graduation](https://thenewstack.io/cilium-cncf-graduation-could-mean-better-observability-security-with-ebpf/)
14. [Cilium Getting Started](https://docs.cilium.io/en/stable/gettingstarted/)

# Antrea

> A Kubernetes-native CNI that uses Open vSwitch as its data plane to provide pod networking and NetworkPolicy.

- **Category**: Service Mesh & Networking
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache License 2.0
- **Repository**: [antrea-io/antrea](https://github.com/antrea-io/antrea)
- **Documented at commit**: `65be43d` (2026-06-24, after the v2.6.2 tag)

## What it is

Antrea is a Container Network Interface (CNI) plugin for Kubernetes. CNI is the
specification kubelet calls to wire a new pod into the network. Antrea uses
Open vSwitch (OVS), a programmable software switch, as its data plane. Every
node runs an OVS bridge, and Antrea programs that bridge with OpenFlow entries
to forward pod traffic and to enforce policy.

Antrea has three parts. A single Antrea Controller computes policy. An Antrea
Agent runs on every node and owns that node's OVS bridge. A thin Antrea CNI
binary is invoked by kubelet and forwards each request to the local agent over
gRPC.

On top of standard Kubernetes networking, Antrea adds its own Custom Resource
Definitions (CRDs): Antrea NetworkPolicy and ClusterNetworkPolicy with tiers
and priorities, Egress for stable source IPs, multicast, traffic mirroring, and
IPFIX flow export. The OVS data plane is what makes this observability and
Windows support practical.

## When to use it

- You want a CNI whose policy model goes beyond Kubernetes NetworkPolicy:
  cluster-scoped rules, tiers, rule priorities, FQDN rules, and policy logging.
- You need mature network observability (IPFIX, NetFlow, sFlow, SPAN) that
  comes from OVS rather than a custom data plane.
- You run mixed Linux and Windows nodes and want one CNI across both.
- You do not need an eBPF data plane; if eBPF is a hard requirement, Cilium is
  the closer fit.

## In this deep-dive

- [History](./history): origin at VMware, the 1.0 release, and the CNCF donation.
- [Architecture](./architecture): the three binaries and how a CNI ADD flows.
- [Adoption & Ecosystem](./adoption): cited adopters and the alternatives.
- [Internals](./internals): policy computation, the OVS pipeline, read from source.
- [Getting Started](./getting-started): install Antrea and confirm pods get IPs.

## Sources

1. [antrea-io/antrea (GitHub)](https://github.com/antrea-io/antrea)
2. [Announcing Project Antrea (VMware OSS Blog, 2019-11-18)](https://blogs.vmware.com/opensource/2019/11/18/announcing-project-antrea/)
3. [It's here: Project Antrea 1.0 (VMware OSS Blog, 2021-04-15)](https://blogs.vmware.com/opensource/2021/04/15/its-here-project-antrea-1-0/)
4. [Antrea CNCF project page](https://www.cncf.io/projects/antrea/)
5. [Antrea accepted as a CNCF Sandbox project (antrea.io, 2021-05-05)](https://antrea.io/posts/2021-05-05-antrea-joins-cncf-sandbox/)
6. [VMware's Antrea Brings Programmable Networks to Kubernetes (The New Stack)](https://thenewstack.io/vmwares-antrea-brings-programmable-networks-to-kubernetes/)
7. [Antrea Getting started](https://antrea.io/docs/main/docs/getting-started)
8. [ADOPTERS.md (antrea-io/antrea)](https://github.com/antrea-io/antrea/blob/main/ADOPTERS.md)
9. [Antrea Architecture and Design (docs/design/architecture.md)](https://github.com/antrea-io/antrea/blob/main/docs/design/architecture.md)
10. [Antrea v2.6.2 release](https://github.com/antrea-io/antrea/releases/tag/v2.6.2)

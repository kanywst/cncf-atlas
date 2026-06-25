# Container Network Interface (CNI)

> A minimal, runtime-agnostic spec plus Go libraries that let any container runtime hand pod networking to pluggable executables.

- **Category**: Service Mesh & Networking
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [containernetworking/cni](https://github.com/containernetworking/cni)
- **Documented at commit**: `7c27007` (2025-12-15, after `v1.3.0`)

## What it is

CNI is a specification and a set of Go libraries for configuring network interfaces in Linux containers. The repository holds three things: the written spec, the reference Go library that runtimes embed, and a sample command-line tool. It deliberately does not ship a data plane. Real plugins such as `bridge` and `host-local` live in a separate repository, and projects like Calico, Cilium, and Flannel are third-party implementations of the same contract (`README.md:13`).

The contract is narrow on purpose. CNI concerns itself only with network connectivity of containers and with reclaiming resources when a container is deleted (`README.md:13`). Everything happens across a process boundary: a runtime executes a plugin binary, passes intent through environment variables and a JSON document on stdin, and reads a JSON result from stdout.

A runtime such as containerd, CRI-O, or kubelet links the `libcni` library, parses a network configuration from disk, and invokes plugins in order. The library handles config injection, plugin discovery, result caching, and version negotiation so each plugin stays small.

## When to use it

- You are building or extending a container runtime and need a standard way to attach pods to a network.
- You are writing a network plugin and want it to work under any CNI-compliant runtime without per-runtime code.
- You run Kubernetes and are choosing or chaining network plugins (Calico, Cilium, Flannel, Multus) that all speak CNI.
- It is not the right layer when you want a turnkey data plane or network policy engine. CNI is the interface; you still pick an implementation that provides those features.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [containernetworking/cni (GitHub)](https://github.com/containernetworking/cni)
2. [CNI SPEC.md](https://github.com/containernetworking/cni/blob/main/SPEC.md)
3. [cnitool docs](https://github.com/containernetworking/cni/blob/main/Documentation/cnitool.md)
4. [containernetworking/plugins (reference plugins)](https://github.com/containernetworking/plugins)
5. [CNCF hosts Container Networking Interface (CNI)](https://www.cncf.io/blog/2017/05/23/cncf-hosts-container-networking-interface-cni/)
6. [CNCF project page: Container Network Interface (CNI)](https://www.cncf.io/projects/container-network-interface-cni/)
7. [CNCF becomes home to rkt](https://www.cncf.io/announcements/2017/03/29/cloud-native-computing-foundation-becomes-home-pod-native-container-engine-project-rkt/)
8. [Nuage: CNM vs CNI container networking standards](https://www.nuagenetworks.net/blog/container-networking-standards/)
9. [Kubernetes Network Plugins](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/)
10. [Kubernetes CNI comparison 2026 (OneUptime)](https://oneuptime.com/blog/post/2026-02-20-kubernetes-cni-comparison/view)
11. [Civo: Calico vs Flannel vs Cilium](https://www.civo.com/blog/calico-vs-flannel-vs-cilium)

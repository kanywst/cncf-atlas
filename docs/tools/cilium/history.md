# History

## Origin

Cilium began in late 2015. Thomas Graf, Daniel Borkmann, André Martins, Madhu Challa, and others started it from a Linux kernel networking background, having worked on Open vSwitch and iptables-era tooling. Their bet was that the dynamic, short-lived nature of containers had outgrown address-based networking, and that eBPF could deliver a high-performance container datapath driven by intent and identity rather than IPs. The earliest version was IPv6 only, which proved ahead of its time ([Cloud Native Now](https://cloudnativenow.com/features/the-cilium-story-so-far/), [Heavybit Kubelist Ep.30](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-30-cilium-and-ebpf-with-thomas-graf-of-isovalent)). The repository itself was created on GitHub on 2015-12-16 ([GitHub API](https://api.github.com/repos/cilium/cilium)).

The year after the project started, Thomas Graf and Dan Wendlandt co-founded Isovalent (initially Covalent) to back it commercially. The two had a connection going back to the Nicira and Open vSwitch era ([Cloud Native Now](https://cloudnativenow.com/features/the-cilium-story-so-far/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | Project started; repository created on GitHub (2015-12-16) |
| 2016 | Isovalent (then Covalent) co-founded by Thomas Graf and Dan Wendlandt |
| 2021 | Accepted into the CNCF at the Incubating level (2021-10-13) |
| 2022 | Graduation application submitted (2022-10-27) |
| 2023 | Graduated from the CNCF (2023-10-11), the first CNI to do so |
| 2023 | Cisco announced its acquisition of Isovalent (2023-12-21) |

## How it evolved

Cilium entered the CNCF as an Incubating project on 2021-10-13 and graduated on 2023-10-11, becoming the first CNI project to reach Graduated status. At graduation the CNCF noted it was among the most active projects by commit count, behind Kubernetes, and credited seven maintainer companies plus more than 800 individual contributors ([CNCF announcement](https://www.cncf.io/announcements/2023/10/11/cloud-native-computing-foundation-announces-cilium-graduation/), [CNCF project page](https://www.cncf.io/projects/cilium/)). The graduation application was filed on 2022-10-27, roughly a year before it completed.

Scope widened well beyond a CNI plugin over that period. The project added kube-proxy replacement, a sidecar-less service mesh built on eBPF and per-node Envoy, ClusterMesh for multi-cluster networking, transparent encryption, BGP, and the Hubble observability layer ([The New Stack](https://thenewstack.io/cilium-cncf-graduation-could-mean-better-observability-security-with-ebpf/)).

On 2023-12-21, about seven years after Cilium's first code, Cisco announced its acquisition of Isovalent. Cisco had already been a Series A investor in the company. Thomas Graf moved into a CTO and VP of Engineering role within Cisco Security, and both Cilium and Tetragon were stated to continue as open source under the CNCF ([The Register](https://www.theregister.com/2023/12/22/cisco_acquires_isovalent), [The New Stack](https://thenewstack.io/cisco-gets-cilium-what-it-means-for-developers/)).

## Where it stands now

The project is a Graduated CNCF project. At the documented commit the `VERSION` file reads `1.20.0-dev` on `main`, an unreleased development version; the most recent stable release tag is `v1.19.5`. Maintainers and committers are listed in [MAINTAINERS.md](https://github.com/cilium/cilium/blob/main/MAINTAINERS.md), with governance and the contributor ladder documented in the separate [cilium/community](https://github.com/cilium/community/blob/main/GOVERNANCE.md) repository. Many maintainers are affiliated with Isovalent/Cisco, but external committers exist as well.

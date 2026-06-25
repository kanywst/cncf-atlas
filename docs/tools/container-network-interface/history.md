# History

## Origin

CNI grew out of the network plumbing in CoreOS's rkt container engine. rkt was built around the appc (App Container) specification, and its networking piece was factored out into a separate, multi-vendor contract so other runtimes could reuse it. CoreOS later donated rkt itself to the CNCF in March 2017, which underlines how closely the two projects were tied at the start ([CNCF becomes home to rkt](https://www.cncf.io/announcements/2017/03/29/cloud-native-computing-foundation-becomes-home-pod-native-container-engine-project-rkt/)).

The design goal was a minimal contract. CNI concerns itself only with the network connectivity of containers and with removing allocated resources when the container is deleted (`README.md:13`). Everything else, including how addresses are assigned or how packets are routed, is left to plugins.

The public repository was created on 2015-04-05 ([containernetworking/cni](https://github.com/containernetworking/cni)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | `containernetworking/cni` repository created (2015-04-05) |
| 2017 | CNCF accepts CNI as its 10th hosted project, at Incubating maturity (2017-05-23) |
| 2017 | Spec 0.4.0 introduces the CHECK command and cached results for CHECK and DEL |
| 2021 | Spec 1.0.0 settles the result types |
| 2024 | Spec 1.1.0 adds the GC and STATUS commands |
| 2025 | `v1.3.0` tagged (2025-04-07) |

## How it evolved

The competing approach was Docker's Container Network Model (CNM), implemented by libnetwork. CNM was tightly coupled to Docker, while CNI was runtime-agnostic and small. When Kubernetes chose CNI over CNM, CNI became the de facto standard for pod networking ([Nuage: CNM vs CNI](https://www.nuagenetworks.net/blog/container-networking-standards/)).

The spec then grew in controlled steps, and each step is visible in the library. Spec 0.4.0 added cached results so CHECK and DEL could replay what ADD had returned (`libcni/api.go:549-553`, `libcni/api.go:593-601`). The 1.0.0 cycle reorganized the result types. Spec 1.1.0 added garbage collection and a status check, both gated on the configuration's CNI version (`libcni/api.go:818`, `libcni/api.go:857`). The current implemented spec version in the result package is `1.1.0` (`pkg/types/100/types.go:30`).

## Where it stands now

CNI was accepted by the CNCF Technical Oversight Committee on 2017-05-23 and remains at Incubating maturity ([CNCF hosts CNI](https://www.cncf.io/blog/2017/05/23/cncf-hosts-container-networking-interface-cni/), [CNCF project page](https://www.cncf.io/projects/container-network-interface-cni/)). The latest tagged release is `v1.3.0` (2025-04-07), and the commit documented here is later main work (2025-12-15). The project keeps a clear split: this repository owns the spec and the embeddable library, while the reference data-plane plugins ship from [containernetworking/plugins](https://github.com/containernetworking/plugins).

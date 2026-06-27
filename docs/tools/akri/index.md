# Akri

> Akri discovers leaf devices on the edge (IP cameras, USB peripherals, OPC UA servers) and exposes them to a Kubernetes cluster as schedulable resources.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Sandbox
- **Language**: Rust
- **License**: Apache-2.0
- **Repository**: [project-akri/akri](https://github.com/project-akri/akri)
- **Documented at commit**: `604bdcb` (close to tag v0.13.8)

## What it is

Akri (the name expands to "A Kubernetes Resource Interface") extends the Kubernetes device plugin framework to handle devices that cannot run a Kubernetes node themselves. A small IP camera or a USB sensor has no compute to host kubelet, so the standard device plugin model, which assumes a device is local to the node that advertises it, does not fit edge fleets well.

Akri solves three edge specific problems. It discovers leaf devices through pluggable protocol handlers, it advertises each discovered device to the cluster as a resource, and it schedules a workload (a "broker") onto the nodes that can reach the device. When a device that is visible to several nodes (a networked camera, for example) is found, Akri represents it as a single shared resource so that multiple nodes can coordinate access up to a configured capacity.

The project came out of Microsoft DeisLabs and entered the CNCF Sandbox in September 2021. It runs as two long lived workloads (an Agent DaemonSet and a Controller) plus a set of Discovery Handlers, all configured through two Custom Resource Definitions (CRDs).

## When to use it

- You run an existing Kubernetes cluster at the edge and need to expose non-node devices (cameras, serial or USB peripherals, OPC UA endpoints) as cluster resources.
- The same physical device is reachable from several nodes and you want one logical resource shared across them with a capacity limit.
- You want to write a discovery plugin for a custom protocol and have Akri schedule a broker per device without writing a full device plugin.
- It is not the right tool when the device itself can run Kubernetes (use a normal node) or when you need a full edge control plane that turns devices into nodes (KubeEdge or OpenYurt fit that better).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. project-akri/akri README and repository metadata: <https://github.com/project-akri/akri>
2. Akri project page, CNCF (Sandbox acceptance date and license): <https://www.cncf.io/projects/akri/>
3. SANDBOX PROJECT ONBOARDING: Akri, cncf/toc issue 719: <https://github.com/cncf/toc/issues/719>
4. Akri a Year Later, DeisLabs: <https://deislabs.io/posts/akri-a-year-later/>
5. Kubernetes Podcast episode 132, Akri, with Kate Goldenring: <https://kubernetespodcast.com/episode/132-akri/>
6. Akri docs, Getting Started: <https://docs.akri.sh/user-guide/getting-started>
7. Kubernetes at the edge with Akri, InfoWorld: <https://www.infoworld.com/article/2260916/kubernetes-at-the-edge-with-akri.html>

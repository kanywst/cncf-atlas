# KubeVela

> An application-centric delivery control plane that turns one OAM `Application` into multi-cluster Kubernetes resources through composable CUE modules.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [kubevela/kubevela](https://github.com/kubevela/kubevela)
- **Documented at commit**: `a10dba6` (master, 2026-06-10)

## What it is

KubeVela is a Kubernetes controller built on the Open Application Model (OAM). A user writes one `Application` custom resource that lists components, policies, and a workflow, and the controller expands it into the real Kubernetes objects that run the workload. The abstraction layer is written in CUE templates rather than Go, so a platform team can add new component and trait types by adding CUE definitions instead of rebuilding the controller.

OAM splits an application into Components, which model a workload, and Traits, which attach operational capabilities to a component (source: [CNCF blog 2023-03-31](https://www.cncf.io/blog/2023/03/31/kubevela-the-road-to-cloud-native-application-and-platform-engineering/)). KubeVela was the first implementation of OAM, proposed in 2020 by Alibaba Cloud and Microsoft Azure. It sits above raw Kubernetes manifests and above Helm: it can deliver a Helm chart, a Terraform module, or a plain workload, then track and garbage-collect everything it applied.

The project ships three entry points: a controller-manager, a `vela` CLI, and a kubectl plugin. The controller is the part that reconciles `Application` resources; the CLI is for operators who drive delivery from a terminal.

## When to use it

- You are building an internal developer platform and want one self-service application API instead of exposing raw Deployments, Services, and Ingresses.
- You need to deliver the same application across multiple clusters with placement policies from a single control plane.
- You want platform engineers to define reusable component and trait abstractions in CUE without forking or rebuilding a controller.
- You already standardize on Helm charts or Terraform modules and want to wrap them in a higher-level, workflow-driven delivery model.

When it is not the right fit: if you only need to sync raw manifests from Git, a plain GitOps syncer is simpler. If your team has no appetite for CUE, the abstraction layer adds learning cost that lands on the platform side.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [kubevela/kubevela repository, commit a10dba6](https://github.com/kubevela/kubevela)
2. [kubevela/community ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md)
3. [kubevela/community GOVERNANCE.md](https://github.com/kubevela/community/blob/main/GOVERNANCE.md)
4. [CNCF: KubeVela brings software delivery control plane capabilities to CNCF Incubator (2023-02-27)](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/)
5. [CNCF: KubeVela, the road to cloud native application and platform engineering (2023-03-31)](https://www.cncf.io/blog/2023/03/31/kubevela-the-road-to-cloud-native-application-and-platform-engineering/)
6. [CNCF project page: KubeVela](https://www.cncf.io/projects/kubevela/)
7. [KubeVela Documentation: Introduction](https://kubevela.io/docs/)

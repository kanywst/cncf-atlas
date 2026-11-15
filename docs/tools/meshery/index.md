# Meshery

> A self-hosted manager for Kubernetes and the infrastructure around it: you describe what you want as a design, Meshery checks the relationships between its parts, and its server applies it to one or more clusters.

- **Category**: Provisioning & Infrastructure
- **CNCF maturity**: Incubating
- **Language**: Go (server and CLI) and TypeScript/React (UI)
- **License**: Apache-2.0
- **Repository**: [meshery/meshery](https://github.com/meshery/meshery)
- **Documented at commit**: `68d542af` (2026-11-15, `master`, after `v1.0.79`)

## What it is

Meshery is a server with a web UI and a CLI (`mesheryctl`). You connect it to your Kubernetes clusters, and it keeps track of what is running there and of the resource types it knows how to manage. It started in 2019 as a management plane for service meshes such as Istio and Linkerd. It now covers Kubernetes resources in general and hundreds of other integrations. Each integration is a **model**: a set of JSON definitions for one technology's resource types ([CNCF blog](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/)).

The working unit is a **design**: a declarative document that lists the components you want (a Deployment, an Istio VirtualService, a Namespace) and the relationships between them. Meshery evaluates those relationships, for example adding the Namespace a namespaced resource needs, and then deploys the design. The deploy is a push: Meshery Server holds a kubeconfig for each connected cluster and applies the resources to the API server itself. It does not run a reconcile loop afterwards. To see what is in the cluster, a component called MeshSync watches cluster state and streams changes back to the server.

The README calls it a "self-service engineering platform" with visual and collaborative GitOps, which points at platform and operations teams who want a shared view of their infrastructure and a way to stage changes before applying them ([README](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/README.md)). It sits outside the cluster's control plane: it is a client of the Kubernetes API, much like `kubectl` with a UI, a registry of resource types, and a database behind it.

## When to use it

- You want to design Kubernetes infrastructure visually or as a document, check how the parts relate, and deploy it to several clusters from one place.
- You want a running inventory of what is in your clusters (through MeshSync) next to the designs you deploy.
- You manage service meshes or other add-ons and want one tool that knows their resource types, with load testing built in (Meshery uses fortio for this).

It is a weaker fit when you want Git to be the source of truth with continuous drift correction. Meshery applies a design once per request. Argo CD or Flux pull from Git and reconcile continuously, and Crossplane reconciles through the Kubernetes API itself.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [meshery/meshery repository at `68d542af`](https://github.com/meshery/meshery/tree/68d542afa9e40e15e3d032bf3ed1d10eb2347b62)
2. [GitHub API repos/meshery/meshery](https://api.github.com/repos/meshery/meshery)
3. [meshery/meshery releases](https://github.com/meshery/meshery/releases)
4. [Meshery on CNCF projects](https://www.cncf.io/projects/meshery/)
5. [cncf/landscape `landscape.yml`](https://github.com/cncf/landscape/blob/master/landscape.yml)
6. [cncf/toc#1386 Meshery Incubation Application](https://github.com/cncf/toc/issues/1386)
7. [Meshery becomes a CNCF Incubating project (CNCF blog)](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/)
8. [CNCF Adopts Meshery to Advance Service Mesh Management (Layer5)](https://layer5.io/company/news/cncf-adopts-meshery-to-advance-service-mesh-management/)
9. [Meshery lands in the CNCF Landscape (Layer5)](https://layer5.io/blog/announcements/meshery-lands-in-the-cncf-landscape)
10. [Meshery v1.0 is Generally Available](https://meshery.io/blog/meshery-v1.0-general-availability/)
11. [Meshery docs: Architecture](https://docs.meshery.io/concepts/architecture)
12. [Meshery docs: Logical Concepts](https://docs.meshery.io/concepts/logical)
13. [meshery/meshery ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md)
14. [Meshery docs: Quick Start Guide](https://docs.meshery.io/installation/quick-start)
15. [Meshery environment variables](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/docs/content/en/installation/advanced/environment-variables.md)
16. [meshery/meshery MAINTAINERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/MAINTAINERS.md)
17. [Meshery DevStats](https://meshery.devstats.cncf.io/)
18. [cncf/toc#1264 first Meshery incubation application](https://github.com/cncf/toc/issues/1264)
19. [Commit: Port OPA/Rego policy engine to native Go](https://github.com/meshery/meshery/commit/31b22b91c95a72df2fc456a8a45694ddcafc08d2)

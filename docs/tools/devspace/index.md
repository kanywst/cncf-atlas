# DevSpace

> DevSpace is a client-only CLI that runs your local code inside a Kubernetes pod and syncs edits both ways, so you develop against a real cluster without installing any operator or CRD.

- **Category**: Developer Tools
- **CNCF maturity**: Sandbox (accepted 2022-12-13)
- **Language**: Go (`go 1.25.0`)
- **License**: Apache-2.0
- **Repository**: [devspace-sh/devspace](https://github.com/devspace-sh/devspace)
- **Documented at commit**: `8ff6260` (near tag `v6.4.0-rc.1`)

## What it is

DevSpace is a command-line tool for developing applications that run on Kubernetes. The usual inner loop for a containerized app is slow: edit code, build an image, push it, redeploy, wait for the pod to restart, then check the result. DevSpace collapses that loop. It starts your workload in the cluster, then keeps a live file sync between your working directory and the running container, so a saved edit reaches the container in place, without a rebuild or a redeploy.

Everything runs from the client. DevSpace reads your existing kube-context the same way `kubectl` and `helm` do, and installs nothing permanent in the cluster: no operator, no CRD, no controller waiting to reconcile. The one server-side piece is a small helper binary that DevSpace injects into the target container on demand and that goes away with the pod. The workflow itself is declared in a single `devspace.yaml` that a team commits to git, covering how to build images, how to deploy, and how to run the development session.

DevSpace sits in the inner-loop development slot, between your editor and the cluster. It is a developer tool rather than a deployment platform: it drives the build and deploy backends you already use (Docker, BuildKit, kaniko for builds; Helm, kubectl manifests, kustomize for deploys) instead of replacing them.

## When to use it

- Your app only makes sense running in Kubernetes (it needs cluster services, config maps, secrets, or sidecars) and you want to develop against a live pod instead of mocking that environment locally.
- You want saved edits to reach the running container in seconds, with no image rebuild or redeploy, for interpreted runtimes or hot-reloading frameworks.
- You want the build, deploy, and dev workflow declared in one file that the whole team shares through git, so everyone develops the same way.
- You want to keep using your own cluster and kube-context with nothing permanent installed in it.
- Not the right fit if a plain local process or `docker compose` already reproduces your environment well enough; the cluster round trip adds moving parts you do not need.
- Not a CI or production deployment tool. It targets the developer inner loop, and its Pod-replacement mechanism deliberately mutates a running workload for a single developer's session.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a dev session flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [devspace-sh/devspace README](https://github.com/devspace-sh/devspace) (accessed 2026-07-08)
2. [devspace source at pinned commit 8ff6260](https://github.com/devspace-sh/devspace/tree/8ff6260787edacfa2c0d30d1ff62358d36d482bc) (accessed 2026-07-08)
3. [The New Stack: Why Loft Labs Is Donating DevSpace to CNCF](https://thenewstack.io/why-loft-labs-is-donating-devspace-to-cncf/) (accessed 2026-07-08)
4. [Loft Labs: Loft Labs Contributes Open Source Project DevSpace to the CNCF](https://www.vcluster.com/blog/loft-labs-contributes-open-source-project-devspace-to-the-cloud-native-computing-foundation) (accessed 2026-07-08)
5. [DevSpace Documentation: Pipelines](https://www.devspace.sh/docs/configuration/pipelines/) (accessed 2026-07-08)
6. [Loft Labs: DevSpace 6 is Here!](https://www.vcluster.com/blog/devspace-6-announcement) (accessed 2026-07-08)
7. [BusinessWire: Loft Labs Contributes DevSpace to the CNCF](https://www.businesswire.com/news/home/20221215005183/en/) (accessed 2026-07-08)
8. [ComputerWeekly: Loft Labs donates DevSpace to CNCF](https://www.computerweekly.com/blog/Open-Source-Insider/Loft-Labs-donates-DevSpace-to-CNCF) (accessed 2026-07-08)
9. [CNCF project page: DevSpace](https://www.cncf.io/projects/devspace/) (accessed 2026-07-08)
10. [DevSpace official site](https://www.devspace.sh/) (accessed 2026-07-08)
11. [Tilt](https://tilt.dev/) (accessed 2026-07-08)
12. [Garden](https://garden.io/) (accessed 2026-07-08)
13. [Ugur Elveren: Best Kubernetes Development Environment for Large Teams](https://blog.ugurelveren.com/post/best-kubernetes-development-environment-for-large-teams/) (accessed 2026-07-08)
14. [DevSpace v6.0.0 release notes](https://github.com/devspace-sh/devspace/releases/tag/v6.0.0) (accessed 2026-07-08)

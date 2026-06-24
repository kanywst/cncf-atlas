# Flux

> A GitOps tool that keeps a Kubernetes cluster continuously reconciled with manifests stored in Git.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [fluxcd/flux2](https://github.com/fluxcd/flux2)
- **Documented at commit**: `65d975b` (main, 2026-06-19; nearest tag `v2.8.8`)

## What it is

Flux delivers Kubernetes configuration from Git. You commit YAML to a repository, and a set of in-cluster controllers pull that state and apply it, repeatedly, so the cluster converges on what Git says. Nothing is pushed from a developer laptop or a CI runner into the cluster.

The `fluxcd/flux2` repository is two things. The `flux` CLI handles day-0 work: it bootstraps a cluster, generates manifests, and inspects state (`cmd/flux/main.go:43`). The continuous reconciliation is done by the GitOps Toolkit controllers, which live in separate repositories and are pulled in as API modules through `go.mod`. The default install brings up `source-controller`, `kustomize-controller`, `helm-controller`, and `notification-controller` (`pkg/manifestgen/install/options.go:46`).

A defining trait is that Flux puts itself under GitOps management. After bootstrap, Flux's own component manifests live in Git and are reconciled by the in-cluster `kustomize-controller` like any other workload. Upgrading Flux becomes a commit, and the CLI is not required after day 1.

## When to use it

- You want a pull-based GitOps model where each cluster reconciles itself, with no central push from CI.
- You run many clusters or edge environments and want a small in-cluster footprint per cluster.
- You treat Helm as a first-class delivery mechanism and want `HelmRelease` objects reconciled by a controller instead of rendered in CI.
- You need native SOPS decryption for secrets inside the reconcile loop.
- It is a weaker fit when your team wants a single central control plane with a rich web UI as the primary interface; Argo CD targets that shape more directly.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [fluxcd/flux2 repository](https://github.com/fluxcd/flux2) (source, LICENSE, go.mod, Makefile), accessed 2026-06-22.
2. [Flux Graduates from the CNCF Incubator](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/), accessed 2026-06-22.
3. [Flux is a CNCF Graduated project](https://fluxcd.io/blog/2022/11/flux-is-a-cncf-graduated-project/), accessed 2026-06-22.
4. [What is Flux CD? (CNCF)](https://www.cncf.io/blog/2023/09/15/what-is-flux-cd/), accessed 2026-06-22.
5. [An introduction to Flux, Part 1: History and features (Platform9)](https://platform9.com/blog/an-introduction-to-flux-part-1-history-and-features/), accessed 2026-06-22.
6. [Flux Adopters](https://fluxcd.io/adopters/), accessed 2026-06-22.
7. [Flux vs Argo CD (Northflank)](https://northflank.com/blog/flux-vs-argo-cd), accessed 2026-06-22.

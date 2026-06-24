# Argo CD

> A Kubernetes controller that continuously reconciles cluster state against manifests stored in Git, the pull-based GitOps model.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Graduated
- **Language**: Go (UI in React/TypeScript)
- **License**: Apache-2.0
- **Repository**: [argoproj/argo-cd](https://github.com/argoproj/argo-cd)
- **Documented at commit**: `8f6d4e1` (master, 2026-06-22; `VERSION` reads `3.6.0`)

## What it is

Argo CD is the GitOps engine of the Argo project, the CNCF umbrella that also covers Workflows, Rollouts, and Events. It runs inside a Kubernetes cluster and treats a Git repository as the source of truth for what should be deployed. An `Application` custom resource points at a repo path (plain manifests, Helm, Kustomize, or OCI) and a target cluster or namespace, and a controller works to make the live cluster match.

The model is pull-based. Nothing external pushes manifests into the cluster. The controller watches both Git and the live cluster, computes a diff, and either reports drift or applies it. This is the GitOps approach Intuit adopted when it built the tool to manage many clusters under financial compliance requirements.

Argo CD bundles a web UI, SSO, RBAC, and multi-cluster visualization in one product, so a team can adopt it without assembling separate pieces. It is application-centric: the unit you reason about is an `Application`, and the UI renders the resource tree and sync status for each one.

## When to use it

- You want declarative, Git-driven delivery to one or more Kubernetes clusters with a built-in UI and audit trail.
- You manage many clusters or namespaces and need a single place to see desired versus live state.
- You need multi-tenancy: `AppProject` boundaries with per-team source, destination, and RBAC restrictions.
- You want to template Applications across clusters or a monorepo (via ApplicationSet).

It is a weaker fit when you do not run Kubernetes, or when you prefer a toolkit of composable controllers without a bundled UI. Flux CD fits that case better.

## In this deep-dive

- [History](./history): origin at Applatix and Intuit, donation to CNCF, graduation.
- [Architecture](./architecture): the multi-component layout and the reconcile-to-sync flow.
- [Adoption & Ecosystem](./adoption): cited adopters, GitHub signals, and alternatives.
- [Internals](./internals): the comparison-level ladder and the code paths that matter.
- [Getting Started](./getting-started): install into a cluster and sync a first Application.

## Sources

1. [The CNCF Announces Argo has Graduated](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/)
2. [Argo Project Journey Report (CNCF)](https://www.cncf.io/reports/argo-project-journey-report/)
3. [argoproj/argo-cd on GitHub](https://github.com/argoproj/argo-cd)
4. [Why We Created the Argo Project (Akuity)](https://akuity.io/blog/why-we-created-the-argo-project)
5. [Four lessons that took Argo from first commit to GitOps darling (CNCF)](https://www.cncf.io/blog/2022/09/21/four-lessons-that-took-argo-from-first-commit-to-gitops-darling/)
6. [Argo 101: What Is Argo? (Akuity)](https://akuity.io/blog/argo-101-what-is-argo)
7. [argoproj/argo-cd USERS.md](https://github.com/argoproj/argo-cd/blob/master/USERS.md)
8. [Argo CD Getting Started (official docs)](https://argo-cd.readthedocs.io/en/stable/getting_started/)

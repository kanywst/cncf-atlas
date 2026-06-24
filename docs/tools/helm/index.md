# Helm

> Helm is the package manager for Kubernetes: it bundles, versions, and installs related Kubernetes resources as a single unit called a chart.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [helm/helm](https://github.com/helm/helm)
- **Documented at commit**: `74fa4fce` (near tag v4.2.2, 2026-06-20)

## What it is

Helm packages a set of Kubernetes manifests as a chart, a versioned and distributable directory of templates plus default values. Running `helm install` renders those templates with user-supplied values, applies the resulting objects to a cluster, and records the result as a release. Upgrades, rollbacks, and uninstalls all operate on that release history.

The templating layer is Go `text/template`, so charts can parameterize any field of any manifest. A chart can depend on other charts (subcharts), so an application and its dependencies install together. Charts are distributed through HTTP repositories or, since Helm 3.8, OCI registries.

Helm runs as a client-side CLI. Since Helm 3 it talks to the Kubernetes API directly using the caller's kubeconfig and stores each release as a Secret in the target namespace, with no server-side component of its own.

## When to use it

- You want to install and upgrade an off-the-shelf application (a database, an ingress controller, an observability stack) that ships an official chart.
- You need one parameterized package to deploy across dev, staging, and production with different values.
- You want versioned releases with rollback, so a bad upgrade can be reverted to a prior revision.
- You distribute your own software and want users to install it with one command.

It is a weaker fit when you only need to patch a handful of static manifests, where Kustomize overlays are simpler. It also fits poorly when you want a typed configuration language and built-in drift detection instead of string templating.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [helm/helm source, pinned at `74fa4fce`](https://github.com/helm/helm)
2. [The History of the Project (Helm)](https://helm.sh/community/history/)
3. [Helm 3 Preview pt1: A History of Helm](https://helm.sh/blog/helm-3-preview-pt1/)
4. [CNCF Announces Helm Graduation](https://www.cncf.io/announcements/2020/04/30/cloud-native-computing-foundation-announces-helm-graduation/)
5. [Helm now a CNCF graduated project (Microsoft OSS)](https://opensource.microsoft.com/blog/2020/05/01/helm-package-manager-kubernetes-now-cncf-graduated-project)
6. [Helm 3 Preview: Alpha release and what's next (CNCF)](https://www.cncf.io/blog/2019/05/16/helm-3-preview-helm-3-alpha-release-available-and-whats-next/)
7. [Helm installation guide](https://helm.sh/docs/intro/install/)
8. [Timoni: Compared to other tools](https://timoni.sh/comparison/)
9. [Kustomize vs. Helm (IBM)](https://www.ibm.com/think/insights/kustomize-vs-helm)
10. [ADOPTERS.md (helm/helm)](https://github.com/helm/helm/blob/main/ADOPTERS.md)

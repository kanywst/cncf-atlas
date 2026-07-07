# Carvel

> Carvel is a set of single-purpose Kubernetes tools; its in-cluster engine, kapp-controller, fetches, templates, and deploys application configuration through a declarative pipeline.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [carvel-dev/kapp-controller](https://github.com/carvel-dev/kapp-controller)
- **Documented at commit**: `be1faef` (v0.60.3)

## What it is

Carvel is not one program. It is a family of small command-line tools, each doing one job: `ytt` templates YAML, `kbld` resolves image references, `imgpkg` packages configuration as Open Container Initiative (OCI) images, `vendir` vendors remote sources, and `kapp` applies a set of resources to a cluster as one unit. The tools are meant to be composed, the way UNIX commands are composed with pipes.

This deep-dive covers `kapp-controller`, the in-cluster engine that ties those tools together. It is a Kubernetes controller built on controller-runtime. It watches custom resources (CRs), starting with `App`, `PackageInstall`, and `PackageRepository`, and for each `App` it runs a three-stage pipeline: fetch the configuration, template it, then deploy it. Each stage shells out to one of the Carvel command-line tools.

kapp-controller sits where GitOps engines and package managers sit. An `App` resource declares where its configuration comes from, how to render it, and how to apply it. kapp-controller reconciles that declaration against the cluster on a timer and records the result of each stage in the resource status.

## When to use it

- You want declarative, continuous reconciliation of application configuration from git, Helm charts, or OCI bundles, with drift correction handled by `kapp`.
- You want to distribute software as versioned packages that cluster operators install with a `PackageInstall`, similar to a package manager backed by an OCI registry.
- You prefer composing focused tools over one monolithic templating-and-deploy binary.
- It is a weaker fit if you only need a one-shot client-side apply, or if your team is already standardised on a single GitOps controller and does not want a second reconciler in the cluster.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a reconcile flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [carvel-dev/kapp-controller](https://github.com/carvel-dev/kapp-controller) (main implementation), accessed 2026-06-26.
2. [carvel-dev/carvel](https://github.com/carvel-dev/carvel) (umbrella and community), accessed 2026-06-26.
3. [Introduction to Carvel](https://carvel.dev/blog/introduction-to-carvel-blog-post/), accessed 2026-06-26.
4. [Carvel Sets Sail for the CNCF Sandbox (VMware OSS)](https://blogs.vmware.com/opensource/2022/10/25/carvel-sets-sail-for-the-cncf-sandbox/), accessed 2026-06-26.
5. [Project Carvel has joined the CNCF](https://carvel.dev/blog/carvel-cncf-sandbox/), accessed 2026-06-26.
6. [CNCF project page: Carvel](https://www.cncf.io/projects/carvel/), accessed 2026-06-26.
7. [kapp-controller documentation](https://carvel.dev/kapp-controller/), accessed 2026-06-26.
8. [Comparing Kubernetes deployment tools (NETWAYS)](https://nws.netways.de/blog/2024/07/16/comparing-kubernetes-deployment-tools-what-we-got-today), accessed 2026-06-26.
9. [kapp-controller releases](https://github.com/carvel-dev/kapp-controller/releases) (v0.60.3 assets), accessed 2026-06-26.

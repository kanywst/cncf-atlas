# Adoption & Ecosystem

## Who uses it

The `kapp-controller` repository does not contain an `ADOPTERS` file, and Carvel does not publish a verified list of adopting organisations. To avoid inventing names, this page does not present a named-adopter table.

The one documented relationship is the project's origin inside VMware Tanzu. The [VMware OSS blog](https://blogs.vmware.com/opensource/2022/10/25/carvel-sets-sail-for-the-cncf-sandbox/) describes Carvel tooling being used to build and ship Tanzu products. Beyond that lineage, no third-party adopter could be confirmed against a citable source at the time of writing.

## Adoption signals

In the absence of a curated adopter list, the measurable signals are from GitHub, observed via the GitHub API on 2026-06-26:

| Signal | kapp-controller | carvel (umbrella) |
| --- | --- | --- |
| Stars | 315 | 409 |
| Forks | 125 | n/a |
| Open issues | 203 | n/a |
| Contributors | ~76 (including anonymous) | n/a |
| Created | 2019-11-06 | 2019-04-24 |
| Last push | 2026-06-22 | n/a |

The project is a CNCF Sandbox project, accepted on 2022-09-14, per the [CNCF project page](https://www.cncf.io/projects/carvel/).

## Ecosystem

Carvel is itself an ecosystem of tools, and `kapp-controller` is the glue:

- **Fetch sources.** Through `vendir`, an `App` can pull from git, a Helm chart, an HTTP archive, or an OCI imgpkg bundle.
- **Template tools.** The template stage dispatches to `ytt`, `kbld`, `helm`, `sops`, or `cue`, and tools can be chained so one tool's output feeds the next.
- **Deploy tool.** `kapp` applies the rendered resources as a single managed application and can detect and correct drift.
- **Packaging.** `PackageRepository` and `PackageInstall`, backed by the aggregated API server that serves `Package` and `PackageMetadata`, turn an OCI bundle into installable, versioned packages.
- **Secrets.** The secretgen-controller populates placeholder pull secrets, which the fetch stage waits on when an `App` references private images.

## Alternatives

The honest comparison is with other Kubernetes deployment and packaging tools. The distinctions below are drawn from the project's design and an external [comparison of Kubernetes deployment tools](https://nws.netways.de/blog/2024/07/16/comparing-kubernetes-deployment-tools-what-we-got-today).

| Alternative | Differs by |
| --- | --- |
| Argo CD | A full GitOps platform with a UI and application dashboard. Carvel is a composable tool suite with an in-cluster reconciler but no bundled UI. |
| Flux | A GitOps engine centered on syncing git state. Carvel separates fetch, template, and deploy into distinct, swappable stages and tools. |
| Helm | A package manager and templating engine in one binary. Carvel splits those concerns across `ytt` (templating) and `kapp` (apply with drift detection), and can still consume Helm charts in the template stage. |
| Timoni | Packages Kubernetes configuration with CUE. Carvel is tool-agnostic in its template stage, which includes `cue` as one option among several. |
| Glasskube | Provides a UI and a curated package registry, and depends on Flux. Carvel's packaging is driven by its own `PackageRepository` and `PackageInstall` resources. |

Pick Carvel when you want focused, composable tools and an in-cluster reconciler with explicit, stage-by-stage status. Pick a full GitOps platform such as Argo CD when you want a dashboard and an opinionated end-to-end workflow out of the box.

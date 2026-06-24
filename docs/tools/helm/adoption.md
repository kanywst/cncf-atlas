# Adoption & Ecosystem

## Who uses it

The organizations below are the ones listed in Helm's own [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md). The file records that they use Helm; it does not detail each deployment, so the use case column reflects only what the file states.

| Organisation | Use case | Source |
| --- | --- | --- |
| IBM | Listed Helm adopter | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Microsoft | Listed Helm adopter | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Oracle | Listed Helm adopter | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| New Relic | Listed Helm adopter | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Percona | Listed Helm adopter | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Samsung SDS | Listed Helm adopter | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Octopus Deploy | Listed Helm adopter | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Qovery | Listed Helm adopter | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| InfoCert | Listed Helm adopter | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Ville de Montreal | Listed Helm adopter | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |

## Adoption signals

Measured from the GitHub API on 2026-06-22:

- Stars: 29,902
- Forks: 7,670
- Contributors: 371 (last page of the API `Link` header)
- Repository created: 2015-10-06

A CNCF 2025 survey is widely reported to put Helm usage at roughly 75% of Kubernetes users. The primary survey was not located, so this is a secondary citation from comparison write-ups rather than the original report.

## Ecosystem

GitOps controllers such as Argo CD and Flux render and sync Helm charts as a first-class input, so a chart can be the unit a Git-driven pipeline deploys. Charts can be distributed through OCI registries (ECR, GAR, GHCR, Docker Hub) as of Helm 3.8, alongside HTTP chart repositories. Artifact Hub indexes the public chart ecosystem, which holds well over ten thousand charts. Helmfile sits adjacent, orchestrating multiple releases at once.

## Alternatives

Helm's distinguishing trait is the chart: a versioned, distributable package combining Go templates, provenance signing, and OCI distribution. Many open-source projects publish a Helm chart as their primary install path, which no other tool matches in reach. The cost is that Go templating is hard to read and the rendered YAML is harder to validate than a typed configuration. Helm 4 made server-side apply native, closing part of the gap that newer tools targeted.

| Alternative | Differs by |
| --- | --- |
| [Kustomize](https://www.ibm.com/think/insights/kustomize-vs-helm) | No templating; overlays and patches over plain YAML. Built into `kubectl apply -k`. No package distribution model. |
| [Timoni](https://timoni.sh/comparison/) | Uses CUE instead of Go templates, distributes as OCI artifacts with digest pinning and Cosign signing, and applies server-side with Flux drift detection. Still early. |
| [Carvel kapp / Helmfile](https://dev.to/glasskube/our-top-13-deployment-templating-tools-for-kubernetes-4mei) | kapp focuses on apply and diff of resource sets; Helmfile orchestrates many Helm releases declaratively. |

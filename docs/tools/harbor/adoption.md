# Adoption & Ecosystem

## Who uses it

The project's `ADOPTERS.md` lists only organizations running Harbor in production that have publicly shared details. The ones with described usage:

| Organisation | Use case | Source |
| --- | --- | --- |
| JD.com | Registry for the JDOS platform: 2+ years in production, tens of thousands of nodes, millions of images. | `ADOPTERS.md:46-48` |
| China Mobile | 1+ year in production, 1,000+ nodes, about 20,000 images. | `ADOPTERS.md:50-51` |
| 360 Total Security | Image distribution and access control across regions, heavy replication, ~800 nodes, ~20,000 images. | `ADOPTERS.md:53-57` |
| Union Pay | Image management for 200+ nodes with RBAC and vulnerability scanning enforced. | `ADOPTERS.md:69-71` |
| DE-CIX | Replaced a former hosted Docker registry; uses OIDC group mapping, robot accounts, and the vulnerability scanner. | `ADOPTERS.md:92` |

Additional named adopters appear as logos in `ADOPTERS.md:12-42`, including Trend Micro, DataYes, Rancher, Pivotal, Netease Cloud, Anchore, Dynatrace, CERN, and Nederlandse Spoorwegen.

## Adoption signals

Reported repository metrics at the time of writing (accessed 2026-06-22, via `gh api repos/goharbor/harbor`): about 28,755 stars and 5,264 forks. Harbor reached CNCF Graduated status on 2020-06-15, the first open-source registry to do so. Releases follow a regular minor and patch cadence, with v2.14.4 (2026-05-11) the latest GA and v2.16.0 in development at the documented commit.

## Ecosystem

Harbor ships [distribution/distribution](https://github.com/distribution/distribution) as its blob and manifest store and runs in front of it. The default vulnerability scanner is Trivy, registered at startup (`src/core/main.go:331-346`), with other scanners pluggable through the scanner adapter API (the older Clair adapter is gone). Signing is done with Cosign (sigstore), verified on manifest push (`src/server/registry/route.go:81`); the older Notary v1 path is documented but on the way out (`README.md:39`).

Surrounding repositories under the goharbor org include `harbor-helm` (Kubernetes deployment), `harbor-operator`, `harbor-cli`, `terraform-provider-harbor`, and `website`.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| distribution/distribution | The bare backend Harbor wraps. No RBAC, projects, scanning, or UI. |
| Quay (Red Hat) | Comparable feature set; tied more closely to the Red Hat/OpenShift ecosystem. |
| JFrog Artifactory | Commercial, multi-format artifact repository, not just OCI. |
| GitLab Container Registry | Bundled with GitLab CI/CD rather than a standalone registry. |
| Cloud registries (ECR, ACR, GCR, Artifact Registry) | Managed by the cloud provider; no self-hosting and no cross-provider portability. |
| CNCF Dragonfly | P2P artifact distribution; complements Harbor rather than replacing it. |

Pick Harbor when you self-host and want RBAC, multi-tenant projects, replication, scanning, signature verification, quotas, and immutable/retention policy in one system, with tags managed in Harbor's database independently of the backend registry. Pick a managed cloud registry when you do not want to operate the registry yourself.

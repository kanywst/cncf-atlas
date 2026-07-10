# History

## Origin

Eraser started at Microsoft, out of the Azure Kubernetes Service team. The repository was created on 2021-05-28 under `Azure/eraser` (GitHub `createdAt`), with the first commits landing on 2021-06-01. The problem it was built for is specific: the kubelet's image garbage collection deletes cached images by disk-usage threshold and knows nothing about their vulnerability status, so images with known CVEs linger on nodes as an attack surface. The CNCF Sandbox application states this directly as the motivation ([cncf/sandbox issue #24](https://github.com/cncf/sandbox/issues/24)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | Repository created (2021-05-28) at `Azure/eraser`; first commits 2021-06-01 |
| 2023 | Shipped as the AKS "Image Cleaner" managed add-on; accepted into the CNCF Sandbox (2023-06-30) |
| 2023 | Presented at KubeCon NA 2023, "Eraser: Cleaning up Vulnerable Images from Kubernetes Nodes" |
| 2025 | `v1.4.1` released (2025-12-02); `v1.5.0-beta.0` pre-release follows |

## How it evolved

Eraser reached a wider audience in early 2023 through Azure Kubernetes Service, which packages it as the managed "Image Cleaner" add-on that deploys the same `eraser-controller-manager` and collector, scanner, and remover containers ([AKS Image Cleaner docs](https://learn.microsoft.com/en-us/azure/aks/image-cleaner)). The Sandbox application is explicit that the open-source project and the managed add-on run on separate roadmaps, so upstream is not driven by the AKS product ([cncf/sandbox issue #24](https://github.com/cncf/sandbox/issues/24)).

The project entered the CNCF Sandbox on 2023-06-30 ([CNCF project page](https://www.cncf.io/projects/eraser/), [cncf/sandbox issue #24](https://github.com/cncf/sandbox/issues/24)). At KubeCon NA 2023, maintainers Peter Engelbert and Ashna Mehrotra presented the design and the case for pruning vulnerable images from nodes ([session listing](https://kccncna2023.sched.com/event/1R2q9/), [talk archive](https://talks.container-security.site/kubecon%20+%20cloudnative%20north%20america%202023/Eraser-Cleaning-up-Vulnerable-Images-from-Kuberne/)). The repository later moved from `Azure/eraser` to `eraser-dev/eraser`, matching the Sandbox application's stated goal of community ownership over Azure ownership; the git remote and README logo now use `eraser-dev` (`src/README.md:9`).

Under the covers, the CRD API grew through `v1alpha1`, `v1alpha2`, and `v1alpha3` while keeping `v1` as the storage version, with generated conversion code migrating between them (`api/` holds each version plus `zz_generated.conversion.go`). The two CRDs themselves, `ImageList` and `ImageJob`, have stayed the whole scope of the API.

## Where it stands now

Eraser is an active CNCF Sandbox project developed at `eraser-dev/eraser` under the CNCF Code of Conduct (`src/README.md:35`). The most recent stable release is `v1.4.1` (2025-12-02); the documented commit `20576a24` sits on `main` after it, described by git as `v1.5.0-beta.0-57-g20576a24`. The project targets Go 1.24 and carries OpenSSF Best Practices and Scorecard badges in its README (`src/README.md:5-7`). Development continues on the collector, scanner, and remover pipeline and on the pluggable scanner interface (see [Internals](./internals)).

# Adoption & Ecosystem

## Who uses it

Eraser has no ADOPTERS file in the repository, so this page names only the one adopter with a public, citable source and otherwise relies on GitHub signals. The confirmed integration is Azure Kubernetes Service, whose managed "Image Cleaner" add-on runs Eraser internally: Microsoft's documentation states that Image Cleaner deploys the `eraser-controller-manager` along with collector, trivy-scanner, and remover containers to remove unused and vulnerable images ([AKS Image Cleaner docs](https://learn.microsoft.com/en-us/azure/aks/image-cleaner)). The Sandbox application notes the open-source project and the managed add-on are run on separate roadmaps ([cncf/sandbox issue #24](https://github.com/cncf/sandbox/issues/24)).

| Organisation | Use case | Source |
| --- | --- | --- |
| Azure Kubernetes Service | The managed Image Cleaner add-on runs Eraser to remove unused and vulnerable images from nodes | [AKS Image Cleaner docs](https://learn.microsoft.com/en-us/azure/aks/image-cleaner) |

## Adoption signals

As of 2026-07-08 (`gh repo view eraser-dev/eraser`): 611 stars and 71 forks, with roughly 35 contributors from the GitHub contributors API. The repository was created on 2021-05-28 and last pushed on 2026-04-09, and its topics include `cncf`, `kubernetes`, `trivy`, and `security-tools`. Eraser is listed as a CNCF Sandbox project ([CNCF project page](https://www.cncf.io/projects/eraser/), accepted 2023-06-30). The README carries OpenSSF Best Practices and Scorecard badges (`src/README.md:5-7`). The latest stable release is `v1.4.1` (2025-12-02), with `v1.5.0-beta.0` as a pre-release after it.

## Ecosystem

Eraser sits between the container runtime and a scanner. Trivy is the default scanner it runs inside worker Pods, and the scan step is defined by the `ImageProvider` interface so another scanner can replace it (`pkg/scanners/template/scanner_template.go:21`). It talks to containerd or CRI-O through the CRI API, negotiating `v1` with a `v1alpha2` fallback (`pkg/cri/client.go:47`). It exports OTLP metrics from `pkg/metrics`, supports exclusion ConfigMaps, and selects target nodes with include/exclude NodeFilters. The most visible downstream is the AKS Image Cleaner add-on, which wraps the same components as a managed offering ([AKS Image Cleaner docs](https://learn.microsoft.com/en-us/azure/aks/image-cleaner)).

## Alternatives

Eraser's distinction is that it deletes non-running images from nodes on a policy (an explicit list or a vulnerability threshold), while guaranteeing it never removes an image a running container uses.

| Alternative | Differs by |
| --- | --- |
| kubelet image garbage collection | Kubernetes-native, but deletes by disk-usage threshold with no notion of vulnerability or an allow/deny list; Eraser fills that gap ([cncf/sandbox issue #24](https://github.com/cncf/sandbox/issues/24)) |
| Trivy on its own | Finds vulnerabilities but does not remove images from nodes; Eraser runs Trivy as its scanner and acts on the verdict (`pkg/scanners/trivy`) |
| kube-image-keeper | Caches and mirrors in-use images to survive registry outages, so it preserves images rather than deleting them; the opposite goal to Eraser |

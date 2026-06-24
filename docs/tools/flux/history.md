# History

## Origin

Flux started inside Weaveworks in 2016. The same company coined the term GitOps to describe the operating model Flux implements: Git as the single source of truth for declarative infrastructure, reconciled by software running in the cluster. The first public release, v0.1.0, landed on 2017-01-27 (Platform9 history, source 5).

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Flux created at Weaveworks; the GitOps term originates at the same company (source 5). |
| 2017 | v0.1.0 released on 2017-01-27 (source 5). |
| 2019 | Accepted into the CNCF Sandbox on 2019-07-15 (source 2). |
| 2020 | Decision to rebuild the monolithic v1 on controller-runtime and CRDs; Flux v2 begins, v1 moves to maintenance, components become the GitOps Toolkit (source 5). The `fluxcd/flux2` repository was created on 2020-04-24. |
| 2021 | Promoted to CNCF Incubating on 2021-03-12; v2 adds multi-tenancy and syncing any number of Git repositories (source 2). |
| 2022 | Graduated from CNCF on 2022-11-30, alongside Argo CD (sources 2, 3). |
| 2023 | Flux v2 reaches GA; a second security audit completes with zero CVEs (source 4). |

## How it evolved

The defining shift was the v1-to-v2 redesign that began in 2020. v1 was a single monolithic daemon. v2 splits the work across purpose-built controllers built on Kubernetes controller-runtime and custom resources, collectively the GitOps Toolkit (source 5). That decomposition is why the `flux2` repository depends on separate `source-controller`, `kustomize-controller`, `helm-controller`, and `notification-controller` API modules through `go.mod` instead of carrying one binary.

The redesign also widened scope. v2 added multi-tenancy and the ability to sync any number of Git repositories, which the CNCF cited when Flux moved to the Incubator (source 2). During the Incubator stage, the project reported 200 to 500 percent growth across user base, integrations, and contributions (source 2).

## Where it stands now

Flux is a CNCF Graduated project (sources 2, 3) under the fluxcd GitHub organization. The latest release at the time of writing is `v2.8.8`, dated 2026-05-20, with releases cut as tagged versions of the `flux2` repository (source 1). The project ships a CLI plus the GitOps Toolkit controllers, and continues to position itself as the pull-based, controller-driven approach to Kubernetes GitOps (source 4).

# History

## Origin

Argo started at Applatix, a 2016 startup founded by Hong Wang, Jesse Suen, and Alexander Matyushentsev to build a DevOps suite for containers and Kubernetes. The first piece to ship was Argo Workflows (sources 4, 6).

Applatix was acquired by Intuit. Inside Intuit, the team faced a concrete gap: there was no Kubernetes-native deployment tool for managing many clusters and namespaces. Because Intuit is a financial company with compliance requirements, the team chose a GitOps approach where Git is the audited source of truth, and Argo CD was born from that need (sources 4, 6).

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Applatix founded; Argo Workflows is the first project (sources 4, 6) |
| 2017 | Argo open-sourced (source 4) |
| 2018 | Argo Workflows published (2018-01); Argo CD and Argo Events follow; argo-cd repo created on GitHub 2018-02-09 (sources 3, 4, 5) |
| 2019 | Argo Rollouts released (source 4) |
| 2020 | Accepted into the CNCF Incubator (2020-04) (sources 1, 2) |
| 2022 | Argo graduates in CNCF (2022-12-06) (sources 1, 2) |

## How it evolved

Argo CD is one of four sub-projects under the single Argo CNCF entry (CD, Workflows, Rollouts, Events). BlackRock donated Argo Events to the project (sources 1, 4). The founders later started Akuity to offer commercial managed and supported Argo (source 4).

A notable structural shift is visible in the source tree. The diff-and-sync logic lives in `gitops-engine`, which was originally a separate repository (`argoproj/gitops-engine`). At the pinned commit it is vendored into the argo-cd monorepo under `gitops-engine/` and wired in as a local module by `go.mod:374` (`replace github.com/argoproj/argo-cd/gitops-engine => ./gitops-engine`). Import paths changed to match, for example `controller/sync.go:15`.

## Where it stands now

The project is CNCF Graduated. The latest stable release at recon time was `v3.4.4` (2026-06-18), while the pinned master carries `VERSION` `3.6.0` and a `v3.5.0-rc1` exists as a release candidate, so the project ships frequent minor and patch releases off `master`. The module path `github.com/argoproj/argo-cd/v3` (`go.mod:1`) marks the current major line as v3. The CNCF graduation report cited 350+ organisations running it in production, up 250% from incubation (source 1).

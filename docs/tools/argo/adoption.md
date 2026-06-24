# Adoption & Ecosystem

## Who uses it

The repo ships a self-declared adopters list, `USERS.md`, which carried 445 entries at the pinned commit (source 7). The CNCF graduation announcement separately named production adopters (source 1).

| Organisation | Use case | Source |
| --- | --- | --- |
| Adobe | Listed in the project adopters file and graduation announcement | [USERS.md](https://github.com/argoproj/argo-cd/blob/master/USERS.md), [CNCF](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/) |
| BlackRock | Named production adopter; donated Argo Events | [CNCF](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/) |
| Capital One | Named production adopter | [CNCF](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/) |
| Intuit | Originated the project; named adopter | [CNCF](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/) |
| Tesla | Named production adopter | [CNCF](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/) |
| Alibaba Group | Listed in the project adopters file | [USERS.md](https://github.com/argoproj/argo-cd/blob/master/USERS.md) |
| BMW Group | Listed in the project adopters file | [USERS.md](https://github.com/argoproj/argo-cd/blob/master/USERS.md) |
| Bosch | Listed in the project adopters file | [USERS.md](https://github.com/argoproj/argo-cd/blob/master/USERS.md) |

The graduation announcement also names Google, PagerDuty, Peloton, Snyk, Swisscom, and Volvo, and states 350+ organisations run Argo in production, a 250% increase since it entered the incubator (source 1).

## Adoption signals

Observed on 2026-06-22 via the GitHub API for `argoproj/argo-cd` (source 3):

- Stars: 23,219
- Forks: 7,353
- Open issues: 4,216
- Contributors: roughly 2,000+ (contributor pagination reaches page 2033, including anonymous)

## Ecosystem

- Sibling Argo projects: Rollouts (progressive delivery), Workflows, and Events integrate under the same umbrella.
- ApplicationSet (`applicationset/`) mass-produces Applications for multi-cluster and monorepo setups.
- `gitops-engine` is the shared diff and sync library, now vendored into this repo, usable by both Argo CD and Flux-style tools.
- Commercial and managed offerings: Akuity (the founders' company), Codefresh, and Red Hat OpenShift GitOps as a downstream distribution (sources 1, 4).

## Alternatives

Flux CD is the main direct alternative. Both are CNCF Graduated GitOps controllers. Pick Argo CD when you want a bundled web UI, SSO, RBAC, and multi-cluster visualization out of the box with an application-centric model. Pick Flux when you prefer a toolkit of small, composable controllers (the GitOps Toolkit) and do not need a built-in UI.

| Alternative | Differs by |
| --- | --- |
| Flux CD | Composable controller toolkit, no bundled UI; Argo CD is application-centric with an integrated UI/SSO/RBAC |
| Spinnaker | Broader multi-cloud CD platform, heavier and not Git-pull-native |
| Plain CI push (kubectl/Helm in CI) | External push model; Argo CD is pull-based and continuously reconciles drift |

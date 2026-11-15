# Adoption & Ecosystem

## Who uses it

The repository's `ADOPTERS.md` carries no names; it points to the official adopters page and issue #4540. The first-party source for named adopters is the [Karmada Adopters page](https://karmada.io/adopters/), which lists 48 organizations as of 2026-11-16. A sample, all cited from that page (accessed 2026-11-16):

| Organisation | Use case | Source |
| --- | --- | --- |
| Alibaba Cloud | Listed adopter | [karmada.io/adopters](https://karmada.io/adopters/) |
| Bloomberg | Listed adopter | [karmada.io/adopters](https://karmada.io/adopters/) |
| DaoCloud | Listed adopter | [karmada.io/adopters](https://karmada.io/adopters/) |
| Huawei | Listed adopter | [karmada.io/adopters](https://karmada.io/adopters/) |
| iQIYI | Listed adopter | [karmada.io/adopters](https://karmada.io/adopters/) |
| Shopee | Listed adopter | [karmada.io/adopters](https://karmada.io/adopters/) |
| Trip.com | Listed adopter | [karmada.io/adopters](https://karmada.io/adopters/) |
| Vivo | Listed adopter | [karmada.io/adopters](https://karmada.io/adopters/) |
| Wellhub | Listed adopter | [karmada.io/adopters](https://karmada.io/adopters/) |
| ZTO | Listed adopter | [karmada.io/adopters](https://karmada.io/adopters/) |

The adopters page does not describe per-company workloads, so the use case column reflects only listed-adopter status. The CNCF graduation announcement names Bloomberg and Wellhub as global adopters, and one Karmada maintainer leads Bloomberg's streaming platform engineering team ([CNCF announcement](https://www.cncf.io/announcements/2026/09/07/cloud-native-computing-foundation-announces-karmada-graduation/)). The project's origin also names co-initiators First Automobile Works, ICBC, SPD Bank, Qutoutiao, VIPKid, and xiaohongshu ([CNCF blog](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/)).

## Adoption signals

- GitHub: 5,765 stars, 1,252 forks, 917 open issues and pull requests, 72 watchers ([GitHub API](https://api.github.com/repos/karmada-io/karmada), 2026-11-16).
- Contributors: the GitHub API returns 325 contributor accounts (2026-11-16, includes bots). The graduation announcement (2026-09) counts more than 1,214 contributors across 292 organizations, with maintainers from six organizations; at incubation in 2023-12, CNCF reported 500+ contributors from 60+ organizations with 7 maintainers. CNCF's figures and the API count use different counting and are not directly comparable ([CNCF announcement](https://www.cncf.io/announcements/2026/09/07/cloud-native-computing-foundation-announces-karmada-graduation/), [CNCF blog](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/)).
- Release cadence: `v1.18.0` (2026-05-30) and `v1.19.0` (2026-08-31) came three months apart. The latest stable is `v1.19.1` (2026-10-31), released the same day as patches `v1.18.4` and `v1.17.7`, and `v1.20.0-beta.0` is the current pre-release ([GitHub releases](https://github.com/karmada-io/karmada/releases)).
- A formal Adopter Group program launched in 2025-03 ([CNCF blog](https://www.cncf.io/blog/2025/03/26/karmada-launches-adopter-group/)).

## Ecosystem

- **GitOps**: ships interpreter customizations for Flux and Argo, so it can run alongside a GitOps delivery tool.
- **Cross-cluster networking and discovery**: multi-cluster Service (MCS) for service discovery across clusters.
- **Autoscaling**: FederatedHPA and CronFederatedHPA scale across clusters, backed by `karmada-metrics-adapter`.
- **Cross-cluster query**: `karmada-search` provides search and caching over all member clusters.
- **CRD workloads**: third-party interpreters cover Flink, Ray, and Kubeflow CRDs so they can be propagated and replica-split like native workloads.

## Alternatives

Karmada keeps Kubernetes-native templates and adds independent propagation/override policies plus dynamic cross-cluster scheduling and replica splitting, which puts it on the automation-heavy end. Open Cluster Management leans toward placement plus policy and governance. Fleet drives delivery from Git and is weaker at progressive rollout ([CNCF blog, 2022-09-26](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/)).

| Alternative | Differs by |
| --- | --- |
| Open Cluster Management | Governance and policy oriented; foundation under Red Hat ACM. |
| Rancher Fleet | GitOps-driven delivery with label targeting; weaker progressive rollout. |
| Clusternet | CNCF Sandbox multi-cluster management, smaller scope. |
| KubeFed | Deprecated federation v2; Karmada is its successor. |

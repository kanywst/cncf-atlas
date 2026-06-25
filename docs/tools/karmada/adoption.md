# Adoption & Ecosystem

## Who uses it

The repository's `ADOPTERS.md` carries no names; it points to the official adopters page and issue #4540. The first-party source for named adopters is the [Karmada Adopters page](https://karmada.io/adopters/), which lists more than 40 organizations. A sample, all cited from that page (accessed 2026-06-24):

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

The adopters page does not describe per-company workloads, so the use case column reflects only listed-adopter status. The project's origin also names co-initiators First Automobile Works, ICBC, SPD Bank, Qutoutiao, VIPKid, and xiaohongshu ([CNCF blog](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/)).

## Adoption signals

- GitHub: 5,503 stars, 1,149 forks, 746 open issues, 71 watchers ([GitHub API](https://api.github.com/repos/karmada-io/karmada), 2026-06-24).
- Contributors: the GitHub API returns 307 contributor accounts (2026-06-24, includes bots). At incubation in 2023-12, CNCF reported 500+ contributors from 60+ organizations across 20+ countries with 7 maintainers; the two figures use different counting and are not directly comparable ([CNCF blog](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/)).
- Release cadence: `v1.18.0` is the recent stable release (2026-05-30), with `v1.19.0-alpha.0` in progress ([GitHub API](https://api.github.com/repos/karmada-io/karmada)).
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

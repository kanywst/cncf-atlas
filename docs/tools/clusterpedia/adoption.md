# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS` file, and no public case study, talk, or engineering blog names a specific organization running Clusterpedia in production. To avoid inventing adopters, none are listed here. The most concrete affiliation is the project's origin and maintainership: two of the three maintainers are from DaoCloud, the company that open-sourced the project, and one is from China Mobile Cloud (`MAINTAINERS.md`).

## Adoption signals

Measured from the [GitHub REST API repo metadata](https://api.github.com/repos/clusterpedia-io/clusterpedia), observed 2026-06-27:

| Signal | Value |
| --- | --- |
| Stars | 878 |
| Forks | 126 |
| Contributors | 41 |
| Open issues | 65 |
| Repository created | 2021-10-08 |
| Last push | 2026-06-18 |

Release cadence: the latest stable tag is v0.9.1 (2026-04-16), supplemented by Kubernetes-version-tracking tags such as `v0.9.1-k8s1.32.13`. The project was accepted into the CNCF Sandbox on 2022-06-17 ([CNCF project page](https://www.cncf.io/projects/clusterpedia/)).

## Ecosystem

Clusterpedia is built to sit on top of multi-cluster platforms rather than replace them. The README states it can automatically import clusters managed by Cluster API, Karmada, Clusternet, vCluster, and KubeVela. It deliberately leaves cross-cluster networking to other tools, and the README points at Submariner, Skupper, and tower for that layer ([README.md](https://github.com/clusterpedia-io/clusterpedia/blob/main/README.md)).

The storage layer is pluggable. The default `internalstorage` backend supports MySQL and PostgreSQL, and the README states intent to add graph-database and Elasticsearch layers. The official Helm chart lives in a separate repository, [clusterpedia-io/clusterpedia-helm](https://github.com/clusterpedia-io/clusterpedia-helm), which pulls in the Bitnami PostgreSQL and MySQL subcharts.

## Alternatives

Clusterpedia occupies the search and observability corner of multi-cluster management. The tools below address adjacent problems, so the honest framing is which layer you need rather than a head-to-head winner.

| Alternative | Differs by |
| --- | --- |
| Karmada | Orchestrates and schedules workloads across clusters (placement and federation); Clusterpedia only reads and searches resource state. They compose rather than compete ([CNCF blog](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/)). |
| Open Cluster Management | Focuses on fleet governance and policy distribution; Clusterpedia adds cross-cluster resource search on top. |
| Per-cluster `kubectl` | The baseline: query each cluster separately. Clusterpedia trades a central database for one OpenAPI-compatible endpoint and richer search. |
| Prometheus / observability stacks | Aggregate metrics, traces, and logs. Clusterpedia aggregates the Kubernetes resource objects themselves and keeps them queryable with `client-go`. |

Pick Clusterpedia when you want one `kubectl`-compatible endpoint to search resources across many clusters, including clusters on different Kubernetes versions. Pick a federation tool such as Karmada when the job is placing or scheduling workloads, not searching them.

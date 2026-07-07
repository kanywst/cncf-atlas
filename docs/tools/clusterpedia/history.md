# History

## Origin

Clusterpedia was created by DaoCloud and open-sourced in late 2021. The GitHub repository was created on 2021-10-08. Its founding sponsor is Iceber Gu (Cai Wei) of DaoCloud, who remains a maintainer. The project background is described on the [Clusterpedia.io blog](https://clusterpedia.io/blog/2022/03/01/demo-video-clusterpedia-complex-retrieval-of-resources-in-a-multi-cloud-environment/) and the [DaoCloud community docs](https://docs.daocloud.io/en/community/clusterpedia).

The problem it set out to solve: when you run many Kubernetes clusters, there is no single place to search resources across all of them. Each cluster has its own apiserver and its own etcd, so a question like "show every Deployment in the fleet" means querying each cluster in turn. The name is a play on Wikipedia, reflecting the idea of one searchable encyclopedia of cluster state, as stated in the [README](https://github.com/clusterpedia-io/clusterpedia/blob/main/README.md).

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | Repository created (2021-10-08), open-sourced by DaoCloud |
| 2022 | Accepted into the CNCF Sandbox on 2022-06-17 ([CNCF project page](https://www.cncf.io/projects/clusterpedia/)) |
| 2026 | v0.9.1 released (2026-04-16); pinned commit `bece343` is on main, ahead of that tag |

## How it evolved

Clusterpedia entered the CNCF Sandbox on 2022-06-17, which positioned it inside a broader multi-cluster story. After the end of life of KubeFed, the gap in multi-cluster management was filled from two angles: Karmada took orchestration and Open Cluster Management took fleet governance, while Clusterpedia took search and observability of resource state. The [CNCF blog on Karmada and Open Cluster Management](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/) frames these as complementary rather than competing.

The codebase settled on a four-binary split (`apiserver`, `binding-apiserver`, `clustersynchro-manager`, `controller-manager`) built by `make all` (`Makefile:21`), with a pluggable storage layer so the backing database can be swapped. The default storage layer supports MySQL and PostgreSQL, and the README notes intent to add graph-database and Elasticsearch layers later.

## Where it stands now

The latest stable tag is v0.9.1 (released 2026-04-16). The project also cuts Kubernetes-version-tracking tags (for example `v0.9.1-k8s1.32.13`) so the Aggregated API can match the host Kubernetes version. Governance follows a role hierarchy of Member, Reviewer, Approver, and Maintainer defined through OWNERS files (`GOVERNANCE.md`). There are three maintainers (`MAINTAINERS.md`): Calvin Chen (@calvin0327, DaoCloud), Iceber Gu (@Iceber, DaoCloud), and wuyingjun (@wuyingjun-lucky, China Mobile Cloud). Development remains active, with the most recent push observed on 2026-06-18.

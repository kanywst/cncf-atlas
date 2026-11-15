# History

## Origin

OCM was originally developed by IBM and Red Hat ([CNCF blog, 2026-11-10](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/)). It is the open source upstream of Red Hat Advanced Cluster Management for Kubernetes (RHACM), and Red Hat lists itself in the adopters file as a founding member that uses OCM as a foundational component of RHACM ([ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md)).

The problem it set out to solve is the one in its README: nobody runs just one cluster, and managing many heterogeneous clusters from many vendors should be simple. The project's stated goal is to "multicluster everything", with vendor neutral APIs aligned with Kubernetes SIG Multicluster ([README](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/README.md)).

The code started as separate repositories, one per component. The `registration` repo's initial commit is dated 2020-03-30 ([commit](https://github.com/open-cluster-management-io/registration/commit/b3484a7ee6)). The `api` repo was created on 2020-03-11, `work` on 2020-04-16, `registration-operator` on 2020-04-27, `addon-framework` on 2020-08-24, `placement` on 2021-04-22, and the `clusteradm` CLI on 2021-05-20 ([GitHub API, organization repositories](https://api.github.com/orgs/open-cluster-management-io/repos)).

## Timeline

| Date | Milestone |
| --- | --- |
| 2020-03 | `api` and `registration` repositories created; work, operator, and add-on framework follow during 2020. |
| 2021-04 | `placement` repository created. |
| 2021-11-09 | Accepted into the CNCF Sandbox ([CNCF](https://www.cncf.io/projects/open-cluster-management/), [cncf/sandbox#227](https://github.com/cncf/sandbox/issues/227)). |
| 2022-10 | CNCF update reports 70+ contributors from 15+ companies, and positions OCM as a successor after KubeFed was archived ([CNCF blog](https://www.cncf.io/blog/2022/10/31/open-cluster-management-november-2022-update/)). |
| 2023-05-25 | registration, work, placement, and registration-operator are merged into one `ocm` repository ([merge commit](https://github.com/open-cluster-management-io/ocm/commit/d49263f7e6)). |
| 2023-09-18 | `v0.11.0`, the first release from the consolidated repo ([releases](https://github.com/open-cluster-management-io/ocm/releases)). |
| 2025-06-16 | `v1.0.0`: CEL-based cluster selection and an Argo CD pull-model add-on. |
| 2025-09-17 | Incubation application opened ([cncf/toc#1884](https://github.com/cncf/toc/issues/1884)). |
| 2025-10-22 | `v1.1.0`: a gRPC-based hub to spoke connection, add-ons for Kueue MultiKueue and OpenTelemetry. |
| 2026-01-30 | `v1.2.0`: advanced Placement configuration, automatic hosting cluster resolution, argocd-agent integration. |
| 2026-05-09 | `v1.3.0`: ManifestWork resource ordering, AddOnTemplate API at v1beta1. |
| 2026-10-07 | `v1.4.0`: PlacementDecisions synced to the SIG Multicluster PlacementDecision API, ManifestWork apply metrics and logs, NetworkPolicies. |
| 2026-11-04 | TOC vote closes and OCM moves to Incubating ([cncf/toc#2360](https://github.com/cncf/toc/issues/2360)). |

Release dates come from the GitHub releases page. The feature summaries for 1.0 through 1.4 come from the CNCF incubation announcement ([CNCF blog, 2026-11-10](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/)).

## How it evolved

The early design split each concern into its own repository with its own release: registration, work, placement, the operators. In May 2023 the maintainers pulled the four core repositories into `ocm` on a branch named `consolidate-code-from-0.11.0`, then archived the old repositories ([merge commit](https://github.com/open-cluster-management-io/ocm/commit/d49263f7e6), [GitHub API, organization repositories](https://api.github.com/orgs/open-cluster-management-io/repos)). The API types and the add-on framework still live in their own repositories and are vendored into `ocm` under `vendor/open-cluster-management.io/`.

Two threads run through the later releases. The first is transport. The default is still the hub's kube-apiserver (`pkg/work/spoke/options.go:40`), but the work agent now also accepts MQTT, gRPC, and Kafka as the source of ManifestWorks (`pkg/work/spoke/options.go:56-57`), and 1.1 added a gRPC-based connection between the hub and the spoke (managed cluster), served by the hub's `server` binary (`cmd/server/main.go:37-38`). The second is alignment with SIG Multicluster: the hub can publish a ClusterProfile (the SIG Multicluster cluster inventory object) for each cluster and copy PlacementDecisions into the SIG's own PlacementDecision type, both behind alpha feature gates at the documented commit (`vendor/open-cluster-management.io/api/feature/feature.go:139,150`; [cluster-inventory-api](https://github.com/kubernetes-sigs/cluster-inventory-api)).

## Where it stands now

At the documented commit (`b4e4b23`, 2026-11-13), OCM is a CNCF Incubating project and the latest release is `v1.4.0`. The README at that commit still calls it a sandbox project (`README.md:10`), which predates the level change. At incubation CNCF reported 27 maintainers from eight organizations, 537 contributors from 84 organizations in 16 countries, and 1,370 pull requests ([CNCF blog, 2026-11-10](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/)). On 2026-11-15 the `ocm` repository showed 1,133 stars and 193 forks ([GitHub API](https://api.github.com/repos/open-cluster-management-io/ocm)).

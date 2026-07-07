# Clusterpedia

> Clusterpedia syncs the resources of many Kubernetes clusters into one relational database and serves them back as a Kubernetes Aggregated API, so plain `kubectl` can search across every cluster at once.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [clusterpedia-io/clusterpedia](https://github.com/clusterpedia-io/clusterpedia)
- **Documented at commit**: `bece343` (2026-04-30, main, ahead of tag v0.9.1)

## What it is

Clusterpedia is a multi-cluster control-plane component that collects Kubernetes resources from a fleet of clusters into a central store and lets you query them through one endpoint. A cluster is registered with a Custom Resource Definition (CRD) named `PediaCluster`, which holds both the connection credentials and the list of resources to synchronize. A synchro manager runs informers against each registered cluster and writes every observed object into a storage backend (MySQL or PostgreSQL by default).

The query side registers as a Kubernetes Aggregated API. Because it reuses the upstream Kubernetes apiserver list and get handlers, the responses are OpenAPI-compatible, so `kubectl`, `client-go`, and existing tooling work unchanged. On top of the standard list semantics, Clusterpedia adds cross-cluster filtering, fuzzy name search, field search over arbitrary object paths, and version conversion so resources stored from different Kubernetes versions can be retrieved at one requested version.

Clusterpedia does not schedule or place workloads, and it does not solve network connectivity between clusters. Its scope is collecting state into a central database and serving cross-cluster reads on top of it. The project describes itself as a Wikipedia for your clusters, which is where the name comes from.

## When to use it

- You operate many Kubernetes clusters and want one `kubectl`-compatible endpoint to search resources across all of them.
- You need search semantics the native API lacks: filter by cluster set, namespace set, owner, fuzzy name, or arbitrary object fields.
- You want to query resources from clusters running different Kubernetes versions at a single normalized version.
- You want a durable record of resource state that outlives the source clusters' etcd.
- Not a fit when you need to place or orchestrate workloads across clusters; that is the job of a federation tool such as Karmada.
- Not a fit when you need metrics, traces, or logs; Clusterpedia stores Kubernetes resource objects, not observability telemetry.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [clusterpedia-io/clusterpedia repository](https://github.com/clusterpedia-io/clusterpedia)
2. [README.md (main)](https://github.com/clusterpedia-io/clusterpedia/blob/main/README.md)
3. [CNCF project page (Sandbox, accepted 2022-06-17)](https://www.cncf.io/projects/clusterpedia/)
4. [Demo Video: Complex Retrieval of Resources in a Multi-Cloud Environment](https://clusterpedia.io/blog/2022/03/01/demo-video-clusterpedia-complex-retrieval-of-resources-in-a-multi-cloud-environment/)
5. [DaoCloud community docs: Clusterpedia](https://docs.daocloud.io/en/community/clusterpedia)
6. [CNCF blog: Karmada and Open Cluster Management](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/)
7. [Quickly Deploy Clusterpedia with Helm](https://clusterpedia.io/blog/2022/04/11/quickly-deploy-clusterpedia-with-helm/)
8. [Clusterpedia Installation](https://clusterpedia.io/docs/installation/)
9. [Clusterpedia Import Clusters](https://clusterpedia.io/docs/usage/import-clusters/)
10. [Clusterpedia Sync Cluster Resources](https://clusterpedia.io/docs/usage/sync-resources/)
11. [clusterpedia-io/clusterpedia-helm chart](https://github.com/clusterpedia-io/clusterpedia-helm)
12. [GitHub REST API repo metadata](https://api.github.com/repos/clusterpedia-io/clusterpedia)

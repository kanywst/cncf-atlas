# Open Cluster Management

> A hub and spoke system for registering many Kubernetes clusters with one hub and having an agent on each cluster pull its work from that hub.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [open-cluster-management-io/ocm](https://github.com/open-cluster-management-io/ocm)
- **Documented at commit**: `b4e4b23` (2026-11-13, main, after tag `v1.4.0`)

## What it is

Open Cluster Management (OCM) manages a fleet of Kubernetes clusters from one hub cluster. The hub runs the Cluster Manager. Each managed cluster runs an agent called the klusterlet, which registers the cluster with the hub and carries out the hub's instructions ([README](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/README.md)). The hub is an ordinary Kubernetes cluster. Everything OCM adds is a set of CRDs and controllers on it.

Four APIs make up the core. Registration (cluster inventory) brings a cluster under management through a handshake that both the hub admin and the cluster admin must approve. ManifestWork wraps Kubernetes manifests that should be applied on one managed cluster. Placement picks a set of clusters by labels, claims (facts a managed cluster reports about itself), taints (marks that keep work off a cluster unless tolerated, as on nodes), or scores, and writes the result as a PlacementDecision that any controller can read. The add-on framework lets other projects ship an agent to every managed cluster and give it hub credentials ([README](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/README.md)).

The model is pull based. The agent on each managed cluster connects out to the hub, watches only its own namespace there, and applies what it finds. In the default install mode the hub holds no credentials for the managed clusters. OCM does not create clusters (that is Cluster API's job) and does not ship its own GitOps engine. Projects such as Argo CD, KubeVela, Kueue, and KubeStellar build on its APIs instead ([ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md)).

OCM is the upstream of Red Hat Advanced Cluster Management for Kubernetes. It joined the CNCF Sandbox on 2021-11-09 and moved to Incubating on 2026-11-04 ([CNCF project page](https://www.cncf.io/projects/open-cluster-management/)).

## When to use it

- You run tens or hundreds of clusters and want one inventory of them with health, labels, and claims kept current by an agent on each cluster.
- Managed clusters sit behind NAT or firewalls, or you do not want a central system to hold admin credentials for every cluster. The agents dial out to the hub.
- You are building a multicluster tool (a GitOps controller, a batch scheduler, a DR system) and want a standard cluster inventory, a placement API, and a way to deploy and credential an agent on every cluster.
- You want Argo CD to deploy per cluster while the decision of which clusters get what lives in one place.

If you want a single control plane that takes a plain Deployment and splits its replicas across clusters for you, Karmada does more of that out of the box. If you have two or three clusters and a GitOps tool already targets them, OCM adds a hub you may not need.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [open-cluster-management-io/ocm README](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/README.md) at `b4e4b23`, accessed 2026-11-15.
2. [ADOPTERS.md](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) at `b4e4b23`, accessed 2026-11-15.
3. [Open Cluster Management CNCF project page](https://www.cncf.io/projects/open-cluster-management/), accessed 2026-11-15.
4. [Open Cluster Management (OCM) becomes a CNCF Incubating Project](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/), CNCF blog, 2026-11-10.
5. [cncf/toc#1884: OCM Incubation Application](https://github.com/cncf/toc/issues/1884), accessed 2026-11-15.
6. [cncf/toc#2360: OCM level change to Incubation](https://github.com/cncf/toc/issues/2360), accessed 2026-11-15.
7. [cncf/sandbox#227: Sandbox project onboarding](https://github.com/cncf/sandbox/issues/227), accessed 2026-11-15.
8. [Open Cluster Management November 2022 update](https://www.cncf.io/blog/2022/10/31/open-cluster-management-november-2022-update/), CNCF blog, 2022-10-31.
9. [Karmada and Open Cluster Management: two new approaches to the multicluster fleet management challenge](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/), CNCF blog, 2022-09-26.
10. [open-cluster-management-io/ocm releases](https://github.com/open-cluster-management-io/ocm/releases), accessed 2026-11-15.
11. [OCM Quick Start](https://open-cluster-management.io/docs/getting-started/quick-start/), accessed 2026-11-15.
12. [GitHub REST API: repos/open-cluster-management-io/ocm](https://api.github.com/repos/open-cluster-management-io/ocm), accessed 2026-11-15.
13. [kubernetes-sigs/cluster-inventory-api](https://github.com/kubernetes-sigs/cluster-inventory-api), accessed 2026-11-15.

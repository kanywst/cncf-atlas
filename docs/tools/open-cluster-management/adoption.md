# Adoption & Ecosystem

## Who uses it

Every organization below is listed in the project's `ADOPTERS.md` at the documented commit, with the use case the organization supplied ([ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md)). Where another public source covers the same adopter, it is linked too.

| Organization | Type, since | Use case | Source |
| --- | --- | --- | --- |
| Red Hat | Vendor, 2021 | Founding member. OCM is a foundational component of Red Hat Advanced Cluster Management for Kubernetes. | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| Alibaba Cloud | Vendor, 2021 | The Fleet management feature of ACK One, its distributed cloud container platform, is based on OCM. | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md), [KubeCon China 2021 talk](https://kccncosschn21.sched.com/event/pcaU) |
| Ant Group | End user, 2021 | Dozens of clusters around the world with thousands of nodes each, added and managed through the hub. | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| eBay | End user, 2024 | Application deployment across 190+ clusters. ManifestWork and Placement carry Argo CD Project and Application manifests; Argo CD in each cluster does the deploy. | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md), [CNCF blog](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/) |
| AppsCode | End user and contributor, 2022 | Multicluster management in the AppsCode Container Engine, with custom add-ons for databases run by KubeDB. | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| Xiaohongshu | End user, 2022 | Early adopter. | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| Spectro Cloud | Vendor, 2025 | Federation of resources across clusters in its Mural platform. | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| Guidewire | End user, 2025 | Cloud platform for its insurance customers. Contributed AWS IAM based registration for EKS clusters. | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| Groww | End user, 2025 | Cell-based deployment, with an in-house rollout controller that generates ManifestWorks progressively under manual control. | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md), [CNCF blog](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/) |
| VESSL AI | End user and contributor, 2025 | GPU clusters across several cloud providers register to one hub, which places AI training and inference workloads. | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md), [CNCF blog](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/) |

The adopters file also lists two integrations: RamenDR, a Placement extension for disaster recovery of workloads and their persistent data, and KubeStellar Console, which includes a guided OCM install. It notes that non-public adopters exist as well.

## Adoption signals

- CNCF incubation announcement (2026-11-10): 27 maintainers from eight organizations including Red Hat, Guidewire, eBay, AppsCode, and Spectro Cloud; 537 contributors from 84 organizations in 16 countries; 1,370 pull requests ([CNCF blog](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/)).
- GitHub, 2026-11-15: 1,133 stars and 193 forks on `open-cluster-management-io/ocm` ([GitHub API](https://api.github.com/repos/open-cluster-management-io/ocm)). The contributors API lists 106 accounts for that one repository. The CNCF figure covers more repositories, so the two numbers are not comparable.
- In 2022 the project reported 70+ contributors from 15+ companies ([CNCF blog, 2022-10-31](https://www.cncf.io/blog/2022/10/31/open-cluster-management-november-2022-update/)).
- Release cadence: `v1.0.0` in June 2025, then four minor releases to `v1.4.0` in October 2026 ([releases](https://github.com/open-cluster-management-io/ocm/releases)).

## Ecosystem

The adopters file keeps a list of integrations ([ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md)). The main patterns:

- **GitOps.** Argo CD's Cluster Decision Resource generator reads OCM PlacementDecisions to decide which clusters an ApplicationSet targets. The Argo CD add-on and Argo CD Agent turn this into a pull model where each cluster runs its own Argo CD. See the [Argo deep-dive](../argo/).
- **Batch and AI scheduling.** Kueue's MultiKueue can use OCM to set up its worker clusters. Fluid and Flower have add-ons.
- **Application platforms.** [KubeVela](../kubevela/) and KubeStellar document running on top of OCM.
- **Networking and mesh.** Submariner and an Istio multicluster mesh are packaged as add-ons.
- **Cluster lifecycle.** Cluster API creates clusters and OCM registers them; the repo ships a guide under `solutions/cluster-api`.
- **Observability and tooling.** OpenTelemetry add-on, Meshery, a Backstage plugin from Janus, and Krkn chaos testing.
- **Other multicluster engines.** [Clusternet](../clusternet/) ships an OCM add-on.

## Alternatives

A 2022 CNCF blog post comparing the two projects describes the split this way: "Karmada provides a more complete full stack end to end solution", while "OCM provides a robust modular framework and APIs that enable other Kubernetes ecosystem projects to integrate with it" ([CNCF blog, 2022-09-26](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/)).

| Alternative | How it differs |
| --- | --- |
| [Karmada](../karmada/) | Runs its own API server that accepts plain Deployments as templates and propagates them with policies. Splits replicas across clusters. Supports Push and Pull. OCM's hub is a stock cluster and its delivery unit is an explicit ManifestWork per cluster. |
| [Clusternet](../clusternet/) | Also hub and agent, with its own scheduling and propagation APIs. Can run as an OCM add-on. |
| KubeFed | Kubernetes federation v2, now [archived](https://github.com/kubernetes-retired/kubefed). OCM described itself as a successor after the archival and ships a migration guide under `solutions/migrate-kubefed`. |
| Argo CD on its own | An ApplicationSet can target the clusters registered in Argo CD itself. With OCM, cluster selection moves to Placement, and with the pull-model add-on each managed cluster runs its own Argo CD ([CNCF blog](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/)). |

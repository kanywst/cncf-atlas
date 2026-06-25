# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS.md` at the pinned commit; the named adopter list lives on the CNCF side. The CNCF Incubating announcement (2023-03-02) explicitly lists the organisations below ([CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/)).

| Organisation | Use case | Source |
| --- | --- | --- |
| Alibaba Group | Runs OpenKruise workloads at Double 11 scale, near 100,000 workloads and millions of containers | [Alibaba Cloud blog](https://www.alibabacloud.com/blog/openkruise-the-cloud-native-platform-for-the-comprehensive-process-of-alibabas-double-11_596966) |
| Baidu | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| Bringg | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| LinkedIn | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| Lyft | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| Shopee | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| Oppo | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| Spectro Cloud | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |

## Adoption signals

Measured against the GitHub REST API on 2026-06-24 ([API](https://api.github.com/repos/openkruise/kruise)):

- Stars: 5,273. Forks: 892. Open issues: 93.
- Contributors: the contributors API paginates to roughly 160-plus (page 161 at per_page=1, anonymous included).
- Repository created 2019-05-30, last push 2026-06-21, latest release v1.9.0 (2026-06-21).
- Single-language Go codebase.

## Ecosystem

- kruise-rollouts: a separate repository for progressive delivery that can drive OpenKruise workloads.
- OpenKruiseGame (kruise-game): game-server-oriented workloads built on the same foundation.
- kruise Helm charts: the supported install path.
- KubeVela / OAM: layer application models on top of OpenKruise workloads (same Alibaba-origin ecosystem).
- Service meshes: SidecarSet sidecar management overlaps with and complements mesh sidecar operations such as Istio's; since v1.7 SidecarSet supports native Kubernetes sidecar containers.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Upstream Deployment / StatefulSet / DaemonSet | OpenKruise's CloneSet, Advanced StatefulSet, and Advanced DaemonSet are supersets: in-place update, partition canary, per-Pod PVC, deletion-cost control, parallel update. |
| Argo Rollouts / Flagger | Progressive delivery (canary, blue-green, metric analysis, traffic shifting) is the focus. OpenKruise focuses on avoiding Pod recreation and on workload primitives; Argo Rollouts can target a CloneSet as the managed workload. |
| KubeVela / OAM | Application-model and platform layer above the workloads, not a workload controller itself. |

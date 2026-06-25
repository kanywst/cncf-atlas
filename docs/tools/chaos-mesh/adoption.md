# Adoption & Ecosystem

## Who uses it

The repository's `ADOPTERS.md` lists more than 40 organizations. The entries below are the ones with a public, citable account of how they use Chaos Mesh. ADOPTERS entries are self-reported, so the depth of "production use" varies by how each company described it.

| Organisation | Use case | Source |
| --- | --- | --- |
| ByteDance | Integrated Chaos Mesh as the fault injection engine under its internal chaos platform. | [ADOPTERS.md](https://github.com/chaos-mesh/chaos-mesh/blob/master/ADOPTERS.md) |
| Tencent (Interactive Entertainment) | Fault isolation and service degradation testing after migrating to TKE. | [Chaos Mesh blog](https://chaos-mesh.org/blog/Securing-Online-Gaming-Combine-Chaos-Engineering-with-DevOps-Practices/) |
| DataStax | Built Chaos Mesh into Fallout for testing AstraDB, its Cassandra-based DBaaS. | [Talk](https://youtu.be/Kw7gMurHJnQ) |
| Authzed | Uses TimeChaos to fake vDSO clock time when testing SpiceDB. | [Talk](https://youtu.be/3rjWxgdtBTw) |
| Percona | Chaos testing of Percona Kubernetes Operators. | [Percona blog](https://www.percona.com/blog/2020/11/05/chaosmesh-to-create-chaos-in-kubernetes/) |
| NetEase Fuxi Lab | Improving the stability of its internal hybrid cloud. | [ADOPTERS.md](https://github.com/chaos-mesh/chaos-mesh/blob/master/ADOPTERS.md) |

The CNCF project page also lists ByteDance, NetEase, PingCAP, Tencent, and Microsoft Azure among adopters. Other names in `ADOPTERS.md` include RabbitMQ, GreptimeDB, KingNet, DigitalChina, Xpeng, Maycur, Prudential, and Qiniu.

## Adoption signals

Measured on 2026-06-24 from the GitHub REST API for `repos/chaos-mesh/chaos-mesh`:

- Stars: 7,763
- Forks: 1,007
- Open issues: 549
- Contributors: roughly 221 (including anonymous)
- Created: 2019-09-04; last push: 2026-06-23

A comparative study (arXiv 2505.13654) counts 74 Chaos Mesh releases against 106 for LitmusChaos and frames the two as the leading Kubernetes-native chaos tools with sustained long-term adoption.

## Ecosystem

- Microsoft Azure Chaos Studio integrates Chaos Mesh faults to run experiments against AKS, including pod kill ([Azure docs](https://docs.microsoft.com/en-us/azure/chaos-studio/chaos-studio-tutorial-aks)).
- Distribution through the KubeSphere App Store and the Civo Kubernetes marketplace.
- Built-in Prometheus metrics, plus Workflow (Argo-style experiment orchestration) and Schedule (cron) bundled in the project itself.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| LitmusChaos (CNCF) | ChaosHub ships 50+ prebuilt experiments and broad multi-cloud coverage, but uses a two-stage `ChaosEngine` + `ChaosExperiment` CRD model that is more verbose. |
| Chaos Toolkit | Generic, declarative chaos framework that is not Kubernetes-specific. |
| Gremlin / Steadybit | Commercial SaaS chaos platforms. |
| AWS FIS | AWS-managed fault injection, scoped to AWS resources. |
| Chaos Monkey / Simian Army | Netflix's platform-agnostic originals, focused on instance termination rather than fine-grained faults. |

Pick Chaos Mesh when you are on Kubernetes, want one CRD per fault type for a clean `kubectl apply` and GitOps fit, and need its low-level faults (TimeChaos, JVMChaos, KernelChaos, IOChaos) for testing distributed consensus, locks, or TTL caches. The trade-off is that it assumes a privileged DaemonSet and is therefore invasive to the cluster, with higher operational cost ([Container Solutions comparison](https://blog.container-solutions.com/comparing-chaos-engineering-tools)).

## Sources

1. ADOPTERS.md: <https://github.com/chaos-mesh/chaos-mesh/blob/master/ADOPTERS.md>
2. Chaos Mesh project page (CNCF): <https://www.cncf.io/projects/chaosmesh/>
3. GitHub REST API repos/chaos-mesh/chaos-mesh: <https://api.github.com/repos/chaos-mesh/chaos-mesh>
4. Microsoft Azure Chaos Studio + Chaos Mesh (AKS): <https://docs.microsoft.com/en-us/azure/chaos-studio/chaos-studio-tutorial-aks>
5. LitmusChaos vs Chaos Mesh (reintech): <https://reintech.io/blog/litmuschaos-vs-chaos-mesh-kubernetes-chaos-tool-comparison-2026>
6. Comparing Chaos Engineering Tools (Container Solutions): <https://blog.container-solutions.com/comparing-chaos-engineering-tools>
7. Chaos Engineering in the Wild (arXiv 2505.13654): <https://arxiv.org/html/2505.13654v1>

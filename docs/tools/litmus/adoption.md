# Adoption & Ecosystem

## Who uses it

The project keeps a sourced ADOPTERS file that classifies users as end users, vendors, and solution providers. The named adopters below each carry a citation in that file or an external link.

| Organisation | Use case | Source |
| --- | --- | --- |
| Intuit | Argo-based chaos workflows | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md), [talk](https://youtu.be/Uwqop-s99LA?t=720) |
| Orange | Cloud infrastructure resiliency | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| Mercedes-Benz | Resilience testing (per-org story) | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| Adidas | Resilience testing (per-org story) | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| Lenskart | Resilience testing (per-org story) | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| iFood | Resilience testing (per-org story) | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| Red Hat | OpenShift Virtualization chaos | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| VMware | Vendor / integration | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |

The ADOPTERS file lists more named end users, including FIS, Halodoc, Kitopi, AB-InBev, Flipkart, Talend, Delivery Hero, Emirates NBD, and Amadeus. When Litmus was promoted to CNCF Incubating in January 2022, the announcement noted 25+ organizations running it in production, naming Intuit, Lenskart, Orange, Red Hat, and VMware among them.

## Adoption signals

Measured from the GitHub API on 2026-06-24 for `litmuschaos/litmus`:

- Stars: 5,466
- Forks: 880
- Open issues: 438
- Contributors: about 304 (including anonymous)
- Latest release: 3.30.0 (2026-06-17)

The project carries an OpenSSF Best Practices badge (project 3202) and a FOSSA license scan.

## Ecosystem

Litmus is split across several repositories in the LitmusChaos org (star counts as of 2026-06-24):

- `chaos-operator` (156): the execution-plane reconciler for ChaosEngine.
- `chaos-charts` (91): the ChaosHub bundle of experiment YAML.
- `litmus-go` (83): the Go chaos faults themselves (the go-runner).
- `litmus-helm` (59): the Helm charts.
- `chaos-exporter` (36): Prometheus metrics.
- `litmusctl` (32): the agent-plane management CLI.
- `chaos-runner` (29), `litmus-python`, `github-chaos-actions` (CI integration), and `litmus-mcp-server` (18).

It integrates with Argo Workflows (experiments run as Argo Workflows), Prometheus and Grafana (metrics and dashboards, under `chaoscenter/graphql/server/grafana/`), Kubernetes RBAC, GitOps, and Spring Boot ALFI for application-level fault injection.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Chaos Mesh | Also K8s-native and CNCF Incubating; CRD-based with a broad set of fault types. Litmus differs by its ChaosHub sharing model and the ChaosCenter control plane with agent dial-back across clusters. |
| Chaos Toolkit | Language-agnostic JSON/YAML experiment spec, not Kubernetes-specific. Litmus is K8s-native and CRD/operator-driven. |
| Gremlin | A commercial SaaS. Litmus is open source and self-hosted. |
| AWS FIS | Managed and limited to AWS resources. Litmus is cloud-agnostic and centered on Kubernetes workloads. |

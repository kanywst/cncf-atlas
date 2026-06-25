# Adoption & Ecosystem

## Who uses it

These are the organisations listed in the project's `ADOPTERS.MD` at the documented commit. Only cited adopters are included here.

| Organisation | Use case | Source |
| --- | --- | --- |
| Kubecost | Service provider; OpenCost is the basis of Kubecost Free, Business, and Enterprise | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |
| Grafana Labs | End user; documented in an engineering blog | [Grafana Labs blog](https://grafana.com/blog/2023/02/02/how-grafana-labs-uses-and-contributes-to-opencost-the-open-source-project-for-real-time-cost-monitoring-in-kubernetes/) |
| Microsoft | Service provider; offers OpenCost on AKS | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |
| Zendesk | End user | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |
| National Information Solutions Cooperative | End user | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |
| CloudAdmin | Service provider | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |
| mindcurv group | Consultancy | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |

## Adoption signals

From the GitHub API for `opencost/opencost`, observed 2026-06-24: 6,603 stars, 829 forks, and 239 open issues. The contributor count is roughly 169, or about 197 including anonymous contributors. OpenCost is a CNCF Incubating project, having advanced from the Sandbox (accepted 2022-06-17) to Incubating on 2024-10-25.

## Ecosystem

OpenCost is split across several repositories: `opencost/opencost-helm-chart` (the official install path), `opencost/opencost-ui` (the UI), `opencost/opencost-plugins` (external cost plugins for Datadog, OpenAI, MongoDB Atlas, and others), and `opencost/opencost-integration-tests`. It depends on Prometheus for usage metrics and also exports its own cost metrics on `/metrics`, so it both consumes and feeds a monitoring stack. The `pkg/mcp` MCP server lets AI agents query cost data.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Kubecost (IBM) | Commercial upgrade built on the OpenCost engine; adds multi-cluster, long-term retention, SSO, and alerting. OpenCost is the specification plus core engine only. |
| Cloud-native billing (AWS Cost Explorer, GCP Billing) | Reports at cloud-bill granularity and does not split cost across in-cluster namespaces or pods. OpenCost allocates in-cluster in real time. |
| FinOps SaaS (CAST AI, Vantage, Finout) | Vendor-specific hosted offerings. OpenCost is a vendor-neutral CNCF specification and self-hosted open source. |
| kube-resource-report | Simple aggregation without pricing integration or idle and shared distribution. |

When to pick which: choose OpenCost for a vendor-neutral, self-hosted baseline that splits cost down to pods and attributes idle and shared cost. Choose the commercial Kubecost or a FinOps SaaS when you need multi-cluster rollups, long-term retention, SSO, and alerting without building them yourself.

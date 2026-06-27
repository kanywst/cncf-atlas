# Adoption & Ecosystem

## Who uses it

The organisations below are self-reported in the project's `ADOPTERS.md` file and on the adopters page. The file lists company names only, with no statement of scale, so treat these as "uses Capsule" and nothing more.

| Organisation | Use case | Source |
| --- | --- | --- |
| Bedag Informatik AG | Listed adopter | [ADOPTERS.md:9](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Department of Defense (US) | Listed adopter | [ADOPTERS.md:12](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Enreach | Listed adopter | [ADOPTERS.md:15](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Fastweb | Listed adopter | [ADOPTERS.md:18](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Klarrio | Listed adopter | [ADOPTERS.md:21](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| KubeRocketCI | Listed adopter | [ADOPTERS.md:24](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| ODC-Noord | Listed adopter | [ADOPTERS.md:27](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| PITS Global Data Recovery Services | Listed adopter | [ADOPTERS.md:30](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Politecnico di Torino | Listed adopter | [ADOPTERS.md:33](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Reevo | Listed adopter | [ADOPTERS.md:36](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Seeweb | Listed adopter | [ADOPTERS.md:39](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |

The `MAINTAINERS.md` file shows maintainers affiliated with Wargaming, Peak Scale, Proximus, and ODC-Noord (source 13). The public adopters page mirrors the file (source 7).

## Adoption signals

Measured from the GitHub REST API on 2026-06-26 (source 14): about 2,112 stars, 210 forks, 75 contributors, and 26 open issues. The latest release at that time was v0.13.7, cut on 2026-06-24 (source 1). The project is a CNCF Sandbox project, accepted on 2022-12-13 (sources 2, 3). Releases ship on a steady cadence, which is the clearest signal of an active maintainer team.

## Ecosystem

- Capsule Proxy: an API proxy that filters cluster-scoped resources (such as the namespace list) per tenant, so a tenant owner can discover the resources they own. Capsule core cannot filter cluster-scoped reads on its own, and the proxy fills that gap.
- GitOps integrations: Capsule is declarative and GitOps ready. Clastix publishes a Flux reference implementation (`clastix/flux2-capsule-multi-tenancy`) and a reference architecture on Azure Kubernetes Service (`clastix/coaks-baseline-architecture`).
- Helm: the official deployment path. The chart also manages the CRD lifecycle (`charts/capsule/README.md`).

## Alternatives

Capsule is soft multi-tenancy: tenants share one control plane and are separated by admission control and RBAC. The main distinction from each alternative below is whether the alternative gives a tenant its own cluster-scoped surface, and at what cost (sources 10, 11).

| Alternative | Differs by |
| --- | --- |
| Hierarchical Namespace Controller (HNC) | Nests namespaces in a parent-child tree with inheritance. It structures namespaces but does not add a tenant abstraction above them, and cluster-scoped resources stay cluster-wide. |
| kiosk (Loft Labs) | Offered Account and Space self-service namespaces. Now folded into vCluster and largely deprecated. |
| vCluster (Loft) | Runs a virtual API server per tenant inside a namespace, so each tenant is effectively cluster-admin and can manage cluster-scoped resources, at a higher resource cost per control plane. |
| Kamaji (Clastix) | Control Plane as a Service: a dedicated control plane per tenant, aimed at Kubernetes-as-a-Service providers rather than internal teams. |

The rule of thumb from these comparisons: for internal teams that trust each other, Capsule's soft isolation is enough and cheaper to run; for untrusted tenants that need their own cluster-scoped resources, a hard-isolation tool such as vCluster or Kamaji is the better fit.

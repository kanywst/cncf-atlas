# Adoption & Ecosystem

## Who uses it

The clearest evidence is the project's own ADOPTERS.md, where organizations self-report production use with a contact and a date (source 3). The named adopters skew toward hosting providers in the former CIS region and Europe.

| Organisation | Use case | Source |
| --- | --- | --- |
| Ænix | Primary tool for the managed services it offers; the project's original sponsor (2024-02-14) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| Mediatech | Uses Cozystack as its Kubernetes distribution (2024-05-01) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| Bootstack | Production platform (2024-08-01) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| gohost | Kazakhstan hosting provider offering bare-metal Kubernetes managed with Cozystack (2024) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| Urmanac | Production use; contributes a maintainer (2024-12-04) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| Hidora / Hikube | Swiss sovereign cloud; contributes a maintainer (2025-09-17) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| QOSI | Central Asian GPU cloud (2025-10-04) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| Cloupard | Public cloud in Kazakhstan and Uzbekistan (2025-12-18) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |

The list is self-reported, so treat it as a signal of who runs the platform in production rather than a verified deployment inventory.

## Adoption signals

Observed 2026-06-29 via the GitHub REST API (source 8):

- Stars: 2,132
- Forks: 173
- Contributors: 50+
- Open issues: 373

The adopter geography (hosting and cloud providers across the former CIS and Europe) matches the project's target of operators building their own cloud rather than teams deploying apps to someone else's.

## Ecosystem

Cozystack is less a standalone tool than an integration of other projects, so its ecosystem is mostly its dependency set. It reconciles through Flux (using the helm-controller as its backing store), runs VMs on KubeVirt with CDI, builds tenant control planes with Cluster API and Kamaji, provisions Postgres with CloudNativePG, stores data on LINSTOR and Piraeus with SeaweedFS, networks with Cilium and Kube-OVN, load-balances with MetalLB, boots on Talos Linux, authenticates through Keycloak, and observes with VictoriaMetrics and Grafana. These are vendored as charts under `packages/system/` (README, source 2). Ænix offers Cozystack as a commercial product and support offering (source 4).

## Alternatives

The honest comparison depends on which layer you care about.

| Alternative | Differs by |
| --- | --- |
| OpenStack | Also builds a private IaaS, but on its own large stack; Cozystack keeps operations inside Kubernetes and Flux by composing CNCF components. |
| Harvester (SUSE) | Also KubeVirt-based HCI, but centered on VMs and hyperconverged infrastructure; Cozystack adds managed Kubernetes (Kamaji, Cluster API) and DBaaS on top. |
| Kubermatic, Gardener, Rancher | Overlap on managed-Kubernetes delivery, but Cozystack bundles VMs, DBaaS, tenant isolation, and a billing-oriented catalog aimed at hosting providers. |
| Crossplane, KubeVela | Also expose cloud-like APIs from Kubernetes resources, but as general-purpose composition engines; Cozystack ships a finished platform with specific components (KubeVirt, CNPG, LINSTOR, Cilium) already integrated. |

Pick Cozystack when you want a ready-made private-cloud platform on bare metal and are comfortable operating its opinionated stack. Pick a general composition engine like Crossplane when you want to define your own abstractions over existing infrastructure, and pick Harvester or OpenStack when your need is IaaS rather than a Kubernetes-and-DBaaS PaaS.

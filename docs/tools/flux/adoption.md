# Adoption & Ecosystem

## Who uses it

The CNCF graduation announcement named specific users and providers. Volvo Cars, SAP, and RingCentral were cited as users, and AWS, D2iQ, Microsoft, Red Hat, VMware, and Weaveworks were cited as adopting Flux to power GitOps in their own customer-facing offerings (source 2). The project's ADOPTERS page lists many more self-reported organizations (source 6).

| Organisation | Use case | Source |
| --- | --- | --- |
| Volvo Cars | Named user in the CNCF graduation announcement | [CNCF announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/) |
| SAP | Named user in the CNCF graduation announcement | [CNCF announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/) |
| RingCentral | Named user in the CNCF graduation announcement | [CNCF announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/) |
| AWS, Microsoft, Red Hat, VMware, D2iQ, Weaveworks | Embed Flux in their own GitOps offerings | [CNCF announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/) |
| Grafana Labs, Kong, Maersk, Cookpad, BlaBlaCar, Giant Swarm | Self-reported on the Flux ADOPTERS page | [Flux Adopters](https://fluxcd.io/adopters/) |

The ADOPTERS page also lists Cisco, Sonatype, UiPath, Replicated, Scaleway, Infomaniak, Orange, MediaMarktSaturn, Pets at Home, Tchibo, Tietoevry, Trifork, TrueLayer, J.B. Hunt, the University of Bordeaux, Virginia Tech, and William & Mary, among others (source 6). The list is self-reported, so treat it as a signal of breadth rather than a verified deployment inventory.

## Adoption signals

Observed 2026-06-22 via `gh api repos/fluxcd/flux2` (source 1):

- Stars: 8,208
- Forks: 765
- Watchers: 68
- Contributors: roughly 210 (anonymous contributors included, paginated to page 210)
- Latest release: `v2.8.8`, dated 2026-05-20

The CNCF reported that during Flux's time in the Incubator (2021-03 to 2022-11), its user base, integrations, usage, and contributions grew by 200 to 500 percent (source 2).

## Ecosystem

Flux integrates with Kustomize and Helm for templating, OCI artifacts with Cosign signature verification for delivery, and SOPS plus HashiCorp Vault for secrets (source 4). Adjacent projects in the same family include Flagger for progressive delivery and Weave GitOps as an open-source web UI. Flux is commonly paired with Terraform and Crossplane, and is offered as a managed component by cloud providers such as EKS and AKS (source 4).

## Alternatives

The direct alternative is Argo CD, which graduated from the CNCF on the same day (source 2). The split is architectural. Argo CD centers on a hub-and-spoke control plane, a first-class `Application` abstraction, and a rich web UI. Flux runs as autonomous in-cluster agents with dedicated controllers and a CLI-first workflow (source 7). They also treat Helm differently: Argo CD renders charts with `helm template`, while Flux reconciles a `HelmRelease` custom resource as a first-class delivery mechanism. Flux integrates SOPS natively for secrets. Pick Flux for a light per-cluster footprint, edge or constrained environments, and strong multi-tenancy; pick Argo CD when a central control plane and a primary web UI matter more (source 7).

| Alternative | Differs by |
| --- | --- |
| Argo CD | Central hub-and-spoke control plane with an `Application` abstraction and a rich web UI, versus Flux's distributed per-cluster agents and CLI-first model (source 7). |

# Adoption & Ecosystem

## Who uses it

k8gb keeps an `ADOPTERS.md` in the repository, with a contact and a description of use for each entry. The table below is that file, read at commit `34b4535c`.

| Organisation | Use case | Source |
| --- | --- | --- |
| [Absa](https://www.absa.co.za/) | Created k8gb; first production use across regional data centres | `ADOPTERS.md` |
| [Millennium bcp](https://www.millenniumbcp.pt/) | Multicloud and multi-region cloud native load balancing | [CNCF case study](https://www.cncf.io/case-studies/millennium-bcp/) |
| [Eficode](https://eficode.com/) | Cloud native and DevOps consultancy, used in customer engagements | `ADOPTERS.md` |
| [Open Systems](https://www.open-systems.com/) | Multi-cluster load balancing inside a private WAN | `ADOPTERS.md` |
| [PagBank](https://pagbank.com/) | Multicloud global load balancing across multiple regions | `ADOPTERS.md` |
| [Darede](https://darede.com.br/) | Cloud consultancy, supports customers running k8gb | `ADOPTERS.md` |
| [envio.dev](https://envio.dev/) | Cross-region availability for a blockchain data engine | `ADOPTERS.md` |

The CNCF's incubation announcement describes adoption as concentrated in fintech and cloud consultancies, and names Millennium bcp, Portugal's largest privately owned bank, as an example ([CNCF, 2026-08-05](https://www.cncf.io/announcements/2026/08/05/k8gb-becomes-a-cncf-incubating-project/)).

Two shapes show up in that list. Banks with a regulatory reason to run in more than one place and a real cost to being down (Absa, Millennium bcp, PagBank), and consultancies that deploy it for clients (Eficode, Darede). Both are the profile of a tool chosen for a specific failure scenario rather than adopted by default.

## Adoption signals

The project reached CNCF incubating on 2026-07-18, announced 2026-08-05, after five years in the sandbox from 2021-03-30 ([CNCF](https://www.cncf.io/announcements/2026/08/05/k8gb-becomes-a-cncf-incubating-project/)). Passing an incubation review requires documented adopters, which is the strongest available signal for a project of this size: the `ADOPTERS.md` entries are what the CNCF Technical Oversight Committee reviewed.

Ongoing activity is published at [k8gb DevStats](https://k8gb.devstats.cncf.io/). Project health scores are tracked publicly at [CLOMonitor](https://clomonitor.io/projects/cncf/k8gb) and through the OpenSSF Scorecard and CII Best Practices badges the README carries (`README.md`). Release artefacts, both images and Helm charts, are signed with cosign and published to `ghcr.io/k8gb-io` (`docs/CONTRIBUTING.md`).

`v1.0.0` was tagged on 2026-09-02, six weeks after the promotion to incubating.

## Ecosystem

k8gb is built almost entirely out of other people's components, which is worth stating plainly because it changes what you are adopting:

- **CoreDNS**, in a k8gb-specific build carrying the `k8s_crd` plugin (`chart/k8gb/values.yaml:119`). This is what answers queries.
- **external-dns**, both as the source of the `DNSEndpoint` type k8gb writes and as the mechanism for putting NS delegation records into the parent zone (`go.mod`).
- **DNS providers**: Route 53, Azure DNS, NS1, Cloudflare, Infoblox, Windows DNS, and RFC 2136, each with a setup page under `docs/deploy_*.md`. Infoblox is the one with a bespoke client in the tree (`controllers/providers/dns/infoblox-client.go`); the rest go through external-dns.
- **Prometheus and Grafana**: metrics in `controllers/providers/metrics/` and dashboards in `grafana/`.
- **Admiralty** and **Crossplane**: documented combinations, in `docs/admiralty.md` and `docs/examples/crossplane/`.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Route 53 latency and failover routing, Azure Traffic Manager, Google Cloud Load Balancing | The managed answer, and the right one if everything is in one cloud. k8gb earns its place when clusters span providers or include on-premises, and when you want the policy to be a Kubernetes object |
| F5 and Infoblox GSLB appliances | The traditional answer. Note that k8gb integrates with Infoblox as a DNS backend rather than competing with it outright |
| Submariner | Also multi-cluster, but a different layer: Submariner builds L3 reachability between pods and services. k8gb decides which cluster inbound traffic goes to. They solve different halves and can be used together |
| Istio or Linkerd multi-cluster | Requires the mesh's data plane in every cluster and connectivity between them. k8gb requires only that a DNS zone be delegated |

The distinguishing axis is what each option demands between clusters. A mesh or Submariner asks for network reachability and a trust relationship. A cloud provider's GSLB asks that you be in that cloud. k8gb asks for a delegated DNS zone and nothing else, and in exchange gives you DNS-granularity control rather than per-request control.

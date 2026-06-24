# Adoption & Ecosystem

## Who uses it

The largest adoption fact is structural: CoreDNS is the default cluster DNS in Kubernetes since 1.13, so most Kubernetes clusters run it. Beyond that, the project keeps a first-party `ADOPTERS.md` file, and the organisations below are taken from it.

| Organisation | Use case | Source |
| --- | --- | --- |
| SoundCloud | In-cluster cache and proxy handling hundreds of thousands of DNS service-discovery requests per second | [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md) |
| Bose | Production use across Kubernetes clusters of more than 250 nodes | [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md) |
| AdGuard | Used in AdGuard Home and the public AdGuard DNS service | [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md) |
| Zalando SE, Trainline, Skyscanner, Hellofresh, Render, Infoblox, Qwilt, Northflank | Listed production adopters | [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md) |
| Absa Group | Uses CoreDNS through the k8gb global load balancer project | [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md) |

At CNCF graduation the project reported Bose, Hellofresh, Skyscanner, SoundCloud, Trainline, and Zalando running it in production ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)).

## Adoption signals

Measured from the GitHub REST API on 2026-06-22 ([api.github.com/repos/coredns/coredns](https://api.github.com/repos/coredns/coredns)):

- Stars: 14,131; forks: 2,473; open issues: 305.
- Contributors: about 432 (last page of the contributors API).
- Latest release: `v1.14.4` (2026-06-09).
- Repository created: 2016-03-18.

At graduation in 2019 the project reported more than 100 contributors and 16 active maintainers ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)).

## Ecosystem

CoreDNS integrates through plugins. The `kubernetes` plugin makes it the cluster DNS; `etcd` and cloud plugins (`azure`, `clouddns`) read records from external backends; `metrics` exports Prometheus data; `dnstap` and `trace` add observability. Higher-level projects build on it, for example k8gb (used by Absa) for global server load balancing. Out-of-tree plugins are added by listing them in `plugin.cfg` and rebuilding the binary (`src/plugin.cfg:7-8`).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| kube-dns (dnsmasq plus helper containers) | The previous Kubernetes default that CoreDNS replaced in 1.13; multiple containers rather than one binary, and no plugin chain. |
| BIND9 / NSD / Knot | Long-established authoritative and resolver software; strong DNSSEC and high performance, but no native etcd/Kubernetes backends or composable plugin chain, which is the gap CoreDNS was built for ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)). |
| Unbound / dnsmasq | Lightweight resolvers and forwarders; simpler to run, but without CoreDNS's cloud-native service discovery and Prometheus integration. |

Pick CoreDNS when you want one Go binary that composes DNS behaviour (cache, forward, rewrite, Kubernetes service resolution, DNSSEC) declaratively through a Corefile. Pick a traditional server when you need a mature authoritative server for a large public zone and do not need backend integration.

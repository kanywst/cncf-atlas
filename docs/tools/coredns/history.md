# History

## Origin

CoreDNS was started in March 2016 by Miek Gieben, an SRE at Google. He had already written SkyDNS, an earlier service-discovery DNS server, and the widely used Go DNS library `miekg/dns`. CoreDNS grew out of frustration with SkyDNS: it was monolithic and hard to extend, and traditional servers like BIND9, NSD, and Knot could not use backends such as etcd. The goal was a general DNS server that could talk to multiple backends (etcd, Consul, Kubernetes) while staying easy to extend ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)).

The architecture was taken from the Caddy web server. Caddy's pattern of chaining middleware was reused for DNS, so early on the project was nicknamed "Caddy DNS". CoreDNS still depends on a fork of Caddy, imported as `github.com/coredns/caddy` (`src/core/dnsserver/register.go:8`), and registers itself as a Caddy server type so a Corefile is parsed as a Caddyfile ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/), [O'Reilly](https://www.oreilly.com/library/view/learning-coredns/9781492047957/ch01.html)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Project started by Miek Gieben; repository created 2016-03-18 (forked from the Caddy design). |
| 2017 | CNCF becomes steward of CoreDNS (2017-03-02), at the Sandbox tier. |
| 2018 | Promoted to CNCF Incubating; available as a Kubernetes cluster DNS add-on in Kubernetes 1.11. |
| 2018 | Promoted to the default cluster DNS in Kubernetes 1.13. |
| 2019 | Graduated from the CNCF on 2019-01-24, the first project to graduate that year. |
| 2026 | Release `v1.14.4` (2026-06-09); requires Go 1.25.0. |

## How it evolved

The biggest inflection point was Kubernetes adoption. CoreDNS became available as a cluster DNS add-on in Kubernetes 1.11 and was promoted to the default in 1.13, replacing the kube-dns stack (dnsmasq plus helper containers), partly to address vulnerabilities in that stack ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)). That made CoreDNS the DNS layer in nearly every Kubernetes cluster.

CNCF maturity tracked the same period: steward in March 2017, Incubating in 2018, and Graduated on 2019-01-24 ([CNCF steward announcement](https://www.cncf.io/blog/2017/03/02/cloud-native-computing-foundation-becomes-steward-service-naming-discovery-project-coredns/), [CNCF graduation announcement](https://www.cncf.io/announcements/2019/01/24/coredns-graduation/)). At graduation the project reported more than 100 contributors and 16 active maintainers ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)).

## Where it stands now

CoreDNS ships tagged releases regularly; `v1.14.4` was published on 2026-06-09. The codebase tracks recent Go versions and supports the last two Go releases, currently pinning a minimum of Go 1.25.0 (`src/go.mod:5`). Its functionality continues to be delivered through in-tree and out-of-tree plugins rather than a growing core, and it remains the default cluster DNS in Kubernetes.

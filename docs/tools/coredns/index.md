# CoreDNS

> A DNS server that resolves a query by chaining plugins, configured with a Corefile, used as the default cluster DNS in Kubernetes.

- **Category**: Service Mesh & Networking
- **CNCF maturity**: Graduated
- **Language**: Go (`go 1.25.0`)
- **License**: Apache-2.0
- **Repository**: [coredns/coredns](https://github.com/coredns/coredns)
- **Documented at commit**: `cc88c96e` (2026-06-17, latest release `v1.14.4` from 2026-06-09)

## What it is

CoreDNS is a DNS server written in Go. Its distinguishing idea is that a query is handled by a chain of plugins rather than by a monolithic resolver. You describe the chain in a configuration file called a Corefile: for each zone you list the plugins that should run, and the order they appear in matters because each plugin can pass the request to the next one.

The plugin model lets one binary do jobs that traditionally needed separate tools. The `forward` plugin proxies to an upstream resolver, `cache` adds caching, `file` serves a zone file, `kubernetes` answers `cluster.local` service names, and `prometheus` exports metrics. The set of plugins compiled into the binary is fixed at build time from a file called `plugin.cfg` (`src/plugin.cfg`), and that same file pins their execution order.

The entry point is small: `main()` calls `coremain.Run()` and blank-imports `core/plugin` to register every in-tree plugin (`src/coredns.go:7-12`). The server itself is built on a fork of the Caddy web server, which is where the chained-middleware design comes from.

## When to use it

- You run Kubernetes and want the in-cluster DNS that ships as the default add-on. CoreDNS replaced kube-dns as the default in Kubernetes 1.13.
- You want one DNS server that can cache, forward, rewrite, and answer from a backend (etcd, a zone file, a cloud DNS API) by composing plugins instead of running several daemons.
- You need DNS metrics in Prometheus or trace export without bolting on a separate exporter.
- It is a weaker fit when you want a long-established authoritative server for a large public zone with full DNSSEC signing operations, where BIND9, NSD, or Knot have longer track records.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [coredns/coredns repository](https://github.com/coredns/coredns), read at commit `cc88c96`.
2. [ADOPTERS.md](https://github.com/coredns/coredns/blob/master/ADOPTERS.md), the project's first-party adopter list.
3. [LICENSE (Apache-2.0)](https://github.com/coredns/coredns/blob/master/LICENSE).
4. [CNCF becomes steward of CoreDNS (2017-03-02)](https://www.cncf.io/blog/2017/03/02/cloud-native-computing-foundation-becomes-steward-service-naming-discovery-project-coredns/).
5. [CNCF announces CoreDNS graduation (2019-01-24)](https://www.cncf.io/announcements/2019/01/24/coredns-graduation/).
6. [DNS Solution CoreDNS Graduates from CNCF (InfoQ)](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/).
7. [Learning CoreDNS, Introduction (O'Reilly)](https://www.oreilly.com/library/view/learning-coredns/9781492047957/ch01.html).
8. [GitHub REST API: repos/coredns/coredns](https://api.github.com/repos/coredns/coredns), observed 2026-06-22.

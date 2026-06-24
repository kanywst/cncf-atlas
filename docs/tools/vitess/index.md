# Vitess

> A clustering system that shards MySQL horizontally and hides the sharding behind a single MySQL-compatible endpoint.

- **Category**: Storage & Database
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [vitessio/vitess](https://github.com/vitessio/vitess)
- **Documented at commit**: `7924743` (2026-06-22, `main`)

## What it is

Vitess sits between an application and a fleet of MySQL servers. The application connects to a stateless proxy called VTGate as if it were a single MySQL server. VTGate parses each query, plans how to run it, and routes it to the right shards. The sharding logic lives in Vitess instead of in the application.

A Vitess deployment splits a logical database (a keyspace) into shards, each backed by a primary and replica MySQL group. A sidecar called VTTablet runs next to every MySQL instance and handles query execution, connection pooling, health checks, and backups. A control plane (vtctld, VTOrc, VTAdmin) handles schema changes, resharding, and failover. Topology metadata lives in etcd, ZooKeeper, or Consul.

Vitess began at YouTube in 2010 to scale MySQL past the limits a single server hits. It is for teams that already run MySQL, have outgrown one machine, and want to scale out without rewriting their application or giving up the MySQL wire protocol.

## When to use it

- You run MySQL at a scale where one primary cannot hold the data or the write load.
- You want to shard without embedding shard-selection logic in application code.
- You need online resharding, non-blocking schema changes, or managed failover across many MySQL instances.
- You are on Kubernetes and want a proxy layer that presents one MySQL endpoint over many backends.

It is a poor fit when a single MySQL server still handles your load, since Vitess adds an operational layer (topology service, proxies, sidecars) that only pays off at scale. It is also not a drop-in for full cross-shard ACID isolation; cross-shard transactions carry constraints the application must understand.

## In this deep-dive

- [History](./history): origin at YouTube, CNCF graduation, and how it evolved.
- [Architecture](./architecture): components and how a query flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the VTGate query path, read from source.
- [Getting Started](./getting-started): a local cluster from the examples.

## Sources

1. [vitessio/vitess (GitHub)](https://github.com/vitessio/vitess)
2. [ADOPTERS.md](https://github.com/vitessio/vitess/blob/main/ADOPTERS.md)
3. [CNCF Announces Vitess Graduation (2019-11-05)](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/)
4. [Vitess on CNCF projects](https://www.cncf.io/projects/vitess/)
5. [CNCF Vitess Project Journey Report](https://www.cncf.io/reports/vitess-project-journey-report/)
6. [SiliconANGLE: Vitess powering YouTube graduates CNCF](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/)
7. [Vitess Docs: History](https://vitess.io/docs/22.0/overview/history/)
8. [Tinybird: Citus Alternatives](https://www.tinybird.co/blog/Citus-Alternatives)
9. [PingCAP: Best Distributed SQL Databases](https://www.pingcap.com/compare/best-distributed-sql-databases/)
10. [Vitess project home](https://vitess.io/)

# Cortex

> A horizontally scalable, multi-tenant, long-term storage backend for Prometheus that receives metrics over remote write.

- **Category**: Observability
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [cortexproject/cortex](https://github.com/cortexproject/cortex)
- **Documented at commit**: `42c26e7` (2026-06-23, near tag `v1.21.1`)

## What it is

Cortex is a set of Go services that turn Prometheus into a horizontally scalable, multi-tenant time series database. A single Prometheus is bounded by one machine's CPU, memory, and disk, and it cannot isolate metrics from many independent teams in one cluster. Cortex solves this by receiving samples over the Prometheus remote write protocol, sharding them across a fleet of stateful ingesters using a hash ring, and shipping completed blocks to object storage for long-term retention.

The codebase is one binary that can run as a single process (`-target=all`) or split into individual microservices (distributor, ingester, querier, store-gateway, compactor, and more), each scaled on its own. Tenant isolation runs through every layer, keyed by the `X-Scope-OrgID` HTTP header, with authentication enabled by default.

Cortex sits behind Prometheus instances that remote-write to it, and in front of Grafana, which queries it as a Prometheus-compatible data source. Amazon Managed Service for Prometheus is built on Cortex.

## When to use it

- You run many Prometheus instances and need one central, query-able store with retention beyond a single node's disk.
- You need hard multi-tenant isolation (separate teams or customers) from ingestion through query, not only at the dashboard.
- You want to scale write, read, and storage paths independently in Kubernetes.
- It is overkill if a single Prometheus or a lightweight single-binary store already fits your scale; the microservice topology adds real operational cost.
- If you want to keep existing Prometheus servers as the source of truth and only federate at query time, a pull/sidecar model may fit better.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [cortexproject/cortex README](https://github.com/cortexproject/cortex/blob/master/README.md)
2. [cortex source at commit `42c26e7`](https://github.com/cortexproject/cortex/tree/42c26e7eab49ce36bb4dc80ecbcf365fe0e33899)
3. [ADOPTERS.md](https://github.com/cortexproject/cortex/blob/master/ADOPTERS.md)
4. [LICENSE (Apache-2.0)](https://github.com/cortexproject/cortex/blob/master/LICENSE)
5. [Cortex on the CNCF project page](https://www.cncf.io/projects/cortex/)
6. [TOC welcomes Cortex as an incubating project (CNCF)](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/)
7. [Cortex has advanced to incubation within CNCF (Grafana Labs)](https://grafana.com/blog/cortex-the-scalable-prometheus-project-has-advanced-to-incubation-within-cncf/)
8. [Amazon Managed Service for Prometheus](https://aws.amazon.com/prometheus/)

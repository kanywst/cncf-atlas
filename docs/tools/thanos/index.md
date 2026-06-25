# Thanos

> Thanos extends Prometheus with object-storage-backed long-term retention and a single global query view across many Prometheus servers.

- **Category**: Observability
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [thanos-io/thanos](https://github.com/thanos-io/thanos)
- **Documented at commit**: `cc24370` (main, 2026-06-23)

## What it is

Thanos is a set of components that sit alongside existing Prometheus servers and turn them into a single, horizontally scalable metrics system. It keeps the Prometheus TSDB block format, ships those blocks to object storage (S3, GCS, Azure, and others), and serves queries that span every server and every block through one Prometheus-compatible API.

It ships as a single Go binary with several subcommands: `sidecar`, `store`, `query`, `rule`, `compact`, `receive`, `query-frontend`, and `tools`. Each subcommand is one role. `cmd/thanos/main.go:34` is a thin dispatcher that registers all of them and runs the one selected on the command line (`cmd/thanos/main.go:56-63`).

The central idea is the StoreAPI: a gRPC contract that every data-holding component implements. A Querier fans a single PromQL request out to all of them in parallel and merges their sorted series streams into one global, sorted result. Because a Querier is itself a StoreAPI server, Queriers can be stacked into federated layers.

## When to use it

- You already run Prometheus and need retention longer than local disk allows, stored cheaply in object storage.
- You run many Prometheus servers (per cluster, per region) and want one query endpoint and one Grafana data source across all of them.
- You run HA Prometheus pairs and want their duplicate series transparently deduplicated at query time.
- You want long-range queries to stay fast through downsampling of historical data.

It is a weaker fit when you have a single small Prometheus with short retention, where the extra components add operational cost without payoff. It is also a weaker fit when you want a turnkey store with its own storage engine rather than one layered on Prometheus and object storage.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [thanos-io/thanos](https://github.com/thanos-io/thanos) repository, pinned at commit `cc24370`.
2. [Thanos official site](https://thanos.io/) and [getting started guide](https://thanos.io/tip/thanos/getting-started.md/).
3. [TOC approves Thanos from sandbox to incubation](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/), CNCF blog, 2020-08-19.
4. [CNCF project page: Thanos](https://www.cncf.io/projects/thanos/).
5. [Fabian Reinartz and Bartlomiej Plotka: Thanos](https://www.youtube.com/watch?v=l8syWgJ98sk), conference talk.
6. [Wikitech: Thanos](https://wikitech.wikimedia.org/wiki/Thanos), Wikimedia operations docs.
7. [go-loser](https://github.com/bboreham/go-loser) and [K-way merge algorithm (Tournament Tree)](https://en.wikipedia.org/wiki/K-way_merge_algorithm#Tournament_Tree).

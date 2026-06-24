# TiKV

> A distributed, transactional key-value store that gives systems like TiDB a horizontally scalable storage layer with strong consistency.

- **Category**: Storage & Database
- **CNCF maturity**: Graduated
- **Language**: Rust
- **License**: Apache-2.0
- **Repository**: [tikv/tikv](https://github.com/tikv/tikv)
- **Documented at commit**: `2ce1174` (2026-06-22)

## What it is

TiKV is a distributed key-value store written in Rust. It started in 2016 at PingCAP as the storage layer for TiDB, and its design draws on Google's BigTable, Spanner, and Percolator papers plus the Raft consensus algorithm. Data is sharded into Regions, replicated by Raft, and persisted to RocksDB.

Above the raw key-value layer, TiKV implements distributed ACID transactions through Percolator-style two-phase commit. It exposes both a transactional API (TxnKV) and a raw API (RawKV), and it can be used directly through the client libraries or as the backend for TiDB's SQL engine. A separate component, the Placement Driver (`tikv/pd`), handles sharding, rebalancing, and timestamp allocation.

TiKV sits below SQL and above local disk. It owns consensus, MVCC, transaction scheduling, and storage, and it leaves query parsing and planning to layers above it such as TiDB.

## When to use it

- You need a key-value store that scales past a single machine to 100+ TB while keeping strong consistency.
- You need distributed ACID transactions across keys, not just per-key atomicity.
- You are building on TiDB, or you want a transactional KV backend reachable through `client-rust`, `client-go`, `client-java`, or `client-python`.
- It is a poor fit for small configuration data where a single-node or small-cluster store like etcd is enough.
- It is a poor fit when you want SQL out of the box. TiKV is the KV layer, and SQL lives in TiDB.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [Cloud Native Computing Foundation announces TiKV Graduation (CNCF)](https://www.cncf.io/announcements/2020/09/02/cloud-native-computing-foundation-announces-tikv-graduation/)
2. [Celebrating TiKV's CNCF Graduation (TiKV blog)](https://tikv.org/blog/graduation-announcement/)
3. [TiKV project page (CNCF)](https://www.cncf.io/projects/tikv/)
4. [tikv/tikv README](https://github.com/tikv/tikv)
5. [TOC votes to move TiKV into CNCF Incubator (CNCF)](https://www.cncf.io/blog/2019/05/21/toc-votes-to-move-tikv-into-cncf-incubator/)
6. [CNCF TOC votes to move TiKV to Incubating Status (TiKV blog)](https://tikv.org/blog/cncf-incubating/)
7. [TiKV Adopters](https://tikv.org/adopters/)
8. [Case study: TiKV in JD Cloud (CNCF)](https://www.cncf.io/blog/2019/11/26/case-study-tikv-in-jd-cloud/)
9. [tikv/tikv GitHub stats](https://github.com/tikv/tikv)
10. [TiKV Documentation](https://tikv.org/docs/latest/concepts/overview/)
11. [TiKV Governance (tikv/community)](https://github.com/tikv/community/blob/master/GOVERNANCE.md)

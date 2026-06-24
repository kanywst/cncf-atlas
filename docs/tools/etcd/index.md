# etcd

> A distributed key-value store that uses Raft to keep a small, critical dataset consistent across a cluster.

- **Category**: Storage & Database
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [etcd-io/etcd](https://github.com/etcd-io/etcd)
- **Documented at commit**: `61d518f` (2026-06-19, main)

## What it is

etcd is a strongly consistent key-value store. Every write goes through the Raft consensus protocol, so a majority of cluster members agree on the order of changes before any write is acknowledged. This gives linearizable reads and writes, which is what a distributed system needs for its configuration and coordination data.

The store keeps data under multi-version concurrency control (MVCC). Each change creates a new revision instead of overwriting in place, so clients can read past revisions, watch a key for changes from a given revision, and compact old history when it is no longer needed. On top of the store, etcd adds leases (keys that expire), role-based access control, and a gRPC API.

etcd is best known as the primary datastore for Kubernetes, where it holds all cluster state. It is built in Go and ships as three binaries: the `etcd` server, the `etcdctl` client, and the `etcdutl` maintenance tool.

## When to use it

- You need a small dataset (configuration, leader election, service discovery, locks) replicated with strong consistency across a few nodes.
- You want to watch keys and react to changes, or use TTL-based leases for liveness.
- You are running Kubernetes or building a control plane that needs a reliable source of truth.

When it is the wrong tool:

- It is not a general-purpose database. The dataset is expected to fit in memory and stay under the storage quota, so it does not suit bulk application data or large blobs.
- A write-heavy workload that does not need consensus pays for replication it never uses.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [CNCF Announces etcd Graduation](https://www.cncf.io/announcements/2020/11/24/cloud-native-computing-foundation-announces-etcd-graduation/)
2. [etcd (Wikipedia)](https://en.wikipedia.org/wiki/Etcd)
3. [etcd (CNCF projects)](https://www.cncf.io/projects/etcd/)
4. [etcd Project Journey Report](https://www.cncf.io/reports/etcd-project-journey-report/)
5. [etcd Quickstart](https://etcd.io/docs/v3.6/quickstart/)
6. [etcd Install](https://etcd.io/docs/v3.6/install/)
7. [etcd-io/etcd (README, ADOPTERS.md, LICENSE)](https://github.com/etcd-io/etcd)

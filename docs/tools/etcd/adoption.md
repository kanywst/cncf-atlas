# Adoption & Ecosystem

## Who uses it

The largest adopter group is implicit: every Kubernetes cluster uses etcd as its primary datastore, so all Kubernetes users are etcd users. The project's `ADOPTERS.md` opens with exactly this point [7]. Beyond that, the file lists named organisations with their use cases.

| Organisation | Use case | Source |
| --- | --- | --- |
| All Kubernetes users | Cluster control-plane datastore | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Huawei | Internal use | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Tencent Games | Internal use | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Salesforce.com | Internal use | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Yandex | Internal use | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Grab | Internal use | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| OpenTable | Service discovery and cluster configuration | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| PingCAP | Placement Driver (PD) component | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Qiniu Cloud | Internal use | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| QingCloud | Internal use | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Meitu | Internal use | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |

## Adoption signals

Measured from the GitHub REST API on 2026-06-22: 51,872 stars, 10,394 forks, and 266 open issues for `etcd-io/etcd`. The contributor count is over 1,000 (the anonymous-included contributors listing pages out past 1,179). CoreOS-affiliated authors contribute the most commits, with Google next. The CNCF Project Journey Report records the project's growth from its 2018 donation through graduation in 2020 [4].

## Ecosystem

The Go client `clientv3` and the gRPC API give bindings in most languages. The `etcdctl` and `etcdutl` CLIs ship with the server. etcd integrates with Prometheus for metrics and uses bbolt as its storage backend. Its Raft implementation, `go.etcd.io/raft`, is reused outside etcd, including by CockroachDB and TiKV (the latter is a derivative). Official container images are published at `gcr.io/etcd-development/etcd` (primary) and `quay.io/coreos/etcd` (secondary) [7].

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Apache ZooKeeper | ZAB consensus and a hierarchical znode tree; the older choice for coordination, without etcd's gRPC/MVCC/lease model |
| HashiCorp Consul | Adds service discovery and health checking on top of a KV store; a broader service-mesh-adjacent product |
| Google Chubby | The non-open-source design ancestor; a lock service rather than a general KV store |

Pick etcd when you want strong consistency over a small dataset with revision-based watches and leases, and especially when you are already in the Kubernetes ecosystem where it is the default. Pick ZooKeeper if you have an existing investment in it or its client libraries. Pick Consul when service discovery and health checking are the primary requirement rather than a raw consistent KV store.

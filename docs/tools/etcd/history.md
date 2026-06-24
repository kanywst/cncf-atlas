# History

## Origin

etcd began at CoreOS in 2013, with the first commit on 2013-06-06 by Xiang Li. Brandon Philips, Alex Polvi, and Xiang Li had looked at Google Chubby and Apache ZooKeeper for cluster coordination, found neither fit their needs, and built their own. The design draws on the Chubby paper [1] [2].

The name combines the Unix `/etc` configuration directory with the `d` of "distributed": a place to keep configuration, made safe for a distributed system rather than a single machine [2].

## Timeline

| Year | Milestone |
| --- | --- |
| 2013 | First commit at CoreOS (Xiang Li) [1] [2] |
| 2015 | v2.0.0, the first stable release [2] |
| 2016 | v3.0.0 reworks the store onto gRPC and an MVCC backend [2] |
| 2018 | CoreOS acquired by Red Hat; etcd donated to CNCF and accepted as Incubating on 2018-12-11 [2] [3] |
| 2020 | CNCF Graduated on 2020-11-24 [1] [3] |

## How it evolved

The largest shift was the v2 to v3 rewrite in 2016. v3 replaced the JSON-over-HTTP API with gRPC and moved the store onto MVCC backed by bbolt, which is what makes revision-based reads, watches, and compaction possible [2]. Kubernetes adopting etcd as its primary key-value store drove a steep rise in usage and pushed the project toward the scale and stability requirements of a control-plane datastore [2].

Governance moved with ownership. CoreOS was acquired by Red Hat in 2018, and the project was donated to the CNCF the same year, entering as an Incubating project on 2018-12-11 [2] [3]. By graduation in 2020 the maintainer group had grown to ten people spread across organisations including Alibaba, Amazon, Cockroach Labs, Google Cloud, IBM, Indeed, and Red Hat, which is the diversity the CNCF graduation criteria look for [1] [3].

## Where it stands now

At the documented commit the repository targets Go 1.26 (`go.mod:1-4`) and the raft implementation lives in a separate module, `go.etcd.io/raft/v3` (`go.mod:37`). The pinned commit `61d518f` sits on `main`, 50 commits ahead of the `v3.8.0-alpha.0` tag; the latest stable line is 3.6.x with 3.7 in release-candidate stage. The project is CNCF Graduated and maintained by a cross-company group [1] [3].

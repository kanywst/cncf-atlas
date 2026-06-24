# History

## Origin

TiKV was started in 2016 at PingCAP to complement TiDB with a distributed storage backend [4]. The repository was created on 2015-12-31. The design was built on established systems papers: Google's BigTable, Spanner, and Percolator for the data model and distributed transactions, and the Raft paper for consensus [4]. Rather than reinventing a storage engine, TiKV layers MVCC and Percolator two-phase commit on top of RocksDB, with Raft providing replication and a separate Placement Driver handling sharding and timestamp allocation.

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | Repository created (2015-12-31) [9] |
| 2016 | Development started at PingCAP as the storage layer for TiDB [4] |
| 2018 | Accepted into the CNCF Sandbox (2018-08-28) [3] |
| 2019 | TOC votes to move TiKV to Incubating; vote announced 2019-05-21 [5] [6] |
| 2020 | Graduated from CNCF (2020-09-02), the 12th project to graduate [1] [2] |

## How it evolved

By graduation in 2020, TiKV reported that production adoption had roughly doubled to around 1,000 companies, contributors to the core repository had grown from 78 to 226, and the project had 7 maintainers across multiple companies [1]. As part of the graduation process, CNCF funded a third-party security audit by Cure53, carried out in February and March 2020 [1].

A major architectural shift since then is Raftstore v2, also called partitioned-raft-kv, which gives each Region its own RocksDB tablet instead of sharing one instance. The two engines coexist in the codebase: `EngineType::RaftKv` is the original single-RocksDB design and `EngineType::RaftKv2` is the partitioned variant, selected at runtime in `cmd/tikv-server/src/main.rs:248`. The v2 code lives in `components/raftstore-v2`. Because the transaction and MVCC layers talk to storage only through the `Engine` trait, the same transaction code runs unchanged on both.

## Where it stands now

The latest stable release at the time of writing is `v8.5.6` (2026-04-14), and `master` is in development toward `9.0.0-beta.2` [9]. Governance is documented in the `tikv/community` repository, with a maintainer set drawn from multiple companies including PingCAP, Zhihu, JD Cloud, and Yidian Zixun [1] [11]. The main implementation lives in `tikv/tikv`, while the Placement Driver is `tikv/pd` and the client libraries are separate repositories such as `tikv/client-rust`.

## Sources

- [1] [Cloud Native Computing Foundation announces TiKV Graduation (CNCF)](https://www.cncf.io/announcements/2020/09/02/cloud-native-computing-foundation-announces-tikv-graduation/)
- [2] [Celebrating TiKV's CNCF Graduation (TiKV blog)](https://tikv.org/blog/graduation-announcement/)
- [3] [TiKV project page (CNCF)](https://www.cncf.io/projects/tikv/)
- [4] [tikv/tikv README](https://github.com/tikv/tikv)
- [5] [TOC votes to move TiKV into CNCF Incubator (CNCF)](https://www.cncf.io/blog/2019/05/21/toc-votes-to-move-tikv-into-cncf-incubator/)
- [6] [CNCF TOC votes to move TiKV to Incubating Status (TiKV blog)](https://tikv.org/blog/cncf-incubating/)
- [9] [tikv/tikv GitHub stats](https://github.com/tikv/tikv)
- [11] [TiKV Governance (tikv/community)](https://github.com/tikv/community/blob/master/GOVERNANCE.md)

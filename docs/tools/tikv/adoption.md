# Adoption & Ecosystem

## Who uses it

The organisations below are limited to those with a citable source: the official adopters page [7] or a CNCF case study [8].

| Organisation | Use case | Source |
| --- | --- | --- |
| JD Cloud & AI | Migrated object-storage (OSS) metadata from MySQL to TiKV, projecting 100 billion to 1 trillion rows | [8](https://www.cncf.io/blog/2019/11/26/case-study-tikv-in-jd-cloud/) |
| Zhihu | Built TiDB and the Zetta Table Store on TiKV to get past MySQL scalability limits | [7](https://tikv.org/adopters/) |
| U-Next | Production use on an ARM platform since 2019-12, handling COVID-19 traffic growth | [1](https://www.cncf.io/announcements/2020/09/02/cloud-native-computing-foundation-announces-tikv-graduation/) |
| Shopee | TiKV adoption without TiDB | [7](https://tikv.org/adopters/) |
| LY.com | TiKV adoption without TiDB | [7](https://tikv.org/adopters/) |
| Zhuan Zhuan | TiKV adoption without TiDB | [7](https://tikv.org/adopters/) |
| Meituan-Dianping | TiKV adoption without TiDB | [7](https://tikv.org/adopters/) |
| Ele.me | TiKV adoption without TiDB | [7](https://tikv.org/adopters/) |

## Adoption signals

At the time of the CNCF graduation announcement, production adoption had roughly doubled to around 1,000 companies, and contributors to the core repository had grown from 78 to 226 [1]. The maintainer set spans multiple companies including PingCAP, Zhihu, JD Cloud, and Yidian Zixun [1].

GitHub statistics observed on 2026-06-23: 16,739 stars, 2,295 forks, and roughly 389 contributors [9].

## Ecosystem

- TiDB is the largest consumer; TiKV is its distributed storage layer, and TiDB pushes computation down through the coprocessor [4].
- The Placement Driver (`tikv/pd`) is a required component for auto-sharding, Region rebalancing, and TSO allocation.
- Client libraries `client-rust`, `client-go`, `client-java`, and `client-python` use the TxnKV and RawKV APIs directly without going through TiDB.
- Change data capture is provided by `components/cdc` together with `components/resolved_ts` (and TiCDC).
- Backup and point-in-time recovery use BR and `backup-stream`.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| etcd | Same Raft plus KV model, but aimed at small configuration data (a few GB); TiKV targets 100+ TB and distributed ACID transactions |
| CockroachDB | Spanner/Percolator lineage too, but bundles the SQL layer; TiKV is KV-only and leaves SQL to TiDB |
| YugabyteDB | Distributed transactional SQL/KV in the same family; differs in storage layout and the TiKV-specific CF split |
| FoundationDB | Distributed transactional KV centred on deterministic simulation testing and a layered design, versus TiKV's Raft + RocksDB + PD plus coprocessor push-down |
| Cassandra / ScyllaDB | Eventually consistent wide-column; TiKV is strongly consistent with distributed transactions |

## Sources

- [1] [Cloud Native Computing Foundation announces TiKV Graduation (CNCF)](https://www.cncf.io/announcements/2020/09/02/cloud-native-computing-foundation-announces-tikv-graduation/)
- [4] [tikv/tikv README](https://github.com/tikv/tikv)
- [7] [TiKV Adopters](https://tikv.org/adopters/)
- [8] [Case study: TiKV in JD Cloud (CNCF)](https://www.cncf.io/blog/2019/11/26/case-study-tikv-in-jd-cloud/)
- [9] [tikv/tikv GitHub stats](https://github.com/tikv/tikv)

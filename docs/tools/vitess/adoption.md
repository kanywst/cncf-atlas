# Adoption & Ecosystem

## Who uses it

The repository's `ADOPTERS.md` lists organisations including GitHub, Slack, Square, Pinterest, Shopify, Etsy, HubSpot, New Relic, JD.com, FlipKart, PlanetScale, Uber, Twitter, YouTube, Axon, BetterCloud, CloudSigma, Vinted, and Weave ([source 2](https://github.com/vitessio/vitess/blob/main/ADOPTERS.md)). The CNCF graduation announcement separately names several of these as production or in-progress users.

| Organisation | Use case | Source |
| --- | --- | --- |
| YouTube | Petabyte-scale data, millions of queries per second | [source 5](https://www.cncf.io/reports/vitess-project-journey-report/) |
| Slack | Vitess fleet of roughly 6,000 servers | [source 5](https://www.cncf.io/reports/vitess-project-journey-report/) |
| GitHub | Production use, named at graduation | [source 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/) |
| JD.com | Production use, named at graduation | [source 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/) |
| Pinterest | Production use, named at graduation | [source 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/) |
| Square | Production use, named at graduation | [source 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/) |

The Project Journey Report states the largest known deployment is around 70,000 servers ([source 5](https://www.cncf.io/reports/vitess-project-journey-report/)).

## Adoption signals

- GitHub metrics observed 2026-06-23 via the GitHub API: 21,053 stars, 2,356 forks, around 327 contributors ([source 1](https://github.com/vitessio/vitess)).
- CNCF Graduated since 2019-11-05, the 8th project to graduate ([source 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/)).
- Contributor mix as of 2020-04: Google 36%, PlanetScale 25% ([source 5](https://www.cncf.io/reports/vitess-project-journey-report/)).
- Passed a CNCF-funded security audit in 2019-02 ([source 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/)).

## Ecosystem

- **Topology backends**: etcd, ZooKeeper, or Consul store cluster metadata (`go/vt/topo/`).
- **Kubernetes**: vitess-operator deploys Vitess on Kubernetes (`examples/operator/operator.yaml`).
- **Backup storage**: S3, GCS, and Ceph are supported targets (`examples/local/ceph_backup_config.json`).
- **VReplication**: the engine behind MoveTables, Reshard, Materialize, and online DDL.
- **PlanetScale**: a managed and serverless offering built on Vitess, and one of its largest sponsors ([source 8](https://www.tinybird.co/blog/Citus-Alternatives)).

## Alternatives

Vitess is MySQL-compatible middleware where shard placement is declared and controlled explicitly. The main alternatives differ on data model and on how much of the sharding they hide.

| Alternative | Differs by |
| --- | --- |
| PlanetScale | Managed and serverless Vitess for MySQL; adds branching and non-blocking schema changes ([source 8](https://www.tinybird.co/blog/Citus-Alternatives)) |
| Citus | PostgreSQL sharding extension; simpler setup, less elaborate shard management than Vitess ([source 8](https://www.tinybird.co/blog/Citus-Alternatives)) |
| CockroachDB / TiDB / YugabyteDB | NewSQL with automatic sharding and serializable cross-shard consistency, no explicit shard-key declaration ([source 9](https://www.pingcap.com/compare/best-distributed-sql-databases/)) |

Pick Vitess when you already run MySQL, want the MySQL wire protocol, and want explicit control over shard placement. Pick a NewSQL system when you want the database to handle sharding and cross-shard ACID for you. Vitess does cross-shard transactions atomically with 2PC but does not provide full cross-shard isolation; the application is expected to account for that.

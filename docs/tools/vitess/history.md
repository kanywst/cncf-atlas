# History

## Origin

Vitess started inside YouTube in 2010. MySQL had no native horizontal sharding, and YouTube's growth was hitting the limits of single MySQL servers. The project was begun by Sugu Sougoumarane, then a YouTube engineer, with the core idea of pulling shard-selection logic out of the application and into a proxy that sits between the application and the databases ([source 6](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/), [source 7](https://vitess.io/docs/22.0/overview/history/)).

From 2011 onward Vitess became the core of YouTube's database tier, growing to tens of thousands of MySQL nodes. The first public commit on GitHub dates to 2012-02-24 ([source 6](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2010 | Started at YouTube to scale MySQL horizontally ([source 6](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/)) |
| 2012 | First public commit on GitHub (2012-02-24) ([source 6](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/)) |
| 2018 | Accepted into CNCF as an incubating project (2018-02-05) ([source 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/)) |
| 2019 | Passed a CNCF-funded security audit (2019-02); graduated from CNCF (2019-11-05) as the 8th graduated project ([source 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/)) |

## How it evolved

The design center never changed: separate shard selection from the application and concentrate routing and administration in a proxy layer (VTGate) ([source 6](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/)). What grew around it was the control plane and the data-movement machinery. By the time of CNCF graduation the project was at v4.0 and shipped experimental VReplication support, the engine that now underpins resharding, MoveTables, Materialize, and online DDL ([source 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/)).

Contribution also broadened past its single-vendor origin. For the first two years almost all code came from Google (YouTube). By 2020-04 the top contributors were Google at 36% and PlanetScale at 25% ([source 5](https://www.cncf.io/reports/vitess-project-journey-report/)).

## Where it stands now

Vitess is a CNCF Graduated project ([source 4](https://www.cncf.io/projects/vitess/)). It ships tagged major releases; the most recent release tag before this commit was `v24.0.1` (2026-05-07), and the pinned `main` HEAD reports `25.0.0-SNAPSHOT` in `go/vt/servenv/version.go:22`, meaning v25 is in development. Governance is documented in the repository through `GOVERNANCE.md`, `STEERING.md`, `MAINTAINERS.md`, and `GUIDING_PRINCIPLES.md`, which satisfy the transparent-governance requirements CNCF expects of a graduated project.

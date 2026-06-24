# History

## Origin

Prometheus began at SoundCloud in 2012. Former Google engineers Matt Proud and Julius Volz started it because the StatsD and Graphite based setups of the time did not hold up under containerized infrastructure. Its design roots trace to Borgmon, the internal monitoring system at Google (2)(3). The first commit landed on 2012-11-24, which matches the GitHub repository creation timestamp of `2012-11-24T11:14:12Z` (10). The project was announced publicly in January 2015 (2).

## Timeline

| Year | Milestone |
| --- | --- |
| 2012 | Started at SoundCloud by Matt Proud and Julius Volz; first commit 2012-11-24 (2)(10) |
| 2015 | Public announcement (2) |
| 2016 | Accepted into the CNCF on 2016-05-09 as the second project after Kubernetes; Prometheus 1.0 released in July (1)(4)(2) |
| 2017 | Prometheus 2.0 ships a new storage engine, the current TSDB, cutting resource and disk usage (2) |
| 2018 | Graduated from the CNCF on 2018-08-09, the second project to do so (1)(4) |

## How it evolved

The biggest single shift was the 2.0 storage rewrite in November 2017. The original storage layer was replaced by the current TSDB design, which improved performance and reduced disk usage substantially (2). That TSDB (head, blocks, WAL, mmapped chunks) is still the local storage engine at the pinned commit.

The project graduated from CNCF incubation on 2018-08-09, announced at PromCon in Munich. At that point it had roughly 20 active maintainers, more than 1,000 contributors, and over 13,000 commits (1)(4)(9). Founder Julius Volz described it as a de facto standard for metrics-based monitoring at the time of graduation (1).

A versioning quirk comes from Go modules. Because of the Go module import path rules, Prometheus v3.y.z is published as a library under the `v0.3y.z` tag, a detail the README calls out directly.

## Where it stands now

Development continues on a single implementation repository, `prometheus/prometheus`, which builds the `prometheus` and `promtool` binaries. The pinned commit `fc561264` is the merge of release-3.13, with the `VERSION` file at `3.13.0-rc.0`; the latest stable release at recon time was v3.12.0 (2026-05-28) (10). Ecosystem components such as Alertmanager, node_exporter, and client_golang live in separate repositories.

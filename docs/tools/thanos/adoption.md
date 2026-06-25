# Adoption & Ecosystem

## Who uses it

The organizations below are named with citable sources. The first five were cited by the CNCF at the time of Thanos's incubation; Wikimedia publishes its own operations documentation.

| Organisation | Use case | Source |
| --- | --- | --- |
| Alibaba Cloud | Production metrics | [CNCF blog, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) |
| Banzai Cloud | Production metrics | [CNCF blog, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) |
| HelloFresh | Production metrics | [CNCF blog, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) |
| Monzo | Production metrics | [CNCF blog, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) |
| Red Hat | Production metrics | [CNCF blog, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) |
| Wikimedia | Long-term Prometheus storage | [Wikitech: Thanos](https://wikitech.wikimedia.org/wiki/Thanos) |

## Adoption signals

Measured on 2026-06-25 via the GitHub API on [thanos-io/thanos](https://github.com/thanos-io/thanos):

- Stars: 14,124
- Forks: 2,318
- Open issues: 869
- Contributors: roughly 408 (last page of the paginated contributors list)

Releases land roughly every six weeks as a single binary on GitHub Releases plus the `quay.io/thanos/thanos` container image.

## Ecosystem

- **Prometheus**: the data source, via the sidecar or remote-write into Receive.
- **Grafana**: queries Thanos through the Prometheus-compatible query API.
- **Deployment**: Prometheus Operator and Helm charts.
- **Object storage**: S3, GCS, Azure, Swift, and Tencent COS through the `thanos-io/objstore` library.
- **Learning**: interactive Killercoda tutorials.

## Alternatives

Cortex entered CNCF incubation on the same day as Thanos (see the [CNCF blog, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/)). VictoriaMetrics and M3 are the other common comparisons.

| Alternative | Differs by |
| --- | --- |
| Cortex | Push and multi-tenant aggregation from the start, rather than sidecar-first retrofit onto existing Prometheus. |
| VictoriaMetrics | Its own storage engine sold on single-system performance, instead of reusing the TSDB block format on object storage. |
| M3 | Distributed time-series store with its own clustering model. |

Thanos's distinguishing point is that it bolts onto an existing Prometheus with a sidecar, places the TSDB block format directly in object storage, and uses the recursive StoreAPI abstraction plus downsampling to make global and hierarchical queries work. Push-based aggregation via Receive came later as a second option.

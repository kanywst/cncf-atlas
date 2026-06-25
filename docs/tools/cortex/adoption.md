# Adoption & Ecosystem

## Who uses it

The names below are self-reported in the project's `ADOPTERS.md` or cited in CNCF and vendor sources. They are not independently audited.

| Organisation | Use case | Source |
| --- | --- | --- |
| Amazon Web Services | Amazon Managed Service for Prometheus is built on Cortex | [README](https://github.com/cortexproject/cortex/blob/master/README.md), [AWS](https://aws.amazon.com/prometheus/) |
| Electronic Arts | Production monitoring at over 15 million active series | [CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/) |
| GoJek | Production monitoring at over 15 million active series | [CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/) |
| REWE Digital | Production monitoring at over 15 million active series | [CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/) |
| Adobe, DigitalOcean, Etsy, Swiggy, Twilio, and others | Listed as production adopters | [ADOPTERS.md](https://github.com/cortexproject/cortex/blob/master/ADOPTERS.md) |

## Adoption signals

Measured on 2026-06-24 from the [GitHub API](https://api.github.com/repos/cortexproject/cortex):

- Stars: about 5,813.
- Forks: about 860.
- Contributors: roughly 344 (including anonymous, by API estimate).
- Open issues: 307.
- The repository is not archived; latest push was 2026-06-24, and `v1.21.1` shipped 2026-06-04.

## Ecosystem

The `cortexproject` GitHub organisation ships supporting projects: `cortex-helm-chart` for Kubernetes deployment, `cortex-tools` (cortextool) for managing rules and alerts, `cortex-jsonnet` for config libraries, and `auth-gateway`. Cortex consumes data from Prometheus remote write and is queried through Grafana as a Prometheus-compatible data source. Blocks storage runs on S3, GCS, Azure, or Swift, and the ring KV uses Consul, Etcd, or memberlist.

## Alternatives

Cortex's distinguishing axis is central remote-write ingestion plus independently scaled microservices plus strong multi-tenant isolation from ingestion through query.

| Alternative | Differs by |
| --- | --- |
| Grafana Mimir | A 2022 fork of Cortex; same push/remote-write model, with a split-and-merge compactor that pushes past TSDB index limits (tested to ~1 billion active series per tenant) and a monolithic deploy mode. |
| Thanos | Edge model built around sidecars (pull) or a receiver (push); preserves existing Prometheus servers, with weaker multi-tenant isolation. Shares shipper, store-gateway, and compactor code with Cortex. |
| VictoriaMetrics | Single-binary oriented, minimal configuration, tuned for performance and simplicity rather than the microservice topology. |

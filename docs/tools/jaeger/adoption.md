# Adoption & Ecosystem

## Who uses it

These adopters have a public case study, talk, or engineering post. The project's `ADOPTERS.md` lists more than 26 organisations including Tencent, Northwestern Mutual, SeatGeek, and Nets; the ones below are those with a citable account of how they use Jaeger.

| Organisation | Use case | Source |
| --- | --- | --- |
| Uber | Built Jaeger to trace requests across its microservices. | [Evolving Distributed Tracing at Uber Engineering](https://eng.uber.com/distributed-tracing/) |
| Grafana Labs | Used Jaeger and reported query performance gains up to 10x. | [Grafana Labs case study](https://medium.com/jaegertracing/grafana-labs-teams-observed-query-performance-improvements-up-to-10x-with-jaeger-cec84b0e3609) |
| Logz.io | Tuned Jaeger for tracing performance at scale. | [Performance Blitz with Jaeger](https://logz.io/blog/jaeger-tracing-performance/) |
| Ticketmaster | Traces 100 million transactions per day with Jaeger. | [Ticketmaster case study](https://medium.com/jaegertracing/ticketmaster-traces-100-million-transactions-per-day-with-jaeger-38ec6cf599f0) |
| Weaveworks | Combined Jaeger tracing with logs and metrics for troubleshooting. | [Weaveworks case study](https://medium.com/jaegertracing/weaveworks-combines-jaeger-tracing-with-logs-and-metrics-for-a-troubleshooting-swiss-army-knife-5afc0f42b22e) |
| Red Hat | Listed in `ADOPTERS.md`; maintains the jaeger-openshift integration. | [ADOPTERS.md](https://github.com/jaegertracing/jaeger/blob/main/ADOPTERS.md) |

## Adoption signals

Measured from the GitHub API on 2026-06-22: 22,911 stars, 2,967 forks, 446 open issues, and roughly 482 contributors. The repository was created on 2016-04-15. Jaeger was the seventh project to graduate in CNCF (2019-10-31), per the [graduation announcement](https://www.cncf.io/announcements/2019/10/31/cloud-native-computing-foundation-announces-jaeger-graduation/). The maintainer roster (`MAINTAINERS.md`) spans Grafana Labs, Red Hat, Bloomberg, Meta, Paessler, and PackSmith, and includes the original author Yuri Shkuro.

## Ecosystem

- **OpenTelemetry**: v2 is built on the OpenTelemetry Collector, and instrumentation uses the OpenTelemetry SDKs.
- **Prometheus**: Service Performance Monitoring (SPM) derives RED metrics from spans via the spanmetrics connector.
- **Kafka**: `kafkareceiver` and `kafkaexporter` let Kafka act as an ingestion buffer.
- **Grafana**: a common visualization front end for Jaeger data.
- **Storage backends**: Cassandra, Elasticsearch, OpenSearch, ClickHouse, Badger, in-memory, and a remote gRPC store.
- **Kubernetes**: the jaeger-operator deploys and manages Jaeger; service meshes such as Istio and Envoy commonly send traces to it.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Grafana Tempo | Object-storage backed and cost-optimized, tightly tied to Grafana. Jaeger offers pluggable storage backends with its own UI and query API. |
| Zipkin | The earlier OSS project Jaeger drew from. Jaeger can receive Zipkin-format spans through its zipkin receiver. |
| SigNoz | OpenTelemetry-native unified observability. Jaeger focuses on tracing and carries CNCF Graduated status and a long adoption record. |
| Commercial APM (Datadog, New Relic, Honeycomb, Elastic APM, AWS X-Ray) | Managed, with bundled metrics and logs. Jaeger is open source, trace-focused, and OTel Collector-native in v2. |

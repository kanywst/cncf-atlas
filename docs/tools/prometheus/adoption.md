# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS` file. The organisations that can be named with a citable source are those called out around the CNCF graduation in 2018.

| Organisation | Use case | Source |
| --- | --- | --- |
| DigitalOcean | Named as a contributor at graduation | [CNCF announcement](https://www.cncf.io/announcements/2018/08/09/prometheus-graduates/) |
| Weaveworks | Named as a contributor at graduation | [CNCF announcement](https://www.cncf.io/announcements/2018/08/09/prometheus-graduates/) |
| ShowMax | Named as a contributor at graduation | [CNCF announcement](https://www.cncf.io/announcements/2018/08/09/prometheus-graduates/) |
| Uber | Named as a contributor at graduation | [CNCF announcement](https://www.cncf.io/announcements/2018/08/09/prometheus-graduates/) |
| ShuttleCloud | Listed as an adopter in the graduation coverage | [SD Times](https://sdtimes.com/cloud/prometheus-becomes-second-project-to-graduate-from-cncf-incubation/) |
| Datawire | Listed as an adopter in the graduation coverage | [SD Times](https://sdtimes.com/cloud/prometheus-becomes-second-project-to-graduate-from-cncf-incubation/) |
| iAdvize | Listed as an adopter in the graduation coverage | [SD Times](https://sdtimes.com/cloud/prometheus-becomes-second-project-to-graduate-from-cncf-incubation/) |

## Adoption signals

Without an adopters file, GitHub signals carry the weight. Measured against the `prometheus/prometheus` repository on 2026-06-22 (10):

- Stars: 64,698
- Forks: 10,513
- Open issues: 859
- Language: Go; License: Apache-2.0

At graduation in 2018 the project reported more than 1,000 contributors, over 13,000 commits, and roughly 20 active maintainers (1)(4). Founder Julius Volz described Prometheus as a de facto standard for metrics-based monitoring at that time (1).

## Ecosystem

These ship as separate repositories or projects around the core:

- **Alertmanager**: routes, deduplicates, and silences alerts; the destination the notifier sends to.
- **Pushgateway**: a push relay for short-lived batch jobs.
- **Exporters** (node_exporter and others): turn non-Prometheus systems into metrics endpoints.
- **Client libraries** (client_golang and others): instrument applications.
- **Grafana**: the de facto visualization layer.
- **Kubernetes**: tightly coupled service discovery, with kube-prometheus and the Prometheus Operator (4).

## Alternatives

Prometheus alone is bounded: local disk storage, no native clustering, and memory that grows linearly with cardinality. The alternatives below mostly exist to lift those limits, so the choice is usually about how you scale beyond a single server (5).

| Alternative | Differs by |
| --- | --- |
| Thanos (CNCF) | Reuses Prometheus source; adds HA and long-term retention via a sidecar plus object storage. Smallest migration path, but the sidecar disables compaction and adds gRPC overhead (5) |
| Grafana Mimir / Cortex (CNCF) | Cortex-derived microservices design; strongest multi-tenancy but high operational cost. Mimir is the recommended path for new deployments (5) |
| VictoriaMetrics | A from-scratch reimplementation: single binary, high compression, better cardinality tolerance. Its MetricsQL extends PromQL, a mild lock-in; supports remote write (5) |
| InfluxDB | Push model, dedicated TSDB; not PromQL-compatible, so migration means rewriting queries and instrumentation (5) |

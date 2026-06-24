# Prometheus

> A metrics-based monitoring system that pulls time series over HTTP, stores them in a local time series database, and queries them with PromQL.

- **Category**: Observability
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [prometheus/prometheus](https://github.com/prometheus/prometheus)
- **Documented at commit**: `fc561264` (release-3.13, 3.13.0-rc.0)

## What it is

Prometheus collects numeric time series. It discovers targets, scrapes their HTTP metrics endpoints on an interval, and writes the samples to a local time series database. Each series is identified by a metric name plus a set of key/value labels, so the same metric can be sliced by instance, job, or any other dimension. PromQL queries that data for dashboards, alerts, and ad-hoc investigation.

A single Prometheus server is autonomous. It does not depend on distributed storage, and the binary that scrapes is also the binary that stores and serves queries (README:28-33). The multi-dimensional data model and PromQL are the features the project lists first as its distinguishing traits (README:26-35).

It sits at the metrics layer of an observability stack. Alertmanager handles alert routing downstream, exporters expose third-party systems as metrics, and Grafana is the usual visualization front end. For high availability and long-term retention, an external layer such as Thanos or Mimir is stacked on top.

## When to use it

- You need metrics-based monitoring of infrastructure or services that expose (or can be made to expose) an HTTP metrics endpoint.
- You run dynamic infrastructure such as Kubernetes, where service discovery beats static target lists.
- You want a query language for ad-hoc analysis and alerting, not just fixed dashboards.
- It is a poor fit when you need event logging or distributed tracing; those are separate signals with separate tools.
- A single server hits limits on retention and cardinality, since storage is local disk and memory scales with active series. At that point you add a remote layer rather than scaling Prometheus itself.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [CNCF announces Prometheus graduation](https://www.cncf.io/announcements/2018/08/09/prometheus-graduates/)
2. [Prometheus (software) - Wikipedia](https://en.wikipedia.org/wiki/Prometheus_(software))
3. [Prometheus monitoring tool joins Kubernetes as CNCF graduated project (TechCrunch)](https://techcrunch.com/2018/08/09/prometheus-monitoring-tool-joins-kubernetes-as-cncfs-latest-graduated-project/)
4. [Prometheus becomes second project to graduate from CNCF incubation (SD Times)](https://sdtimes.com/cloud/prometheus-becomes-second-project-to-graduate-from-cncf-incubation/)
5. [Best Prometheus Alternatives in 2026 (Tiger Data)](https://www.tigerdata.com/learn/prometheus-alternatives)
6. [Prometheus on CNCF projects](https://www.cncf.io/projects/prometheus/)
7. [Prometheus official site and docs](https://prometheus.io/)
8. [Prometheus first steps installation guide](https://prometheus.io/docs/prometheus/latest/getting_started/)
9. [prometheus/prometheus README (pinned commit fc561264)](https://github.com/prometheus/prometheus)
10. [prometheus/prometheus GitHub repository metadata](https://github.com/prometheus/prometheus)

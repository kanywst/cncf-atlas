# Adoption & Ecosystem

## Who uses it

The Collector core repository has no `ADOPTERS` file, so this deep-dive does not name individual companies as Collector adopters. Doing so would require a citable case study, and none was established in research. What is citable is the backing at the project's founding: Google, Microsoft, Amazon, Splunk, and Datadog were named as backers when OpenTelemetry was announced in 2019. ([merger announcement](https://opensource.microsoft.com/blog/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/))

| Organisation | Use case | Source |
| --- | --- | --- |
| Founding backers (Google, Microsoft, Amazon, Splunk, Datadog) | Backed the project at launch | [merger announcement](https://opensource.microsoft.com/blog/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/) |

## Adoption signals

At graduation CNCF reported the project as a whole had over 12,000 contributors and over 2,800 contributing companies, and called OpenTelemetry the second-highest-velocity project in CNCF after Kubernetes. ([graduation announcement](https://www.cncf.io/announcements/2026/05/21/cloud-native-computing-foundation-announces-opentelemetrys-graduation-solidifying-status-as-the-de-facto-observability-standard/))

For the Collector core repository alone, the GitHub API on 2026-06-23 reported roughly 7,159 stars, 2,116 forks, and about 607 contributors. ([opentelemetry-collector](https://github.com/open-telemetry/opentelemetry-collector))

## Ecosystem

The core repository is deliberately small. The real component breadth lives in `opentelemetry-collector-contrib`, which holds hundreds of receivers, processors, and exporters, many contributed by observability vendors who maintain their own exporters there. Operators combine the components they need with the OpenTelemetry Collector Builder (OCB) under `cmd/builder`. Adjacent CNCF projects interoperate: Jaeger as a trace backend, Prometheus for metrics, and Fluentd for logs. ([graduation blog](https://opentelemetry.io/blog/2026/otel-graduates/))

## Alternatives

The Collector's core distinction is that it handles vendor-neutral OTLP across every signal (traces, metrics, logs, and the experimental profiles), so backends and agents can be swapped without re-instrumenting. The alternatives below are also OTLP-compatible in practice, which keeps migration between them tractable. ([SigNoz comparison](https://signoz.io/comparisons/opentelemetry-collector-vs-fluentbit/))

| Alternative | Differs by |
| --- | --- |
| [Grafana Alloy](https://oneuptime.com/blog/post/2026-02-06-compare-opentelemetry-collector-vs-grafana-alloy/view) | Grafana distribution that wraps Collector components with HCL-style config, a local pipeline UI, and strong Prometheus remote write, Loki, and Pyroscope paths |
| [Fluent Bit](https://www.parseable.com/blog/observability-agent-profiling-fluent-bit-vs-opentelemetry-collector-performance-analysis) | C, log-forwarding focused, very light; a common Kubernetes DaemonSet log collector. Does small high-frequency I/O where the Collector batches larger and pages more calmly |
| [Vector](https://victoriametrics.com/blog/log-collectors-benchmark-2026/) | Rust, Datadog-built, high throughput and low memory, strong at routing logs and metrics, vendor-neutral |

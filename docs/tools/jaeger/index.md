# Jaeger

> A distributed tracing platform that collects, stores, and visualizes traces; in v2 it ships as an OpenTelemetry Collector distribution.

- **Category**: Observability
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [jaegertracing/jaeger](https://github.com/jaegertracing/jaeger)
- **Documented at commit**: `d5e2ccd` (2026-06-22)

## What it is

Jaeger is a distributed tracing system. It ingests spans emitted by instrumented services, stores them in a pluggable backend, and serves a query API and web UI for inspecting traces end to end. It was built at Uber to answer questions that logs and metrics cannot: where a request spent its time, and which service in a call graph caused a slowdown or error.

Jaeger v2 is not a standalone server. The binary embeds an OpenTelemetry Collector (`otelcol`) and registers Jaeger features as Collector extensions, receivers, processors, and exporters (`cmd/jaeger/internal/components.go:50`). OTLP is the first-class input format. Configuration is the same YAML that any OpenTelemetry Collector uses: pipelines plus extensions.

Storage is decoupled from ingestion. Jaeger writes traces through a single `Writer` interface (`internal/storage/v2/api/tracestore/writer.go:13`) backed by Cassandra, Elasticsearch, OpenSearch, ClickHouse, Badger, in-memory, or a remote gRPC store. The query side reads through a matching `Reader` interface that streams results.

## When to use it

- You run microservices and need to see latency and errors across a call graph, not just per service.
- Your services already emit OpenTelemetry traces and you want an OTLP-native backend.
- You want to choose your own trace storage backend rather than be locked to one.
- You want an open source, CNCF Graduated option with its own query API and UI.

It is a weaker fit when you only need metrics or logs, since Jaeger is trace-focused. It is also a weaker fit when you want a single managed product that bundles traces, logs, and metrics with no operational work.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [jaegertracing/jaeger (GitHub)](https://github.com/jaegertracing/jaeger)
2. [Jaeger project site](https://www.jaegertracing.io/)
3. [Jaeger project page (CNCF)](https://www.cncf.io/projects/jaeger/)
4. [CNCF announces Jaeger graduation (2019-10-31)](https://www.cncf.io/announcements/2019/10/31/cloud-native-computing-foundation-announces-jaeger-graduation/)
5. [Jaeger v2 released (Medium)](https://medium.com/jaegertracing/jaeger-v2-released-09a6033d1b10)
6. [Evolving Distributed Tracing at Uber Engineering](https://eng.uber.com/distributed-tracing/)
7. [Jaeger Getting Started Guide](https://www.jaegertracing.io/docs/latest/getting-started/)

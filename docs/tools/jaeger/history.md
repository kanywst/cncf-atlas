# History

## Origin

Jaeger started at Uber in 2015. The engineering team needed to understand request flow across a fast-growing fleet of microservices, where a single user action fans out into many service calls. The design drew on Google's Dapper paper and on OpenZipkin. Uber described the motivation and approach in [Evolving Distributed Tracing at Uber Engineering](https://eng.uber.com/distributed-tracing/). Uber open sourced the project in 2017.

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | Development begins inside Uber, inspired by Google Dapper and OpenZipkin. |
| 2017 | Uber open sources Jaeger; accepted into CNCF as an incubating project on 2017-09-13. |
| 2019 | Jaeger graduates in CNCF on 2019-10-31, the foundation's seventh graduated project. |
| 2022 | The native Jaeger client libraries are retired; instrumentation moves to the OpenTelemetry SDKs. |
| 2024 | Jaeger v2 announced, rebuilding the backend on the OpenTelemetry Collector. |

## How it evolved

Jaeger began as an implementation of the OpenTracing API. As OpenTracing and OpenCensus merged into OpenTelemetry, Jaeger followed: the project deprecated its own client libraries and pointed users at the OpenTelemetry SDKs for instrumentation.

The largest shift is Jaeger v2, announced in late 2024 and described in [Jaeger v2 released](https://medium.com/jaegertracing/jaeger-v2-released-09a6033d1b10). v1 shipped separate Agent, Collector, and Query binaries. v2 collapses these into a single binary built as an OpenTelemetry Collector distribution. The Collector core handles receiving, batching, and pipeline wiring; Jaeger's own capabilities (query API and UI, storage, sampling) are registered as Collector extensions (`cmd/jaeger/internal/components.go:50`). This makes OTLP the primary ingestion path and lets Jaeger reuse the Collector's receivers and processors instead of maintaining its own.

The transition is still in progress in the code. The exporter that writes spans into Jaeger storage is registered at `StabilityLevelDevelopment` (`cmd/jaeger/internal/exporters/storageexporter/factory.go:27`), and it bridges to the v1 `spanstore.SpanWriter` model internally (`cmd/jaeger/internal/components.go:116`). A v1 and v2 storage API coexist (`internal/storage/v1`, `internal/storage/v2`), with the v2 API working directly on OTLP `ptrace.Traces`.

## Where it stands now

Jaeger is a CNCF Graduated project under active development. The pinned commit `d5e2ccd` sits just after the `v2.19.0` release (2026-06-03). Governance is documented in `GOVERNANCE.md` and the maintainer roster in `MAINTAINERS.md`, which includes the original author Yuri Shkuro along with maintainers from Grafana Labs, Red Hat, Bloomberg, and others. The stated direction is to complete the move onto the OpenTelemetry Collector while keeping Jaeger's query API, UI, and pluggable storage backends.

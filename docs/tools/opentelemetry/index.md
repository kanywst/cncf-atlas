# OpenTelemetry

> A vendor-neutral standard and toolchain for generating, collecting, and exporting traces, metrics, and logs.

- **Category**: Observability
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [open-telemetry/opentelemetry-collector](https://github.com/open-telemetry/opentelemetry-collector)
- **Documented at commit**: `415d3dca` (2026-06-18, near tag `v0.154.0`)

## What it is

OpenTelemetry is a CNCF project made of three parts: a specification, per-language SDKs, and the Collector. This deep-dive focuses on the Collector ([open-telemetry/opentelemetry-collector](https://github.com/open-telemetry/opentelemetry-collector)), the Go implementation that receives telemetry, processes it, and forwards it to backends.

The Collector reads a YAML config and turns it into a directed graph of components. Receivers take telemetry in, processors transform it in order, exporters send it out, connectors bridge two pipelines, and extensions provide side features like health checks. The project tracks two module versions: stable `v1.60.0` (the `pdata` data model and config packages) and beta `v0.154.0` (the service and component machinery), declared in `versions.yaml:6` and `versions.yaml:33`.

The repository ships `cmd/otelcorecol`, a generated test distribution. Production binaries are not built from this `go.mod`; operators assemble their own binary with the OpenTelemetry Collector Builder (OCB) from a manifest, as the `go.mod` header comment states (`go.mod:3`).

## When to use it

- You want a single agent or gateway that ingests traces, metrics, and logs in the vendor-neutral OTLP format and fans them out to one or more backends.
- You need to decouple instrumentation from backends so you can switch observability vendors without re-instrumenting applications.
- You want to batch, filter, redact, or enrich telemetry in a pipeline before it leaves your network.
- It is a weaker fit when you only ship container logs and need the lightest possible footprint; a purpose-built log forwarder may use less memory (see [Adoption & Ecosystem](./adoption)).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how telemetry flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [opentelemetry-collector (GitHub)](https://github.com/open-telemetry/opentelemetry-collector)
2. [CNCF: OpenTelemetry Graduation announcement](https://www.cncf.io/announcements/2026/05/21/cloud-native-computing-foundation-announces-opentelemetrys-graduation-solidifying-status-as-the-de-facto-observability-standard/)
3. [CNCF projects: OpenTelemetry](https://www.cncf.io/projects/opentelemetry/)
4. [OpenTelemetry is a CNCF Graduated Project](https://opentelemetry.io/blog/2026/otel-graduates/)
5. [Announcing OpenTelemetry: merger of OpenCensus and OpenTracing](https://opensource.microsoft.com/blog/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/)
6. [OpenTelemetry Collector Getting Started](https://opentelemetry.io/docs/collector/getting-started/)

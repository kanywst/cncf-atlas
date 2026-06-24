# Getting Started

> Verified against the core distribution at commit `415d3dca` (build version `0.154.0-dev`). Commands assume a Unix shell with Go and `make` installed and a clone of the repository.

## Prerequisites

- Go (the version pinned in the repository `go.mod`)
- `make`
- A clone of [open-telemetry/opentelemetry-collector](https://github.com/open-telemetry/opentelemetry-collector)

## Install

The core `otelcorecol` binary is a test distribution built from the repository. Build it with the Make target.

```bash
git clone https://github.com/open-telemetry/opentelemetry-collector.git
cd opentelemetry-collector
make otelcorecol
```

For a real deployment you do not use this binary. You assemble your own with the OpenTelemetry Collector Builder (OCB) under `cmd/builder`, selecting the components you need. See the [official getting started guide](https://opentelemetry.io/docs/collector/getting-started/).

## A first working setup

The repository ships a minimal config at `examples/local/otel-config.yaml`: an `otlp` receiver, a `memory_limiter` processor, and a `debug` exporter wired into traces, metrics, and logs pipelines, plus the `zpages` extension.

Step 1, run the core binary against the example config.

```bash
make run
```

This invokes `otelcorecol` with `--config examples/local/otel-config.yaml`. The OTLP receiver listens on `localhost:4317` (gRPC) and `localhost:4318` (HTTP), and the `debug` exporter prints received telemetry to stdout at `detailed` verbosity.

Step 2, send a span. Point any OTLP exporter or the OpenTelemetry SDK at `localhost:4317`. The `debug` exporter writes the decoded telemetry to the Collector's standard output.

## Verify it works

The example config enables the `zpages` extension on `localhost:55679`. Open the `/debug/servicez` and `/debug/pipelinez` paths there to confirm the service and pipelines are live. You can also watch the Collector log for component start lines and for the `debug` exporter printing telemetry as it arrives.

## Where to go next

For production concerns such as high availability, securing the OTLP endpoints, batching and queueing, and scaling agent versus gateway deployments, follow the [official Collector documentation](https://opentelemetry.io/docs/collector/getting-started/). Build your production binary with OCB rather than shipping `otelcorecol`.

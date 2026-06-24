# Getting Started

> Verified against the `jaegertracing/jaeger` v2 image. Commands assume Docker is installed and able to pull public images.

## Prerequisites

- Docker, or a Go 1.26 toolchain if you build from source.
- A service or load generator that emits OTLP traces over gRPC (port `4317`) or HTTP (port `4318`).

## Install

The fastest path is the all-in-one container. It bundles the receivers, query API, UI, and in-memory storage in one process.

```bash
docker run --rm --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/jaeger:latest
```

To build from source instead, clone the repository and run `make build-jaeger`, which builds the UI submodule first and then compiles the `jaeger` binary.

## A first working setup

When started with no `--config` flag, the binary logs that it is using the default all-in-one configuration with memory storage and injects an embedded config (`cmd/jaeger/internal/command.go:68`). That config wires a `traces` pipeline with `otlp`, `jaeger`, and `zipkin` receivers, a `batch` processor, and the `jaeger_storage_exporter`, plus the `jaeger_query` extension for the UI.

Once the container is running, point an OpenTelemetry SDK or the OTLP exporter at `localhost:4317` (gRPC) or `localhost:4318` (HTTP) and send some spans. With no app handy, the repository ships a `tracegen` tool under `cmd/tracegen` that generates synthetic traces.

To customize storage or sampling, pass your own Collector config:

```bash
docker run --rm --name jaeger \
  -v "$(pwd)/config.yaml:/etc/jaeger/config.yaml" \
  -p 16686:16686 -p 4317:4317 -p 4318:4318 \
  jaegertracing/jaeger:latest --config /etc/jaeger/config.yaml
```

## Verify it works

Open the UI at `http://localhost:16686` in a browser. After traces arrive, the service you instrumented appears in the Service dropdown, and Find Traces lists them. The startup log line "No '--config' flags detected, using default All-in-One configuration with memory storage." confirms the default path is active.

## Where to go next

See the [Jaeger Getting Started Guide](https://www.jaegertracing.io/docs/latest/getting-started/) for production deployment, and the [project site](https://www.jaegertracing.io/) for storage backend configuration, sampling strategies, and Service Performance Monitoring. Remember that the default in-memory store is a fixed ring buffer and drops old traces, so production setups should configure a durable backend such as Cassandra, Elasticsearch, or OpenSearch.

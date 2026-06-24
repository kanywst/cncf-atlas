# Internals

> Read from the source at commit `d5e2ccd`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/jaeger/main.go` | Process entry point; wires subcommands and config flags. |
| `cmd/jaeger/internal/command.go` | Builds the Collector command; injects the default all-in-one config. |
| `cmd/jaeger/internal/components.go` | Registers all receivers, processors, exporters, and extensions. |
| `cmd/jaeger/internal/exporters/storageexporter/` | The exporter that writes spans into a Jaeger storage backend. |
| `internal/storage/v2/api/tracestore/` | The v2 storage abstraction: `Writer` and `Reader` interfaces. |
| `internal/storage/v2/memory/` | The in-memory trace store implementation. |
| `internal/jptrace/sanitizer/` | Span sanitizers applied before writing. |

## Core data structures

The system turns on OTLP `ptrace.Traces` (OpenTelemetry pdata). It is the native in-memory representation in v2; receivers, processors, exporters, and storage all pass it around. The older Jaeger-specific `model.Span` is being phased out.

The storage contract is two interfaces. `Writer` has a single method (`internal/storage/v2/api/tracestore/writer.go:13`):

```go
type Writer interface {
    // WriteTraces writes a batch of spans to storage. Idempotent.
    WriteTraces(ctx context.Context, td ptrace.Traces) error
}
```

`Reader` (`internal/storage/v2/api/tracestore/reader.go:16`) returns Go 1.23 iterators rather than slices, so large result sets stream:

```go
GetTraces(ctx context.Context, traceIDs ...GetTraceParams) iter.Seq2[[]ptrace.Traces, error]
FindTraces(ctx context.Context, query TraceQueryParams) iter.Seq2[[]ptrace.Traces, error]
```

The exporter itself is small (`cmd/jaeger/internal/exporters/storageexporter/exporter.go:19`): a `config`, a `traceWriter tracestore.Writer`, a `logger`, and a `sanitizer.Func`. The in-memory backend's per-tenant state is a fixed-size ring buffer (`internal/storage/v2/memory/tenant.go:24`): an `ids map[pcommon.TraceID]int` index, a `traces []traceAndId` ring, and a `mostRecent int` cursor sized by `MaxTraces`.

## A path worth tracing

Writing one OTLP batch to storage starts at the exporter factory, which registers the traces exporter at `StabilityLevelDevelopment` (`cmd/jaeger/internal/exporters/storageexporter/factory.go:27`). `createTracesExporter` (`:39`) wraps `ex.pushTraces` with `exporterhelper.NewTraces`, disabling the per-call timeout and adding retry and queue behaviour (`:47`).

At startup, `start()` resolves the backend from the `jaeger_storage` extension and stores the writer (`cmd/jaeger/internal/exporters/storageexporter/exporter.go:34`):

```go
f, err := jaegerstorage.GetTraceStoreFactory(exp.config.TraceStorage, host)
...
if exp.traceWriter, err = f.CreateTraceWriter(); err != nil {
    return fmt.Errorf("cannot create trace writer: %w", err)
}
```

Each batch then flows through `pushTraces` (`cmd/jaeger/internal/exporters/storageexporter/exporter.go:52`):

```go
func (exp *storageExporter) pushTraces(ctx context.Context, td ptrace.Traces) error {
    return exp.traceWriter.WriteTraces(ctx, exp.sanitizer(td))
}
```

The sanitizer is a chain assembled in `NewStandardSanitizers` (`internal/jptrace/sanitizer/sanitizer.go:18`): empty service name, empty span name, UTF-8, then negative duration. For the in-memory backend, `WriteTraces` (`internal/storage/v2/memory/memory.go:65`) groups spans by trace id with `reshuffleResourceSpans` (`:161`), looks up the tenant via `tenancy.GetTenant(ctx)`, and stores into the ring buffer.

## Things that surprised me

The "no config file" experience is a deliberate hack, not a Collector feature. `Command()` swaps out cobra's `RunE`, checks whether `--config` was set, and if not injects the embedded `all-in-one.yaml` as a `yaml:` provider URI (`cmd/jaeger/internal/command.go:68`). The source comment notes there is no official OTel hook for this.

The storage exporter is still `StabilityLevelDevelopment` (`cmd/jaeger/internal/exporters/storageexporter/factory.go:27`) and is described in the registry as a bridge to the v1 `spanstore.SpanWriter` (`cmd/jaeger/internal/components.go:116`). v2 ships, but its write path still leans on v1 storage plumbing underneath.

The in-memory store is a fixed ring buffer (`internal/storage/v2/memory/tenant.go:24`). Once `MaxTraces` is reached, the oldest trace is evicted and its id deleted from the index. It is fine for demos and tests, but it silently drops old data, which is why production deployments point at a durable backend.

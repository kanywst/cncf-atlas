# Internals

> Read from the source at commit `3bdb192` (near tag `v2.11.0`). Every claim here points at a file and line. Note the module path is still `github.com/megaease/easegress/v2` even though the repo lives at `easegress-io/easegress`.

## Code map

| Path | Responsibility |
| --- | --- |
| `pkg/supervisor` | Object lifecycle and registration: `registry.go`, `supervisor.go`, `spec.go` |
| `pkg/object/*` | Traffic gates, pipelines, and controllers: `httpserver`, `pipeline`, `trafficcontroller`, `meshcontroller`, `aigatewaycontroller`, the service registries |
| `pkg/filters/*` | Filter implementations and the registration registry (`filters.go`, `registry.go`) |
| `pkg/cluster` | Embedded etcd, key-space layout, syncer, watcher, mutex, STM |
| `pkg/context` | Request execution context and the `Handler` / `MuxMapper` interfaces |
| `pkg/protocols` | Protocol abstractions (HTTP, MQTT) as request and response |
| `pkg/resilience` | Circuit breaker, rate limiter, retry, and time limiter policies |
| `cmd/server`, `cmd/client`, `cmd/builder` | The server binary, the `egctl` CLI, and the custom builder |

## Core data structures

`supervisor.Object` (`pkg/supervisor/registry.go:30`) is the interface every managed thing implements: `Category`, `Kind`, a default spec, status, and close. Objects that carry traffic also implement `TrafficObject` with `Init` and `Inherit` (`pkg/supervisor/registry.go:61`). The category constants and their startup priority sit together (`pkg/supervisor/registry.go:102`), so the supervisor knows to start system controllers before traffic gates and stop them in reverse.

`filters.Filter` (`pkg/filters/filters.go:54`) is the filter contract: `Name`, `Kind`, `Spec`, `Init`, `Inherit`, `Handle(ctx) result`, `Status`, and `Close`. The `Kind` metadata struct (`pkg/filters/filters.go:33`) carries the filter's `Name`, `Description`, `Results` (the set of result strings it can return), a `CreateInstance` factory, and a default spec. A filter that accepts resilience policies additionally implements `Resiliencer.InjectResiliencePolicy` (`pkg/filters/filters.go:86`). The `Results` set is the type-level link between what a filter can emit and what a pipeline is allowed to branch on.

`pipeline.Pipeline` (`pkg/object/pipeline/pipeline.go:63`) holds a `filters` map, an ordered `flow`, and a resilience map. Its spec carries flow, filters, resilience, and data (`pkg/object/pipeline/pipeline.go:73`). The load-bearing type is `FlowNode` (`pkg/object/pipeline/pipeline.go:81`): a filter name, an alias, a namespace, a `JumpIf map[result]target`, and the resolved filter. `Spec.ValidateJumpIf` (`pkg/object/pipeline/pipeline.go:112`) checks, backward through the flow, that each result named in a `JumpIf` is in the filter's declared `Results` and that every jump target exists.

`cluster.Cluster` (`pkg/cluster/cluster_interface.go:33`) exposes KV, watch, syncer, and STM over etcd. The concrete `cluster` struct holds an `*embed.Etcd` server (`pkg/cluster/cluster.go:123`), the embedded etcd node that every server carries.

## A path worth tracing

Follow how a filter's result string drives the pipeline, since that is the core of Easegress's orchestration model.

```text
Pipeline.Handle            pkg/object/pipeline/pipeline.go:357
  -> doHandle              pipeline.go:371
       node.filter.Handle  pipeline.go:390   filter returns a result string
       JumpIf[result]      pipeline.go:399   pick next node, or END
```

Registration comes first. Each filter package's `init()` calls `filters.Register(&Kind{...})` (`pkg/filters/registry.go:29`), which stores the kind in a global map keyed by name and panics on a duplicate (`pkg/filters/registry.go:34`). `GetKind(name)` reads it back (`pkg/filters/registry.go:76`).

When a pipeline is built, `ValidateJumpIf` (`pkg/object/pipeline/pipeline.go:112`) resolves each node's kind with `filters.GetKind(spec.Kind()).Results` (`pkg/object/pipeline/pipeline.go:123`) and verifies that every result the pipeline branches on is one the filter actually declares. A typo in a `JumpIf` result is caught at construction, not at request time.

At request time, `doHandle` (`pkg/object/pipeline/pipeline.go:371`) walks the flow. It calls `node.filter.Handle(ctx)` (`pkg/object/pipeline/pipeline.go:390`), records the filter's duration and result as a `FilterStat`, then resolves the next node: an empty result continues to the next node in order, and a non-empty result indexes `node.JumpIf[result]` (`pkg/object/pipeline/pipeline.go:399`). If the result is non-empty and has no `JumpIf` entry, the flow jumps to the built-in end. This is what makes declarative orchestration work: a validator that returns `invalid` can be wired to jump to a fallback filter, all in configuration.

## Things that surprised me

Resilience is not a pipeline stage. The v2.0 design folded circuit breaker, retry, and time limiter into the Proxy filter, which receives them through `InjectResiliencePolicy` (`pkg/filters/proxies/httpproxy/proxy.go:362`) and distributes them to its main and candidate pools. Reading the code, the historical decision to move resilience out of standalone filters is visible directly: the policies ride with the proxy's pools rather than sitting as separate hops.

The handler contract is a single method. `Handler` is just `Handle(ctx) string` (`pkg/context/context.go:35`). From the HTTP server's side, a whole pipeline is one method that returns a string. That is the seam that lets the same pipeline model serve HTTP, gRPC, and MQTT without the gate knowing which protocol it is.

etcd ships inside the binary. `pkg/cluster` imports `go.etcd.io/etcd/server/v3/embed` (`pkg/cluster/cluster.go:31`) and starts a real etcd server with `embed.StartEtcd` (`pkg/cluster/cluster.go:586`). There is no external etcd to deploy; the operational simplicity is paid for by a binary that contains an entire etcd server.

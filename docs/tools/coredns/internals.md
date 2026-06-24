# Internals

> Read from the source at commit `cc88c96e`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/coredns.go` | `main()`; blank-imports all in-tree plugins and calls `coremain.Run()`. |
| `src/core/dnsserver/` | Server core: Corefile registration, per-zone chain build, `ServeDNS` dispatch. |
| `src/plugin/` | Each plugin in its own directory; the `Handler` and `Plugin` types. |
| `src/plugin/pkg/proxy/` | The upstream proxy that `forward` and `grpc` use to talk to other resolvers. |
| `src/request/` | `request.Request`, the per-query wrapper that caches client and EDNS state. |
| `src/plugin.cfg` | The ordered plugin list that `go generate` turns into wiring code. |

## Core data structures

`dnsserver.Config` is the settings for one server block (one zone on one port). It carries `Zone`, `Port`, `ListenHosts`, `Transport`, the filter functions, the view name, the assembled `pluginChain`, the plugin factory list `Plugin`, and a name-to-Handler registry (`src/core/dnsserver/config.go:18-44`).

`dnsserver.Server` is the thing listening on a port. Its `zones map[string][]*Config` maps a zone string to the configs that serve it, and it tracks flags like `classChaos`, `debug`, and `stacktrace`, plus the trace plugin and TSIG secrets (`src/core/dnsserver/server.go:49-56`).

`plugin.Plugin` and `plugin.Handler` are the heart of the chain. `Plugin` is `func(Handler) Handler`, a factory that takes the next handler and returns itself wrapping it (`src/plugin/plugin.go:18`). `Handler.ServeDNS` returns an rcode and an error, unlike the standard `dns.Handler`, which is what lets a plugin tell the layers above whether it already wrote a response (`src/plugin/plugin.go:50-53`).

`request.Request` wraps `*dns.Msg` and `dns.ResponseWriter` and lazily caches `size`, `do`, `family`, `name`, `ip`, and `port` so plugins do not recompute them on every access (`src/request/request.go:14-33`).

## A path worth tracing

Take the `forward` plugin resolving one query against an upstream. Its `ServeDNS` first checks whether the query is in its scope, and if not it passes control to the next plugin:

```go
func (f *Forward) ServeDNS(ctx context.Context, w dns.ResponseWriter, r *dns.Msg) (int, error) {
    state := request.Request{W: w, Req: r}
    if !f.match(state) {
        return plugin.NextOrFailure(f.Name(), f.Next, ctx, w, r)
    }
```

That is `src/plugin/forward/forward.go:109-113`. `NextOrFailure` calls `next.ServeDNS` when `next` is not nil, otherwise it returns SERVFAIL with a "no next plugin found" error (`src/plugin/plugin.go:76-89`).

If the query does match, `forward` enforces a concurrency cap (`src/plugin/forward/forward.go:115-122`), then loops over its upstream list until a deadline. It skips proxies that `proxy.Down(f.maxfails)` reports as down, and when all are down it either fails fast or randomly picks one (`src/plugin/forward/forward.go:143-157`). The actual upstream call is `ret, err = proxy.Connect(ctx, state, opts)` (`src/plugin/forward/forward.go:177`), whose implementation is `func (p *Proxy) Connect` in `src/plugin/pkg/proxy/connect.go:201`. If the response is truncated and `prefer_udp` is set, it flips to TCP and retries (`src/plugin/forward/forward.go:183-186`).

## Things that surprised me

The chain is assembled backwards. `newServer` loops from the last plugin to the first, rebinding `stack` each step:

```go
var stack plugin.Handler
for i := len(site.Plugin) - 1; i >= 0; i-- {
    stack = site.Plugin[i](stack)
```

That is `src/core/dnsserver/server.go:105-108`. Because each factory captures the current `stack` as its `Next`, building from the end makes every plugin's `Next` point at the plugin that should run after it. The execution order you read in `plugin.cfg` is the reverse of the construction order in this loop.

The same loop quietly bookmarks special plugins while it builds. The first `MetadataCollector` it sees (going backwards, so the last in execution order) becomes `site.metaCollector`, and finding a plugin named `trace` stashes it as the server's tracer (`src/core/dnsserver/server.go:113-125`). Plugin order therefore decides not just request flow but which metadata collector and tracer win.

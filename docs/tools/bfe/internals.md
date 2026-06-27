# Internals

> Read from the source at commit `d8d6dcb`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `bfe.go` | Process entry: flag parsing, config load, server startup |
| `bfe_server/` | Listeners, connection handling, the reverse proxy loop |
| `bfe_route/` | Host to product to cluster routing tables |
| `bfe_balance/bal_gslb/` | GSLB: pick a sub-cluster |
| `bfe_balance/bal_slb/` | SLB: pick a backend within a sub-cluster |
| `bfe_basic/` | Internal request type and the condition DSL |
| `bfe_module/` | Module framework and the nine callback points |
| `bfe_modules/` | 30 built-in modules |

## Core data structures

`bfe_basic.Request` (`bfe_basic/request.go:60`) is the state object carried through the whole pipeline. It wraps the incoming `HttpRequest`, the forwarded `OutRequest`, and the `HttpResponse`, plus `Route` (the resolved product and cluster), `Trans` (the chosen backend and transport), and `Stat` (per-stage timestamps). It also carries a `Context` map for passing values between modules (`bfe_basic/request.go:100`).

`bfe_route.HostTable` (`bfe_route/host_table.go:41`) is the routing core. It holds the host maps, a `hostTrie` of reversed FQDNs (fully qualified domain names), the basic route tree, and the advanced route rule table. It records configuration versions in a `Versions` struct (`bfe_route/host_table.go:57`) so the table can be hot-reloaded as a unit.

`condition.Condition` (`bfe_basic/condition/condition.go:23`) is the evaluation unit for advanced routing and module conditions. It is a one-method interface:

```go
type Condition interface {
    Match(req *bfe_basic.Request) bool
}
```

Concrete conditions are built from a `Fetcher` and a `Matcher` (`bfe_basic/condition/primitive.go:44` and `bfe_basic/condition/primitive.go:48`). The fetcher pulls a value out of the request; the matcher decides whether it passes. The pair is held by `PrimitiveCond` (`bfe_basic/condition/primitive.go:59`).

```go
type Fetcher interface {
    Fetch(req *bfe_basic.Request) (interface{}, error)
}

type Matcher interface {
    Match(interface{}) bool
}
```

`bal_gslb.BalanceGslb` (`bfe_balance/bal_gslb/bal_gslb.go:48`) holds the GSLB state for one cluster: its `subClusters`, `totalWeight`, `BalanceMode`, and the EPP client fields. `BalanceMode` is WRR (Weighted Round Robin) or WLC (Weighted Least Connection) per the field comment (`bfe_balance/bal_gslb/bal_gslb.go:61`), with retry limits seeded from `DefaultRetryMax = 3` and `DefaultCrossRetryMax = 1` (`bfe_balance/bal_gslb/bal_gslb.go:43-44`).

`bfe_server.BfeServer` (`bfe_server/bfe_server.go:45`) is the process-wide aggregate: listeners, the `ReverseProxy`, TLS state, `CallBacks`, `Modules`, `ServerConf`, and `balTable`. A `confLock sync.RWMutex` guards configuration hot-reload (`bfe_server/bfe_server.go:87`).

## A path worth tracing

The condition DSL turns a configuration string into an object tree. `condition.Build(condStr)` (`bfe_basic/condition/build.go:29`) is the entry. It parses the string into an abstract syntax tree (AST), then rejects any unresolved identifier before building.

```go
func Build(condStr string) (Condition, error) {
    node, identList, err := parser.Parse(condStr)
    if err != nil {
        return nil, err
    }

    if len(identList) != 0 {
        return nil, fmt.Errorf("found unresolved variable %s %d", identList[0].Name, identList[0].Pos())
    }

    return build(node)
}
```

The unexported `build` then recurses over AST node kinds, mapping each to a `Condition` (`bfe_basic/condition/build.go:42-55`): a `*parser.CallExpr` becomes a primitive, a `*parser.UnaryExpr` and `*parser.BinaryExpr` become composed conditions, and a `*parser.ParenExpr` unwraps to its inner node. The parser is a goyacc grammar in `bfe_basic/condition/parser/` with its own scanner and semantic check, so the DSL is a real compiled language rather than string matching.

## Things that surprised me

The SLB layer implements the smooth weighted round robin used by NGINX, by hand, in `smoothBalance` (`bfe_balance/bal_slb/bal_rr.go:251`). Each backend's `current` accumulates its `weight`; the backend with the greatest `current` is chosen, then `current -= total` to keep selection smooth across calls.

```go
func smoothBalance(backs BackendList) (*backend.BfeBackend, error) {
    var best *BackendRR
    total, max := 0, 0

    for _, backendRR := range backs {
        backend := backendRR.backend
        // skip ineligible backend
        if !backend.Avail() || backendRR.weight <= 0 {
            continue
        }

        // select backend with the greatest current weight
        if best == nil || backendRR.current > max {
            best = backendRR
            max = backendRR.current
        }
        total += backendRR.current

        // update current weight
        backendRR.current += backendRR.weight
    }
```

The forward retry loop has a hard ceiling rather than relying solely on configured retry counts. The loop is bounded to 20 iterations to avoid an endless loop (`bfe_server/reverseproxy.go:336`):

```go
    for i := 0; i < 20; i++ {
```

Inside that loop, when the GSLB mode is EPP (the `BalanceModeEPP` constant from `bfe_config/bfe_cluster_conf/cluster_conf/cluster_conf_load.go:62`, checked at `bfe_server/reverseproxy.go:339`) the backend is chosen by `bal.BalanceEpp(request)`; otherwise by `bal.Balance(request)` (`bfe_server/reverseproxy.go:349`). The chosen backend then receives the request via `transport.RoundTrip(outreq)` (`bfe_server/reverseproxy.go:403`), and on a bad response `checkBackendStatus` decides whether the backend's outlier counters trip (`bfe_server/reverseproxy.go:414`).

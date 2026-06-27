# Internals

> Read from the source at commit `56e4de0`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/aeraki/main.go` | Process entry point, flag parsing, generator registration. |
| `internal/bootstrap/server.go` | Wires controllers together and starts them. |
| `internal/controller/istio/controller.go` | Watches Istiod over MCP over xDS. |
| `internal/envoyfilter/controller.go` | Reconciles generated `EnvoyFilter` resources into Istio. |
| `internal/envoyfilter/network_filter.go` | Builds the `EnvoyFilter` patches that replace the TCP proxy. |
| `internal/plugin/metaprotocol/generator.go` | MetaProtocol generator implementation. |
| `internal/xds/server.go` | gRPC RDS server for MetaProtocol Proxy. |
| `internal/xds/cache_mgr.go` | Computes MetaProtocol routes and serves them from a snapshot cache. |
| `internal/model/config.go` | Aggregate input and output types for generators. |
| `internal/model/protocol/instance.go` | Protocol enumeration and port-name parsing. |

## Core data structures

`protocol.Instance` is a string type for protocol kinds (`internal/model/protocol/instance.go:22`), with constants for Dubbo, Thrift, Mongo, Redis, MySQL, Kafka, Zookeeper, MetaProtocol, and Unsupported (`internal/model/protocol/instance.go:24-43`). New protocols can be added at runtime via `RegisterProtocol` (`internal/model/protocol/instance.go:60`).

`Generator` is the per-protocol extension interface with a single method (`internal/envoyfilter/generator.go:22-24`):

```go
type Generator interface {
    Generate(context *model.EnvoyFilterContext) ([]*model.EnvoyFilterWrapper, error)
}
```

`model.EnvoyFilterContext` is the aggregate input to a generator, bundling `MeshConfig`, `Gateway`, `ServiceEntry`, `VirtualService`, and `MetaRouter` (`internal/model/config.go:59-80`). `model.EnvoyFilterWrapper` is the output, holding `Name`, `Namespace`, and the `*networking.EnvoyFilter`; the `Name` is the unique key in Istio (`internal/model/config.go:50-56`).

## A path worth tracing

Take the MetaProtocol generator producing the `EnvoyFilter` that swaps the plain TCP proxy for a protocol-aware proxy.

`Generate` dispatches on whether a `Gateway` is set, otherwise calling `generateSidecarEnvoyFilters` (`internal/plugin/metaprotocol/generator.go:40-44`). For each MetaProtocol port, it builds outbound and inbound proxies and calls `GenerateReplaceNetworkFilter` (`internal/plugin/metaprotocol/generator.go:97-104`):

```go
envoyfilters = append(envoyfilters,
    envoyfilter.GenerateReplaceNetworkFilter(
        context.ServiceEntry,
        port,
        outboundProxy,
        inboundProxy,
        "envoy.filters.network.meta_protocol_proxy",
        "type.googleapis.com/aeraki.meta_protocol_proxy.v1alpha.MetaProtocolProxy")...)
```

`GenerateReplaceNetworkFilter` calls `generateNetworkFilter` with the `EnvoyFilter_Patch_REPLACE` operation (`internal/envoyfilter/network_filter.go:45-49`). The outbound patch targets the listener named `<address>_<port>` (`internal/envoyfilter/network_filter.go:94-95`) and applies to a `NETWORK_FILTER`, matching the filter chain whose filter name is `wellknown.TCPProxy` (`internal/envoyfilter/network_filter.go:96-104`). The patch operation replaces that TCP proxy with the MetaProtocol proxy.

The call chain:

```text
metaprotocol.Generate
  -> generateSidecarEnvoyFilters
    -> envoyfilter.GenerateReplaceNetworkFilter
      -> generateNetworkFilter (operation = REPLACE)
        -> generateOutboundListenerEnvoyFilters (match wellknown.TCPProxy on <addr>_<port>)
```

The other role is the RDS path. `xds.Server.Run` builds a go-control-plane server and registers it as a Route Discovery Service server (`internal/xds/server.go:75-76`):

```go
srv := serverv3.NewServer(context.Background(), s.cacheMgr.cache(), newCallbacks(s.cacheMgr))
routeservice.RegisterRouteDiscoveryServiceServer(grpcServer, srv)
```

`updateRouteCache` skips work when there is no subscriber (`internal/xds/cache_mgr.go:116-119`), lists `ServiceEntry` resources, calls `generateMetaRoutes` (`internal/xds/cache_mgr.go:123`), then sets the snapshot for every connected node (`internal/xds/cache_mgr.go:131-137`). `constructRoute` converts each `MetaRouter` route into a `metaroute.Route`, with the action built by `constructAction` (`internal/xds/cache_mgr.go:207-220`).

## Things that surprised me

The port name is the protocol signal. `GetLayer7ProtocolFromPortName` splits the name on `-` and parses the second segment (`internal/model/protocol/instance.go:113-119`), so a port named `tcp-metaprotocol-foo` is detected as MetaProtocol. This convention, not an annotation, is what drives generator selection.

The mTLS requirement on the RDS server is enforced in code, not just config. `initXdsServer` sets `ClientAuth: tls.RequireAndVerifyClientCert` with the Istio root CA pool (`internal/bootstrap/server.go:194-199`), so MetaProtocol proxies must present a valid client certificate to receive routes.

The reconcile is full-state, not incremental. `pushEnvoyFilters2APIServer` lists every existing Aeraki-managed `EnvoyFilter` and diffs the whole set on each push (`internal/envoyfilter/controller.go:135-178`), with debounce absorbing event bursts (`internal/envoyfilter/controller.go:116`). It trades per-push cost for a simpler convergence guarantee.

# Internals

> Read from the source at commit `8f970f0`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/contour/contour.go` | Process entry point and kingpin subcommand wiring (`cmd/contour/contour.go:30`). |
| `cmd/contour/serve.go` | The `serve` command: builds the DAG processor list, the caches, and the xDS server. |
| `internal/contour/handler.go` | `EventHandler`, the single-threaded event loop that debounces and triggers DAG rebuilds. |
| `internal/dag` | DAG model and processors that translate Kubernetes objects into the graph. |
| `internal/xdscache` (and `v3`) | Converts the DAG into Envoy xDS resources and caches them. |
| `internal/xds` (and `v3`) | gRPC server and node ID hasher that deliver resources to Envoy. |
| `internal/k8s` | Informers, status updater, clients. |
| `apis/projectcontour` | `HTTPProxy` and other CRD type definitions. |

## Core data structures

- `dag.DAG` (`internal/dag/dag.go:60`) holds `StatusCache`, `Listeners map[string]*Listener`, `ExtensionClusters`, and `HasDynamicListeners`. It is an immutable snapshot produced by one `Build`.
- `dag.Builder` plus `KubernetesCache` (`internal/dag/builder.go:44-55`): `Source` is the object supply, `Processors` is the ordered list of translators.
- The routing model: `dag.VirtualHost` and `dag.SecureVirtualHost` (around `internal/dag/dag.go:755`), `dag.Route` (`internal/dag/dag.go:307`), and the `MatchCondition` implementations for prefix, exact, regex, header, and query parameter matches (`internal/dag/dag.go:73-237`).
- `contour.EventHandler` (`internal/contour/handler.go:45-73`): the holdoff-batched single-threaded event loop, with `update` and `sequence` channels and a `syncTracker`.
- `xdscache_v3.SnapshotHandler` (`internal/xdscache/v3/snapshot.go:35-41`): `defaultCache` (a SnapshotCache), `edsCache` (a LinearCache), and `mux` (a MuxCache).

## A path worth tracing

Follow how endpoints diverge from everything else. `NewSnapshotHandler` builds two caches and a mux that classifies each discovery request by its type URL (`internal/xdscache/v3/snapshot.go:44-71`):

```go
defaultCache = envoy_cache_v3.NewSnapshotCache(false, &contour_xds_v3.Hash, ...)
// Envoy will open EDS stream per CDS entry.
// LinearCache mitigates the issue where all EDS streams are notified of any endpoint changes...
edsCache = envoy_cache_v3.NewLinearCache(envoy_resource_v3.EndpointType, ...)

mux = &envoy_cache_v3.MuxCache{
    Caches: map[string]envoy_cache_v3.Cache{},
    Classify: func(req *envoy_service_discovery_v3.DiscoveryRequest) string {
        return req.GetTypeUrl()
    },
    ...
}
```

When the DAG changes, `SnapshotHandler.OnChange` (`internal/xdscache/v3/snapshot.go:137-163`) builds a snapshot for every resource type except endpoints, which it explicitly skips because they use their own cache:

```go
for resourceType, resourceCache := range s.resources {
    // Endpoints use their own cache.
    if resourceType == envoy_resource_v3.EndpointType {
        continue
    }
    resources[resourceType] = asResources(resourceCache.Contents())
}
snapshot, err := envoy_cache_v3.NewSnapshot(version, resources)
...
s.defaultCache.SetSnapshot(context.Background(), contour_xds_v3.Hash.String(), snapshot)
```

The snapshot is stored under `contour_xds_v3.Hash.String()`, which is the single constant key shared by every Envoy.

## Things that surprised me

- **Routes are sorted as Contour types, not Envoy types.** `RouteCache.OnChange` calls `sortRoutes(routes)` on `dag.Route` values before converting to Envoy protos (`internal/xdscache/v3/route.go:90`). The comment at `internal/xdscache/v3/route.go:144-154` explains the reasoning: a single Contour match type may be implemented by different Envoy match types over time (for example a regex matcher used to implement another match), so sorting on Contour types keeps ordering from most to least specific regardless of the underlying Envoy implementation.
- **The node ID is a constant.** `ConstantHash.ID` ignores the node argument and returns the string `"contour"` (`internal/xds/v3/hash.go:21-30`). Every Envoy that connects shares one snapshot.
- **Initial DAG completion has two conditions.** The `syncTracker` (a `synctrack.SingleFileTracker`) marks the first DAG complete only when Kubernetes finished sending the initial object list and every item from that list has been handled in the event loop (`internal/contour/handler.go:63-72`, `internal/contour/handler.go:234-238`).

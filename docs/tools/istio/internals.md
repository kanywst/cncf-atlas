# Internals

> Read from the source at commit `58e9892`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `pilot/cmd/pilot-discovery` | istiod entry point (`main.go:27`) |
| `pilot/pkg/xds` | xDS server: debounce, push, generators |
| `pilot/pkg/model` | config model, push context, proxy types |
| `pkg/xds` | generic xDS server scaffolding (`server.go`) |
| `security` | CA, SPIFFE workload certificate issuance |
| `cni` | CNI plugin for traffic redirection |
| `istioctl` | CLI: install, analyze, proxy-config |
| `operator`, `manifests` | Helm charts and install profiles |

## Core data structures

`DiscoveryServer` (`pilot/pkg/xds/discovery.go:65`) is the xDS server. It holds `Generators` (a map from TypeUrl to resource generator), `pushChannel`, `pushQueue`, `adsClients` with a mutex, the xDS `Cache`, the model `Env`, a `concurrentPushLimit` semaphore, and `DebounceOptions`. It separates the debounce intake from the push output.

`PushContext` (`pilot/pkg/model/push_context.go:205`) is the immutable snapshot for one push. It indexes services, virtual services, destination rules, gateways, sidecars, authentication and authorization policies, telemetry, and mesh config. A config change rebuilds it whole.

`PushRequest` (`pilot/pkg/model/push_context.go:358`) is the unit of push. Its `ConfigsUpdated sets.Set[ConfigKey]` field drives the scope optimization: empty means push to all proxies, non-empty means only proxies that depend on those configs (`push_context.go:359-364`). It also carries `Push *PushContext`, `Reason`, `Delta`, and `Forced`. Debounce merges these.

`Proxy` (`pilot/pkg/model/context.go:312`) represents one connected Envoy. It carries `Type`, `IPAddresses`, `ID`, `Locality`, `ConfigNamespace`, `Labels`, `Metadata`, and `SidecarScope`, the set of config visible to that proxy.

`WatchedResource` (`pkg/xds/server.go:58`) is the per-TypeUrl subscription state: `ResourceNames`, `Wildcard`, `NonceSent` and `NonceAcked` for ACK sync, and `AlwaysRespond`, used to finish warming when a proxy reconnects to a different istiod (`pkg/xds/server.go:80-90`).

## A path worth tracing

`ConfigUpdate` does almost nothing on the calling goroutine. It clears the cache for Address kinds, then hands off to a channel (`pilot/pkg/xds/discovery.go:326-343`):

```go
func (s *DiscoveryServer) ConfigUpdate(req *model.PushRequest) {
    if model.HasConfigsOfKind(req.ConfigsUpdated, kind.Address) {
        s.Cache.ClearAll()
    }
    inboundConfigUpdates.Increment()
    s.InboundUpdates.Inc()
    s.pushChannel <- req
}
```

`handleUpdates` then routes the channel through `debounce`, with `s.Push` as the callback (`pilot/pkg/xds/discovery.go:351-352`):

```go
func (s *DiscoveryServer) handleUpdates(stopCh <-chan struct{}) {
    debounce(s.pushChannel, stopCh, s.DebounceOptions, s.Push, s.CommittedUpdates)
}
```

`Push` builds the new snapshot and fans out (`pilot/pkg/xds/discovery.go:288-307`):

```go
func (s *DiscoveryServer) Push(req *model.PushRequest) {
    oldPushContext := s.globalPushContext()
    versionLocal := s.NextVersion()
    push := s.initPushContext(req, oldPushContext, versionLocal)
    req.Push = push
    s.AdsPushAll(req)
}
```

From there `StartPush` enqueues every client (`pilot/pkg/xds/ads.go:580-592`), `pushConnection` checks `ProxyNeedsPush` and skips proxies whose scope is untouched (`pilot/pkg/xds/ads.go:484-489`), and `pushXds` looks up the generator and writes the response (`pilot/pkg/xds/xdsgen.go:112`).

## Things that surprised me

The whole config model is rebuilt on every change, not patched. `initPushContext` constructs a fresh `PushContext` and the old one is discarded (`pilot/pkg/xds/discovery.go:294-298`). That sounds expensive, and it is, which is exactly why the design puts a debounce window in front of it (`pilot/pkg/xds/discovery.go:355`) to fold bursts into one rebuild.

The expensive work is also kept off the request path. `ConfigUpdate` only increments counters and writes to a channel (`pilot/pkg/xds/discovery.go:341-342`); the comment above `handleUpdates` notes that debounce and push run on a separate thread precisely because `ConfigUpdate` may already hold other locks (`pilot/pkg/xds/discovery.go:345-348`).

Pushes are deliberately throttled. `StartPush` enqueues all clients at once (`pilot/pkg/xds/ads.go:580-592`), but a `concurrentPushLimit` semaphore caps how many proxies are actually written to concurrently, so a config change to a mesh with tens of thousands of proxies does not spike at once.

`AlwaysRespond` on `WatchedResource` (`pkg/xds/server.go:80-90`) is a quiet correctness fix: when Envoy reconnects to a different istiod instance, a request that would normally look like an ACK must still be answered so clusters and listeners finish warming. The comment warns it must be reset to false afterward or it loops forever.

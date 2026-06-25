# Internals

> Read from the source at commit `f01cbf5`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/yurthub/` | YurtHub entry point and startup wiring (`yurthub.go:27`, `app/start.go:94`) |
| `pkg/yurthub/proxy/` | Request interception, backend selection, local fallback (`proxy.go:149`) |
| `pkg/yurthub/proxy/remote/` | Cloud forwarding, response caching, error fallback (`loadbalancer.go`) |
| `pkg/yurthub/cachemanager/` | Decode and store responses, query cache (`cache_manager.go:112`) |
| `pkg/yurthub/storage/` | Cache key model and on-disk store (`key.go`, `disk/key.go`, `store.go`) |
| `pkg/yurthub/util/` | The tee read-closer used for non-blocking caching (`util.go:284`) |
| `pkg/yurtmanager/controller/` | Edge controllers: nodepool, yurtappset, hubleader, raven, and others |
| `pkg/apis/` | CRD types: `apps`, `iot`, `network`, `raven` |

## Core data structures

`KeyBuildInfo` (`pkg/yurthub/storage/key.go:25-32`) is the seed for every cache key. It carries `Component`, `Namespace`, `Name`, `Resources`, `Group`, and `Version`. The disk store turns it into a path in `diskStorage.KeyFunc` (`pkg/yurthub/storage/disk/key.go:47`). The layout, documented in the comment at `disk/key.go:42-44`, is `<Component>/<Resource.Version.Group>/<Namespace>/<Name>`, with shorter forms when the namespace or name is absent. Each cached object is a per-object file under a component directory. The `Store` interface that backs this is `pkg/yurthub/storage/store.go:31`, with `Create`, `Delete`, `Get`, `List`, `Update`, `KeyFunc`, and `ReplaceComponentList`.

`dualReadCloser` (`pkg/yurthub/util/util.go:295-336`) wraps an `io.ReadCloser` and an `io.PipeWriter`. Its `Read` (`util.go:306`) copies every byte it reads through to the pipe writer. This tee lets the cache write run without blocking the client response.

`NodePoolSpec` (`pkg/apis/apps/v1beta2/nodepool_types.go:42`) models a physical region. Its `Type` is `Edge` or `Cloud` (`nodepool_types.go:24-31`), and `HostNetwork` (`nodepool_types.go:47-51`) signals that CNI components such as flannel are not installed, so pods use the host network namespace.

`GatewaySpec` (`pkg/apis/raven/v1beta1/gateway_types.go:64`) configures a Raven layer-3 tunnel. It holds a list of `Endpoint`, each with a `NodeName` (`gateway_types.go:80-81`) and a `Subnets` pod IP range (`gateway_types.go:104-105`).

## A path worth tracing

Follow a get that succeeds against the cloud, so the response is cached on the way back to the client.

The forwarded response reaches `modifyResponse` (`pkg/yurthub/proxy/remote/loadbalancer.go:352`). For a cacheable 2xx it calls `cacheResponse` (`loadbalancer.go:431`). That function tees the body and hands one end to the cache manager:

```go
rc, prc := hubutil.NewDualReadCloser(req, resp.Body, true)
// ...
if err := lb.localCacheMgr.CacheResponse(req, wrapPrc, stopCh); err != nil && !errors.Is(err, io.EOF) &&
```

The client reads `rc`, the cache manager reads `prc` in a goroutine, and `CacheManager.CacheResponse` (`pkg/yurthub/cachemanager/cache_manager.go:112`) decodes the stream and writes each object to disk. On the offline path the same data comes back: `errorHandler` (`loadbalancer.go:333`) calls `localCacheMgr.QueryCache(req)` (`loadbalancer.go:343`) and writes the cached object straight to the client.

## Things that surprised me

The cache write never blocks the client. The body is teed through `dualReadCloser`, so the client stream and the disk write are independent and the cache write happens in a goroutine (`loadbalancer.go:433-438`). A slow disk does not slow the response.

A 404 list from the cloud is treated as a signal to prune. When the cloud returns 404 for a list, the error path deletes the local cache for that kind via `DeleteKindFor` (`loadbalancer.go:413-423`), so the cache does not keep serving objects whose CRD was removed.

Pool-scope resources change the consistency story. Because `services` and `endpointslices` are read through a per-pool leader hub rather than each node's own watch (`cmd/yurthub/app/options/options.go:126-129`, `proxy.go:171-189`), followers see this metadata through the leader rather than directly from the cloud apiserver.

# Internals

> Read from the source at commit `9f2dcfd9`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/daprd` | The sidecar binary; `main.go:21` calls `app.Run()` |
| `cmd/operator`, `cmd/injector`, `cmd/sentry`, `cmd/placement`, `cmd/scheduler` | Control-plane binaries |
| `pkg/runtime` | The sidecar core; `DaprRuntime` holds every subsystem (`runtime.go:102`) |
| `pkg/runtime/compstore` | The in-memory registry of loaded components (`compstore.go:42`) |
| `pkg/api/http`, `pkg/api/grpc`, `pkg/api/universal` | Public app-facing APIs (HTTP, gRPC, shared logic) |
| `pkg/messaging` | Service invocation and the internal gRPC proxy |
| `pkg/resiliency` | Retry, circuit-breaker, and timeout policy engine |
| `pkg/actors`, `pkg/runtime/wfengine` | Actor runtime and workflow engine |
| `pkg/security`, `pkg/sentry` | mTLS and SPIFFE-based identity |

## Core data structures

`DaprRuntime` (`pkg/runtime/runtime.go:102`) is the object that owns the sidecar's state. It carries the app `channels`, `directMessaging`, `actors`, `wfengine`, the `compStore`, `resiliency`, the security handler `sec`, and two gRPC servers: `grpcAPIServer` for the app-facing API and `grpcInternalServer` for sidecar-to-sidecar traffic (`pkg/runtime/runtime.go:139`).

`ComponentStore` (`pkg/runtime/compstore/compstore.go:42`) is the component registry. Under a single `sync.RWMutex` it keeps a `map[string]...` per component type: `states`, `pubSubs`, `secrets`, `inputBindings` and `outputBindings`, `locks`, `cryptoProviders`, `workflowComponents`, `conversations`, and more. The building-block list shows up directly as fields here. Hot reload swaps entries in this store.

`InvokeMethodRequest` (`pkg/messaging/v1/invoke_method_request.go:37`) is the internal representation of a service-invocation call. It embeds `replayableRequest` to handle body replay on retry, and carries a `streamingRequest` flag (`pkg/messaging/v1/invoke_method_request.go:48`) that disables buffering when the body cannot be replayed.

## A path worth tracing

The method-name normalizer sits on the service-invocation edge. `directMessaging.Invoke` calls it before resolving the destination (`pkg/messaging/direct_messaging.go:168`):

```go
normalized, normErr := method.NormalizeMethod(msg.GetMethod())
if normErr != nil {
    return nil, status.Errorf(codes.InvalidArgument, "invalid method: %v", normErr)
}
msg.Method = normalized
```

`NormalizeMethod` (`pkg/messaging/method/normalize.go:46`) rejects forbidden characters, then resolves traversal with `path.Clean`:

```go
if strings.ContainsAny(method, "#?\x00") {
    return "", fmt.Errorf("method contains forbidden character: %q", method)
}
// Reject control characters (0x01-0x1f and 0x7f DEL).
for i := range method {
    b := method[i]
    if b < 0x20 || b == 0x7f {
        return "", fmt.Errorf("method contains control character at position %d: %q", i, method)
    }
}
// Resolve path traversal sequences.
cleaned := path.Clean(method)
```

The normalized string is what reaches both the ACL check and the dispatch, so the two never disagree about what method is being called.

## Things that surprised me

Replay safety is decided per request, not globally. The HTTP handler inspects `r.ContentLength` and, when it is negative (chunked transfer or absent Content-Length), calls `req.SetStreamingRequest()` (`pkg/api/http/directmessaging.go:148`). The flag's comment is explicit that `WithReplay` becomes a no-op in that state to avoid buffering the entire body into memory (`pkg/messaging/v1/invoke_method_request.go:48`). The runtime trades retry-ability for memory safety based on the actual shape of each request.

The same handler then guards against retrying a drained body. When a streaming request hits a transport error, it wraps the error with `backoff.Permanent` so the resiliency policy will not retry with a consumed, empty body (`pkg/api/http/directmessaging.go:182`):

```go
if req.IsStreamingRequest() {
    return rResp, backoff.Permanent(invokeErr)
}
```

The remote send path defaults to streaming. `invokeRemote` builds the internal client and calls `invokeRemoteStream` rather than a unary RPC (`pkg/messaging/direct_messaging.go:311`), and increments `ServiceInvocationRequestSent` before the call and `ServiceInvocationResponseReceived` after. The receiving side has a matching `CallLocalStream` variant that uses an `io.Pipe` to forward large bodies in chunks (`pkg/api/grpc/daprinternal.go:85`).

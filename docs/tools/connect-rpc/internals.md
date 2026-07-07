# Internals

> Read from the source at commit `765b3c6`. Every claim here points at a file and line.

## Code map

The library is small: 23 non-test `.go` files, roughly 6,470 lines of core code. Skip the test files and the `cmd/` code generator; these are the paths the RPC turns on.

| Path | Responsibility |
| --- | --- |
| `src/client.go` | `Client[Req, Res]` and the unary/streaming call functions. |
| `src/handler.go` | `Handler`, `ServeHTTP`, and protocol selection per request. |
| `src/protocol.go`, `src/protocol_connect.go`, `src/protocol_grpc.go` | The `protocol` interface and its three implementations. |
| `src/codec.go` | The `Codec` interface plus the Protobuf binary and JSON codecs. |
| `src/envelope.go` | The 5-byte streaming/gRPC wire frame. |
| `src/connect.go` | Package types: `Spec`, `Request`, `Response`, `HTTPClient`, version constants. |
| `src/error.go`, `src/code.go` | The gRPC-compatible error and status-code system. |
| `src/idempotency_level.go` | Idempotency declarations that gate cacheable GET. |

## Core data structures

`Spec` (`src/connect.go:333`) describes one RPC: its `StreamType`, its `Schema` (a `protoreflect.MethodDescriptor` for Protobuf), its `Procedure` (for example `/acme.foo.v1.FooService/Bar`), an `IsClient` flag, and an `IdempotencyLevel`.

`Request[T any]` (`src/connect.go:165`) and `Response[T any]` (`src/connect.go:255`) are generic wrappers over a generated message. They expose `Msg *T` while holding the header, trailer, spec, and peer. The header is lazily initialized to avoid a wasted allocation (`src/connect.go:178-180`).

`envelope` (`src/envelope.go:45`) holds a `Data *bytes.Buffer`, a `Flags uint8`, and an `offset int64`. The 5-byte prefix is documented at `src/envelope.go:41-44`. The flag byte means different things under gRPC and under Connect, so the type leaves interpretation to the caller.

`Error` (`src/error.go:124`) carries a `Code`, a wrapped `err error`, `details`, a `meta http.Header`, and a `wireErr bool`. The `wireErr` flag distinguishes an error the server actually sent on the wire from one the client synthesized locally (`NewWireError` / `IsWireError`).

`Code` (`src/code.go:32`) is a `uint32` mapping one-to-one to gRPC status codes, from `CodeCanceled=1` (`src/code.go:43`) through `CodeUnauthenticated=16`.

## A path worth tracing

The most instructive non-obvious path is how a side-effect-free unary call becomes an HTTP GET, which is what makes an RPC cacheable.

A procedure declared `IdempotencyNoSideEffects` (`src/idempotency_level.go:43`) can travel as a GET instead of a POST when the client sets `WithHTTPGet`, which raises `EnableGet`. In `connectUnaryRequestMarshaler.Marshal` (`src/protocol_connect.go:985`), the `enableGet` case branches to `marshalWithGet` (`src/protocol_connect.go:997`), which marshals the message with a stable codec and builds a URL that carries it in query parameters via `buildGetURL` (`src/protocol_connect.go:1017`):

```text
if m.enableGet {
    return m.marshalWithGet(message)
}
```

If the URL exceeds `getURLMaxBytes`, the marshaler compresses to shrink it; if it still does not fit, it either falls back to POST (`getUseFallback`) or errors (`src/protocol_connect.go:1016-1044`). A stable marshal is required because a non-deterministic GET URL would scatter the cache key (`src/protocol_connect.go:987-992`). This puts RPC responses behind a CDN or browser cache, which gRPC cannot do because it does not ride HTTP semantics this way.

## Things that surprised me

The Connect protocol's own unary path does not use the 5-byte envelope at all. `connectUnaryMarshaler.Marshal` (`src/protocol_connect.go:927`) writes the body directly; the envelope is reserved for streaming and for gRPC. That is why a unary Connect call is reachable with a plain `curl` posting JSON (the README's `curl` example), and why unary errors are expressed as an HTTP status plus a JSON body instead of gRPC's trailer-based status propagation.

The cardinality check for unary responses reads a second message on purpose. `receiveUnaryMessage` reads one message, then reads again and treats anything other than EOF as a violation, returning `CodeUnimplemented` on both client and server per the gRPC spec (`src/connect.go:483-497`). The code even carries a `TODO` noting that the allocation for that second receive is not yet optimized away (`src/connect.go:485-487`).

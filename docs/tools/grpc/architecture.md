# Architecture

## Big picture

gRPC is built around a single C-core written in C++ (`src/core/`) with thin per-language wrappers stacked on top of it. The core owns the call, channel, transport, resolver, load-balancing, credentials, security (TSI), and xDS machinery. Each language wrapper (`src/cpp/`, `src/python/`, `src/ruby/`, `src/php/`, `src/csharp/`, `src/objective-c/`) exposes that core to its language, and `src/compiler/` is the `protoc` plugin that turns a `.proto` file into stubs for each of them.

```mermaid
flowchart TD
  proto[.proto service definition] -->|protoc + plugin| stubs[Generated client and server stubs]
  stubs --> wrapper[Language wrapper: src/cpp, src/python, ...]
  wrapper --> core[C-core: src/core]
  core --> call[Call layer: CallSpine, CallFilters]
  call --> transport[Transport: CHTTP2 / PH2 / InProc]
  transport --> net[HTTP/2 over the network]
```

## Components

### C-core (`src/core/`)

The RPC engine. It holds the call lifecycle (`src/core/call/`), the surface API entry points (`src/core/lib/surface/`), transports, name resolution, load balancing, credentials and TSI security, xDS integration (`src/core/xds/`), and channelz introspection. Every language binding ultimately drives this code.

### Language wrappers (`src/cpp/`, `src/python/`, and others)

Each wrapper presents idiomatic types in its language and forwards work to the core. The C++ entry points a user touches are `grpc::CreateChannel` plus a generated stub's `NewStub` on the client side, and `grpc::ServerBuilder` on the server side.

### Compiler plugin (`src/compiler/`)

A `protoc` plugin that reads a service definition and generates the typed stubs and skeletons. For example `service Greeter { rpc SayHello (HelloRequest) returns (HelloReply); }` in `examples/protos/helloworld.proto:24` becomes a `Greeter::Stub` and a `Greeter::Service`.

## How a request flows

Trace a unary client call in C++ using the Call V3 path:

1. The user calls the generated stub: `stub_->SayHello(&context, request, &reply)` (`examples/cpp/helloworld/greeter_client.cc:63`). The channel came from `grpc::CreateChannel(target_str, grpc::InsecureChannelCredentials())` (`examples/cpp/helloworld/greeter_client.cc:88`) and the stub from `Greeter::NewStub(channel)` (`examples/cpp/helloworld/greeter_client.cc:46`).
2. At the surface layer a batch of operations is queued and enters `ClientCall::StartBatch` (`src/core/call/client_call.cc:156`), which runs `ValidateClientBatch` (`src/core/call/client_call.cc:164`) and then `CommitBatch` (`src/core/call/client_call.cc:168`).
3. The first `send_initial_metadata` op drives `ClientCall::StartCall` (`src/core/call/client_call.cc:256`). It converts C metadata into the internal map via `CToMetadata` (`src/core/call/client_call.cc:262`) and builds the initiator/handler pair with `MakeCallPair` (`src/core/call/client_call.cc:274`).
4. A state machine, `StartCallMaybeUpdateState` (`src/core/call/client_call.cc:282`), CAS-transitions the call to started and then calls `call_destination_->StartCall(std::move(handler))` to hand the handler downstream (interception chain, filter stack, transport). Batches that arrived before the call started are parked on an `UnorderedStart` list and flushed on start (`src/core/call/client_call.cc:299`).
5. Message send and receive then run as promises on the call's spine via `SpawnGuarded` (`src/core/call/call_spine.h:198`), passing through the `CallFilters`.

The server side mirrors this: `ServerBuilder::AddListeningPort` (`examples/cpp/helloworld/greeter_server.cc:66`), `RegisterService` (`examples/cpp/helloworld/greeter_server.cc:69`), and `BuildAndStart` (`examples/cpp/helloworld/greeter_server.cc:71`).

## Key design decisions

The decision that defines this codebase is keeping two call-stack generations alive at once. The same ABI-stable public C API (`call.h`) sits over either the older callback-driven stack (Call V1) or the newer promise-based stack (Call V3), and the transport in use selects which one runs (`src/core/call/AGENTS.md:31`). The earlier choice to standardize on HTTP/2 (<https://grpc.io/about/>) is the other defining trade-off: it buys multiplexing and streaming at the cost of needing a proxy to reach browsers.

## Extension points

- The `protoc` plugin interface in `src/compiler/` for generating stubs in new or custom languages.
- Credentials and TSI security plug-ins in the core for custom transport security.
- xDS integration (`src/core/xds/`) so an external control plane such as Envoy can push load-balancing and routing configuration.
- Interceptors and the `CallFilters` chain for cross-cutting behavior on each call.

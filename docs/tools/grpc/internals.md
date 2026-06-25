# Internals

> Read from the source at commit `c697b01`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/core/call/` | The call lifecycle: `CallSpine`, `CallFilters`, client/server call wrappers, metadata. |
| `src/core/lib/surface/` | The public C API surface, including the Call V1 `FilterStackCall`. |
| `src/core/lib/promise/` | The promise library and `Party` scheduler that powers Call V3. |
| `src/core/lib/resource_quota/` | `Arena` allocation and resource accounting per call. |
| `src/compiler/` | The `protoc` plugin that generates stubs. |
| `src/cpp/`, `src/python/`, and other language dirs | Per-language wrappers over the core. |

## Core data structures

`CallSpine` is the center of one RPC: `class CallSpine final : public Party, public channelz::DataSource` (`src/core/call/call_spine.h:48`). It inherits `Party` so it can run promises serially, it holds the call's `CallFilters` directly in `call_filters_` (`src/core/call/call_spine.h:365`), and the client view (`CallInitiator`) and server view (`CallHandler`) share the same spine.

`CallFilters` carries the actual filter chain. The supporting `StackData` is, in the code's own words, "a complete representation of all the code that needs to be invoked to execute a call for a given set of filters" and "is held at the channel layer and is shared between many in-flight calls" (`src/core/call/call_filters.h:1077`). The per-op `Layout` struct (`src/core/call/call_filters.h:370`) records the promise size, alignment, and operator list for each operation kind.

`MetadataMap` is a typed metadata container (`src/core/call/metadata_batch.h:1420`). Known headers are carried as types via `Traits...`, and it composes a `StatefulCompressor` by template so a transport can delegate compression to the right algorithm (`src/core/call/metadata_batch.h:1426`). HPACK compression for HTTP/2 is handled at the type level rather than as runtime lookups.

`Arena` is the per-call bump allocator: `class Arena final : public RefCounted<...>` (`src/core/lib/resource_quota/arena.h:156`). Call-scoped objects are allocated with `New<T>()` (`src/core/lib/resource_quota/arena.h:193`) and freed together when the call ends, cutting the number of `malloc` calls per RPC.

`Party` is the cooperative scheduler behind Call V3. Participants spawned on a party are "guaranteed to be run serially" (`src/core/lib/promise/party.h:118`), the party sleeps when every participant sleeps (`src/core/lib/promise/party.h:102`), and a call is cancelled with `party_.reset()` (`src/core/lib/promise/party.h:115`).

## A path worth tracing

Follow how a client call actually starts. `ClientCall::StartCall` (`src/core/call/client_call.cc:256`) builds the initiator/handler pair with `MakeCallPair` (`src/core/call/client_call.cc:274`), then `StartCallMaybeUpdateState` (`src/core/call/client_call.cc:282`) does the work. It CAS-transitions the call state and, on the started transition, hands the handler downstream and drains any batches that arrived early:

```text
if (call_state_.compare_exchange_strong(cur_state, kStarted, ...)) {
  call_destination_->StartCall(std::move(handler));
  auto unordered_start = reinterpret_cast<UnorderedStart*>(cur_state);
  while (unordered_start != nullptr) {
    unordered_start->start_pending_batch();
    auto next = unordered_start->next;
    delete unordered_start;
    unordered_start = next;
  }
}
```

That loop lives at `src/core/call/client_call.cc:299`. The C-core API entry point that creates such a call is `MakeClientCall` (`src/core/call/client_call.cc:479`), which allocates the object from the arena and returns a `grpc_call*` via `->c_ptr()` (`src/core/call/client_call.cc:490`).

## Things that surprised me

The codebase runs two complete call stacks at once. Call V1 is `FilterStackCall` in `src/core/lib/surface/`, scheduled by a Combiner plus closures, created through `grpc_call_create`, and used by the CHTTP2 and legacy InProc transports. Call V3 is `ClientCall`/`ServerCall` plus `CallSpine`, scheduled by the promise library's `Party`, created through `MakeClientCall`/`MakeServerCall`, and used by the PH2, Chaotic Good, and InProc transports (`src/core/call/AGENTS.md:45`, `src/core/call/AGENTS.md:47`, `src/core/call/AGENTS.md:53`). The public API in `call.h` is shared between both. Which stack runs is decided by the transport, so a single binary can carry both implementations of a call at the same time. This dual-generation migration is the main reason the core is as large and intricate as it is.

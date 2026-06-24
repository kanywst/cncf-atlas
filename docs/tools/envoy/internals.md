# Internals

> Read from the source at commit `6a45c7d`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `source/exe/` | Process entry point and startup. `main.cc:16` defines `main()`. |
| `source/server/` | Server instance, listeners, worker management, lifecycle. |
| `source/common/http/` | HTTP Connection Manager, filter manager, codecs. |
| `source/common/thread_local/` | Thread-local slot machinery for lock-free config distribution. |
| `source/common/buffer/` | The I/O buffer abstraction used across the stack. |
| `source/extensions/` | Pluggable filters, codecs, transport sockets, access loggers. |
| `api/` | Protobuf definitions for the xDS configuration APIs (API v3). |

## Core data structures

`ConnectionManagerImpl` is the network read filter that speaks HTTP; one downstream connection maps to one instance (`source/common/http/conn_manager_impl.h`). Its nested `ActiveStream` (`source/common/http/conn_manager_impl.h:145`) holds all state for a single request/response: `request_headers_` (`:457`), the `DownstreamFilterManager filter_manager_` (`:473`), and the resolved `cached_route_` (`:512`). `ActiveStream` is a `LinkedObject`, so live streams form an intrusive list on the connection.

`FilterManager` (`source/common/http/filter_manager.h:692`) and its downstream subclass `DownstreamFilterManager` (`source/common/http/filter_manager.h:1192`) run the decoder/encoder filter chains, control iteration, and apply watermark backpressure.

`Buffer::OwnedImpl` (`source/common/buffer/buffer_impl.h:643`) is the I/O buffer. Internally it chains `Slice` objects (`source/common/buffer/buffer_impl.h:37`) in a `SliceDeque` (`source/common/buffer/buffer_impl.h:426`) so append and drain stay close to zero-copy.

`ThreadLocal::InstanceImpl` and its `SlotImpl` (`source/common/thread_local/thread_local_impl.h:20`, `:37`) distribute state across worker threads.

## A path worth tracing

Follow a downstream HTTP request from bytes on the wire to a resolved route, all in `source/common/http/conn_manager_impl.cc`.

`onData` is the network read filter entry point. It creates the codec lazily, then dispatches bytes into it:

```text
ConnectionManagerImpl::onData (:515)
  createCodec(data)            (:525)   // first call only
  codec_->dispatch(data)       (:546)   // parses frames, calls newStream
ConnectionManagerImpl::newStream (:410)
  make_unique<ActiveStream>    (:430)
  LinkedList::moveIntoList     (:469)   // track on streams_
ActiveStream::decodeHeaders   (:1354)
  request_headers_ = move(headers)      (:1366)
  refreshCachedRoute()                  (:1553) -> (:1811)
    snapped_route_config_->route(...)   (:1827)
  filter_manager_.createDownstreamFilterChain() (:1564)
  filter_manager_.decodeHeaders(...)    (:1600)
```

The codec return value is a `Status` that the manager inspects after `dispatch` to classify buffer flood, protocol error, and overload before continuing. Route resolution happens once and is cached in `cached_route_`, so later filters reuse the same decision.

## Things that surprised me

The thread-local model is built around an explicit hazard. A slot is destroyed immediately on the main thread and its index is recycled, so a callback must never capture the slot object directly; the index is captured by hand instead. The code says so at `source/common/thread_local/thread_local_impl.h:60-65`. To stop a callback posted just before destruction from dereferencing freed state, the slot holds a `std::shared_ptr<bool> still_alive_guard_` (`source/common/thread_local/thread_local_impl.h:69`) that workers weak-reference. This is the cost of choosing snapshot-swap over locks: concurrency is solved by single-thread ownership plus immutable snapshots, and the few remaining races are handled by hand.

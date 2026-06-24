# Architecture

## Big picture

The top-level `source/` tree splits into `common`, `server`, `exe`, and `extensions`. The core networking and HTTP stack lives in `common`; pluggable behaviour (filters, codecs, transport sockets) lives under `extensions/`; the configuration model is the protobuf API under `api/` (xDS, API v3). A running Envoy is one main thread plus a fixed pool of worker threads, each with its own event loop.

```mermaid
flowchart LR
    DC[Downstream client] --> L[Listener]
    L --> NF[Network filter chain]
    NF --> HCM[HTTP Connection Manager]
    HCM --> CODEC[HTTP codec]
    CODEC --> DFC[Decoder filter chain]
    DFC --> R[Router filter]
    R --> CL[Cluster + load balancer]
    CL --> US[Upstream host]
```

## Components

### Server and worker threads

The main thread owns configuration and lifecycle; a fixed number of worker threads each run a libevent dispatcher and handle connections non-blocking, without sharing locks between workers. Configuration updates are published as immutable snapshots posted into thread-local slots. The mechanism is `ThreadLocal::InstanceImpl` at `source/common/thread_local/thread_local_impl.h:20` and `SlotImpl::runOnAllThreads` at `source/common/thread_local/thread_local_impl.h:47`.

### Network and HTTP filter chains

Request processing is a chain of filters. L4 behaviour is implemented as network read/write filters. L7 HTTP is itself a network filter, the HTTP Connection Manager (HCM), which drives an HTTP codec and then runs an inner chain of HTTP decoder/encoder filters. The HCM implementation is `ConnectionManagerImpl` in `source/common/http/conn_manager_impl.h`.

### Configuration API (xDS)

The `api/` directory holds the protobuf definitions for the xDS APIs at API version `3.0.0` (`API_VERSION.txt`). A control plane streams listeners, routes, clusters, endpoints, and secrets to Envoy over these APIs. Service meshes use the HCM plus xDS as their data plane; in Istio, istiod configures each Envoy through xDS ([Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/)).

## How a request flows

A downstream HTTP request walks from the listener to a chosen route, all in `source/common/http/conn_manager_impl.cc`.

1. Data arrives at the network read filter entry point `ConnectionManagerImpl::onData` (`source/common/http/conn_manager_impl.cc:515`). If no codec exists yet it is created with `createCodec(data)` (`:525`).
2. The codec parses bytes with `codec_->dispatch(data)` (`:546`), calling `newStream` for each new HTTP stream.
3. `ConnectionManagerImpl::newStream` (`:410`) builds an `ActiveStream` (`:430`) and links it into `streams_` with `LinkedList::moveIntoList` (`:469`).
4. When headers complete, the codec calls `ActiveStream::decodeHeaders` (`:1354`). It takes ownership of `request_headers_` (`:1366`) and validates them.
5. The route is resolved by `refreshCachedRoute()` (`:1553`), whose body (`:1811`) calls `snapped_route_config_->route(...)` (`:1827`) and caches the result.
6. The downstream filter chain is built by `filter_manager_.createDownstreamFilterChain()` (`:1564`), then decoding starts with `filter_manager_.decodeHeaders(*request_headers_, end_stream)` (`:1600`). The terminal Router filter picks a cluster and forwards upstream.

## Key design decisions

The defining choice is the threading model: rather than guard shared state with locks, Envoy gives each worker single-threaded ownership and swaps configuration in as immutable snapshots through thread-local slots (`source/common/thread_local/thread_local_impl.h:20`). This keeps the hot path lock-free in the common case.

The second is the universal data plane API. Configuration is data (xDS protobufs in `api/`), so a proxy becomes a generic component a control plane drives. That is what lets meshes and gateways reuse the same proxy core ([Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/)).

## Extension points

Behaviour is added through extensions under `extensions/`: network filters, HTTP filters, transport sockets, access loggers, and codecs. Beyond compiled C++ extensions, Envoy supports request-time logic through WebAssembly (proxy-wasm) and Lua, and is reconfigured at runtime through the xDS APIs in `api/`.

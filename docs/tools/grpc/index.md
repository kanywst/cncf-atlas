# gRPC

> A high-performance RPC framework that turns a Protocol Buffers service definition into typed clients and servers running over HTTP/2.

- **Category**: Developer Tools
- **CNCF maturity**: Incubating
- **Language**: C++ (the C-core, with wrappers for Python, Ruby, PHP, C#, and Objective-C)
- **License**: Apache-2.0
- **Repository**: [grpc/grpc](https://github.com/grpc/grpc)
- **Documented at commit**: `c697b01` (2026-06-24, on the 1.83 development line)

## What it is

gRPC is a framework for calling methods on a remote server as if they were local functions. You declare a service in a `.proto` file, generate client stubs and server skeletons with the `protoc` compiler, and the framework handles serialization, transport, and the call lifecycle. The default serialization is Protocol Buffers and the transport is HTTP/2, which gives multiplexed streams, header compression, and bidirectional streaming on a single connection.

This repository, `grpc/grpc`, is the C-core implementation. A single core written in C++ (under `src/core/`) carries the RPC machinery, and thin language wrappers (`src/cpp/`, `src/python/`, `src/ruby/`, `src/php/`, `src/csharp/`, `src/objective-c/`) expose it to each language. The Go and Java implementations live in separate repositories (`grpc-go`, `grpc-java`) and do not share this core.

gRPC sits at the service-to-service layer of a system. It is the wire between microservices, between a control plane and its agents, or between a database and its clients. It is not a browser-facing API layer on its own, because HTTP/2 trailers and binary framing need a proxy or a variant such as gRPC-Web to reach a browser.

## When to use it

- Internal service-to-service communication where low latency and a typed contract matter more than human-readable payloads.
- Streaming workloads: server-streaming, client-streaming, or bidirectional streams over one connection.
- Polyglot systems that want one IDL and generated stubs across many languages.
- Environments already invested in Protocol Buffers and HTTP/2 (for example Kubernetes and Envoy deployments).

When it is the wrong tool:

- Public, browser-facing APIs where REST + JSON is easier to consume and debug. gRPC needs a proxy or gRPC-Web to reach browsers directly.
- Quick integrations where the cost of running `protoc` and managing generated code outweighs the typing benefits.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. grpc/grpc repository (source, README, LICENSE, BUILD, MAINTAINERS): <https://github.com/grpc/grpc>
2. About gRPC (Stubby origin, 2015 release, adopters): <https://grpc.io/about/>
3. gRPC project page on CNCF (Incubating, accepted 2017-02-16): <https://www.cncf.io/projects/grpc/>
4. GitHub REST API for grpc/grpc (stars, forks, created date): <https://api.github.com/repos/grpc/grpc>
5. Wikipedia: gRPC: <https://en.wikipedia.org/wiki/GRPC>

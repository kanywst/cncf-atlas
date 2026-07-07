# Connect RPC

> A Protocol Buffers RPC framework that generates typed clients and servers and runs on plain `net/http`, so one server speaks the Connect protocol, gRPC, and gRPC-Web at once.

- **Category**: Developer Tools
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [connectrpc/connect-go](https://github.com/connectrpc/connect-go)
- **Documented at commit**: `765b3c6` (2026-06-24, one commit past `v1.20.0`)

## What it is

Connect is a framework for calling methods on a remote server as if they were local functions. You declare a service in a `.proto` file, generate typed clients and servers, and the framework handles serialization, transport, and the call lifecycle. This repository, `connectrpc/connect-go`, is the canonical Go implementation, and its Go module path is `connectrpc.com/connect` (`src/go.mod:1`). The package documentation states the same purpose (`src/connect.go:15-25`).

What sets Connect apart is that it is built entirely on the Go standard library's `net/http`. It carries no bespoke HTTP stack, no name resolution, and no load-balancing API of its own: an `http.Server`, an `http.Client`, and an `http.Handler` are enough (`src/README.md`; the `HTTPClient` interface it needs has a single `Do` method, `src/connect.go:325-327`). Its only non-test dependencies are the standard library, `google.golang.org/protobuf`, and, for tests, `github.com/google/go-cmp` (`src/go.mod:10-13`).

The core capability is that one Connect server speaks three wire protocols at once: the Connect protocol, gRPC, and gRPC-Web. It picks per request from the HTTP method and the `Content-Type` header (`src/handler.go:384-410`). A gRPC client, a browser using gRPC-Web, and a plain `curl` posting JSON can all reach the same handler.

## When to use it

- Go services that want typed Protobuf RPC but prefer to stay on `net/http` with standard middleware, servers, and clients rather than adopt a separate networking stack.
- Systems that must serve gRPC clients and browser clients from the same endpoint, without running a proxy such as Envoy for gRPC-Web.
- APIs where you want side-effect-free calls to be cacheable by a CDN or browser over HTTP GET (see [Internals](./internals)).

When it is the wrong tool:

- Non-Go stacks where you would not use this repository directly. Connect has sibling implementations for other languages (see [Adoption & Ecosystem](./adoption)), but this deep-dive reads the Go code.
- Deployments that depend on gRPC's built-in client-side load balancing and name resolution. Connect leaves that to `net/http` and the surrounding infrastructure.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. connectrpc/connect-go repository (README, LICENSE, source at the pinned commit): <https://github.com/connectrpc/connect-go>
2. Connect: A better gRPC (Buf, 2022-06-01): <https://buf.build/blog/connect-a-better-grpc>
3. Connect documentation, Getting Started (Go): <https://connectrpc.com/docs/go/getting-started/>
4. Connect RPC project page on CNCF (Sandbox, accepted 2024-04-13): <https://www.cncf.io/projects/connect-rpc/>
5. Introducing Cacheable RPCs in Connect (Buf): <https://buf.build/blog/introducing-connect-cacheable-rpcs>
6. Connect RPC joins CNCF (Buf): <https://buf.build/blog/connect-rpc-joins-cncf>

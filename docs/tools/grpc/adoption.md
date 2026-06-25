# Adoption & Ecosystem

## Who uses it

The organizations below are the ones named with a citable source, the project's About page. gRPC does not ship an ADOPTERS file in this repository, so this list is deliberately limited to what is published.

| Organisation | Use case | Source |
| --- | --- | --- |
| Google | Builds on the same RPC lineage (Stubby) that gRPC came from, and uses gRPC. | <https://grpc.io/about/> |
| Square | Named adopter on the gRPC About page. | <https://grpc.io/about/> |
| Netflix | Named adopter on the gRPC About page. | <https://grpc.io/about/> |
| Cockroach Labs | Named adopter on the gRPC About page. | <https://grpc.io/about/> |
| Cisco | Named adopter on the gRPC About page. | <https://grpc.io/about/> |
| Juniper Networks | Named adopter on the gRPC About page. | <https://grpc.io/about/> |

## Adoption signals

From the GitHub REST API for `grpc/grpc`, observed 2026-06-24 (<https://api.github.com/repos/grpc/grpc>):

- Stars: 44,919
- Forks: 11,161
- Open issues: 1,359
- Contributors: 1,168 (counted with `contributors?anon=true` and `--paginate`)
- Primary language: C++
- Repository created: 2014-12-08

On governance, the `MAINTAINERS.md` roster is almost entirely Google employees, and the governance rules are kept in a separate `grpc/grpc-community` repository. Discussion has tied this strong single-vendor control to the project's continued Incubating status (<https://news.ycombinator.com/item?id=36698723>).

## Ecosystem

- Protocol Buffers as the default serialization and IDL, with the `protoc` gRPC plugin under `src/compiler/`.
- Sibling implementations in their own repositories: `grpc-go`, `grpc-java`, and `grpc-dotnet`. This repository is the C-core family (C++, Python, Ruby, PHP, C#, Objective-C).
- Browser and gateway tooling: gRPC-Web for browsers, grpc-gateway for REST translation, and Envoy, which uses xDS to push load-balancing configuration to gRPC clients.
- xDS support is implemented in this repository under `src/core/xds/`.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Apache Thrift | Same IDL-plus-RPC idea, but flexible about transport and serialization (TCP, HTTP, Kafka, and others). gRPC fixes the transport to HTTP/2 and gains multiplexing and streaming in return (<https://grpc.io/about/>). |
| ConnectRPC (Buf) | Uses the same Protocol Buffers IDL. Its own protocol is POST-only, works over HTTP/1.1, and is callable from a browser or `curl`, while staying gRPC and gRPC-Web compatible. It targets gRPC's reliance on HTTP/2 trailers and the proxy that browsers need (<https://buf.build/blog/connect-a-better-grpc>, <https://connectrpc.com/>). |
| REST + JSON (with OpenAPI) | Wins on interoperability and debuggability and is the default for public APIs, but loses on binary and HTTP/2 efficiency (<https://cloud.google.com/blog/products/api-management/understanding-grpc-openapi-and-rest-and-when-to-use-them>). |

For internal, low-latency service-to-service RPC in cloud-native systems, gRPC is the de facto standard, helped by its tight fit with Envoy and Kubernetes (<https://grpc.io/about/>).

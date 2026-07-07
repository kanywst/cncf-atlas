# Adoption & Ecosystem

## Who uses it

This deep-dive found no named adopter with a citable source. The `connect-go` repository ships no `ADOPTERS` file (a `ls ADOPTERS*` matches nothing), and the CNCF project page lists no adopters (<https://www.cncf.io/projects/connect-rpc/>). Rather than name organizations without a source, this page reports the measurable GitHub signals below.

One name that recurs in Connect's origin story is etcd, but as a cautionary tale about gRPC, not as a Connect adopter: Buf's launch post cited etcd as a project that could not keep up with `grpc-go`'s compatibility breaks for months (<https://buf.build/blog/connect-a-better-grpc>).

## Adoption signals

From the GitHub REST API, observed 2026-06-29 (<https://github.com/connectrpc/connect-go>):

- `connect-go`: 3,962 stars, 147 forks, 28 open issues, roughly 46 contributors (last page of `contributors?anon=true`).
- `connect-es` (TypeScript): 1,760 stars.
- `vanguard-go`: 405 stars.
- `connect-swift`: 151 stars; `connect-kotlin`: 137 stars.

The repository carries an OpenSSF Best Practices badge (project 8972, per the README).

## Ecosystem

Connect is one implementation of a multi-language protocol family under the `connectrpc` organization (<https://github.com/connectrpc>):

- Sibling implementations: `connect-es` (TypeScript/JavaScript), `connect-swift`, and `connect-kotlin`. Servers and clients across languages interoperate over the same three protocols.
- `vanguard-go`: a transcoder that lets a single Connect or gRPC server also accept REST, ingressing every protocol into one handler.
- Companion packages: `grpchealth` (gRPC-compatible health checks), `grpcreflect` (server reflection), `validate` (a Protovalidate interceptor), `authn-go` (authentication middleware), and `otelconnect` (OpenTelemetry traces and metrics).
- `awesome-connect`: a curated list of the surrounding ecosystem.
- Code generation runs through the `protoc-gen-connect-go` plugin driven by `buf` (`src/buf.gen.yaml`).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| gRPC (`grpc-go`) | The same Protobuf RPC idea, but with its own HTTP/2-based network stack, name resolution, and load balancing built in. Connect commits fully to `net/http` for a lighter, more debuggable footprint, and stays wire-compatible with gRPC so the two interoperate (<https://buf.build/blog/connect-a-better-grpc>). |
| Twirp (Twitch) | A close philosophy of Protobuf-over-HTTP, but POST-only, with no streaming and no gRPC wire compatibility. Connect adds streaming and gRPC compatibility. |
| gRPC-Web | Browser-facing gRPC that assumes a proxy such as Envoy in front. Connect is callable from a browser directly, with no proxy. |
| drpc (Storj) | A lightweight RPC framework with its own ecosystem and limited gRPC compatibility. Connect prioritizes gRPC wire compatibility. |

For Go services that want typed Protobuf RPC without leaving `net/http`, and that must also serve browsers and gRPC clients from one endpoint, Connect is the direct fit. Where a deployment leans on gRPC's built-in load balancing and resolver stack, `grpc-go` remains the closer match.

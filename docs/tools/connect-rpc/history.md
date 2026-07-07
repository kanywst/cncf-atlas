# History

## Origin

Connect came from Buf, the company behind the `buf` Protobuf tooling. On 2022-06-01 Buf announced it in a post titled "Connect: A better gRPC", publishing the Go implementation `connect-go` under Apache 2 first and promising a TypeScript implementation to follow (<https://buf.build/blog/connect-a-better-grpc>). The GitHub repository predates the announcement: it was created on 2021-08-02 (GitHub API `created_at`), so development ran for months before the public launch.

The problem it set out to solve was the weight of the existing Go gRPC implementation. Buf argued that `grpc-go` was maximalist and hard to debug, and that its backward compatibility was unstable: it did not follow semver and broke compatibility more than four times in a year, which left projects such as etcd unable to keep up (<https://buf.build/blog/connect-a-better-grpc>). Connect's answer was to build on the Go standard library's `net/http` and stay wire-compatible with gRPC so the two could interoperate rather than compete.

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | GitHub repository `connectrpc/connect-go` created (2021-08-02, per the GitHub API). |
| 2022 | Announced as "Connect: A better gRPC"; `connect-go` released under Apache 2 (<https://buf.build/blog/connect-a-better-grpc>). |
| 2023 | Connect protocol extended to support HTTP GET so side-effect-free RPCs become cacheable, available from `connect-go` 1.7.0 (<https://buf.build/blog/introducing-connect-cacheable-rpcs>). |
| 2024 | Accepted into the CNCF as a Sandbox project (2024-04-13, <https://www.cncf.io/projects/connect-rpc/>). |
| 2026 | Latest tag `v1.20.0` (2026-05-20); the documented HEAD is one commit past it, and the in-code `Version` constant reads `1.21.0-dev` (`src/connect.go:36`). |

## How it evolved

The API stabilized at v1.0.0, and the code still carries the handshake constants that record that history: it defines version gates up to `IsAtLeastVersion1_13_0` (`src/connect.go:40-45`). These let generated code check that it was built against a compatible library version.

The notable feature-level shift was cacheable RPCs in 2023. Connect extended its protocol so a unary call declared free of side effects could travel as an HTTP GET instead of a POST, which lets a CDN or browser cache the response (<https://buf.build/blog/introducing-connect-cacheable-rpcs>). The mechanism is read from source in [Internals](./internals).

## Where it stands now

Connect RPC is a CNCF Sandbox project, accepted on 2024-04-13 (<https://www.cncf.io/projects/connect-rpc/>). Buf sponsors the work but has stated that the project runs under an independent GitHub organization with independent governance, and that it does not share logos or names with Buf's commercial products (<https://buf.build/blog/connect-rpc-joins-cncf>, <https://www.cncf.io/projects/connect-rpc/>). Releases are tagged on the `connectrpc/connect-go` repository, with `v1.20.0` the latest at the documented commit. The dependency footprint stays deliberately small: the standard library plus `google.golang.org/protobuf`, with `go-cmp` only for tests (`src/go.mod:10-13`).

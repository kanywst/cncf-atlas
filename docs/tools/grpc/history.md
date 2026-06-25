# History

## Origin

gRPC began inside Google. For more than a decade Google ran a single general-purpose RPC infrastructure called Stubby to connect the services behind its products, as described on the project's About page: "Google has used a single general-purpose RPC infrastructure called Stubby ... for over a decade" (<https://grpc.io/about/>). Stubby was tied tightly to Google's internal infrastructure and depended on no public standards, so it could not be released as is.

The arrival of SPDY, HTTP/2, and QUIC gave Google a way to rebuild that infrastructure on open standards. In March 2015 Google decided to build the next version of Stubby and make it open source; the result was gRPC (<https://grpc.io/about/>). The first public release used Protocol Buffers for serialization and HTTP/2 for transport (<https://en.wikipedia.org/wiki/GRPC>).

## Timeline

| Year | Milestone |
| --- | --- |
| 2014 | GitHub repository `grpc/grpc` created (2014-12-08, per the GitHub API). |
| 2015 | gRPC announced and released as open source, built on Protocol Buffers and HTTP/2 (<https://grpc.io/about/>). |
| 2017 | Accepted into the CNCF as an Incubating project (2017-02-16, <https://www.cncf.io/projects/grpc/>). |
| 2026 | Active development on the 1.83 line; latest release `v1.81.1` (2026-06-08), with `v1.82.0-pre1` tagged. |

## How it evolved

The public design choice that shaped gRPC was building on HTTP/2 rather than a bespoke protocol. HTTP/2 multiplexing, header compression, and streaming map directly onto gRPC's four call types (unary, server-streaming, client-streaming, bidirectional), and they let gRPC ride existing proxies and load balancers (<https://grpc.io/about/>).

Internally the project has been migrating its call machinery. The repository now carries two generations of the call stack side by side: the older callback-driven implementation and a newer promise-based one, both behind the same public C API. This is documented in `src/core/call/AGENTS.md:31` and is the largest in-flight architectural shift in the codebase.

## Where it stands now

gRPC remains a CNCF Incubating project and has not graduated (<https://www.cncf.io/projects/grpc/>). Releases come on a roughly six-week cadence; the HEAD documented here sits on the 1.83 development line. The maintainer roster in `MAINTAINERS.md` is dominated by Google employees, and governance rules are kept in a separate `grpc/grpc-community` repository. Observers have linked the project's strong single-vendor control to its long stay at Incubating status (<https://news.ycombinator.com/item?id=36698723>).

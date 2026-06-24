# Getting Started

> Verified against go-spiffe v2.8.1. Commands assume Go 1.24+ and a running SPIFFE Workload API endpoint (SPIRE Agent).

## Prerequisites

- Go 1.24 or newer (`go.mod` declares `go 1.24.0`).
- A running [SPIRE](https://spiffe.io/spire/) deployment or another SPIFFE Workload API implementation, with a registration entry for your workload.
- The `SPIFFE_ENDPOINT_SOCKET` environment variable set to the Workload API address, for example `unix:///tmp/agent.sock`.

## Install

```bash
go get github.com/spiffe/go-spiffe/v2
```

## A first working setup

The shortest path to mTLS is the `spiffetls` helpers. They build an `X509Source` from the Workload API for you, present an SVID, and verify the peer.

1. Point the library at the Workload API socket.

```bash
export SPIFFE_ENDPOINT_SOCKET=unix:///tmp/agent.sock
```

1. Start an mTLS server that accepts any SPIFFE peer.

```go
package main

import (
    "context"
    "log"

    "github.com/spiffe/go-spiffe/v2/spiffetls"
    "github.com/spiffe/go-spiffe/v2/spiffetls/tlsconfig"
)

func main() {
    ctx := context.Background()
    listener, err := spiffetls.Listen(ctx, "tcp", "127.0.0.1:8443", tlsconfig.AuthorizeAny())
    if err != nil {
        log.Fatal(err)
    }
    defer listener.Close()
    log.Println("listening with a SPIFFE identity")
}
```

1. Dial it from a client.

```go
conn, err := spiffetls.Dial(ctx, "tcp", "127.0.0.1:8443", tlsconfig.AuthorizeAny())
```

Both sides fetch X509-SVIDs and X.509 bundles from the Workload API, present them, and keep them refreshed as the agent rotates them ([README.md:36-42](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/README.md#L36-L42)).

## Verify it works

The connection succeeds only if both peers obtained an SVID and verified the other against the trust bundle. To pin identity instead of accepting any peer, swap `tlsconfig.AuthorizeAny()` for `tlsconfig.AuthorizeID(spiffeid.RequireFromString("spiffe://example.org/client"))`, which is what the bundled server example does ([examples/spiffe-tls/server/main.go:35-39](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/examples/spiffe-tls/server/main.go#L35-L39)). A mismatched peer ID fails the handshake.

## Where to go next

The [examples directory](https://github.com/spiffe/go-spiffe/tree/v2.8.1/examples) covers gRPC credentials, JWT-SVIDs, and federation. For production concerns such as attestation policy, trust domain federation, and SVID rotation tuning, see the [SPIFFE standards](https://github.com/spiffe/spiffe/tree/main/standards) and the [go-spiffe package reference](https://pkg.go.dev/github.com/spiffe/go-spiffe/v2).

# Internals

> Read from the source at commit `e9973f6`. Every claim here should point at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `spiffeid/` | SPIFFE ID and TrustDomain types, parsing, matching. |
| `svid/x509svid/` | X509-SVID type, parsing, and peer verification. |
| `svid/jwtsvid/` | JWT-SVID type and validation. |
| `bundle/` | Trust bundles for X.509, JWT, and combined SPIFFE bundles. |
| `workloadapi/` | Workload API client and the X509/JWT/Bundle sources. |
| `spiffetls/` | mTLS `Listen`/`Dial` helpers and `tls.Config` construction. |
| `proto/spiffe/workload/` | Generated gRPC stubs for the Workload API. |

## Core data structures

`spiffeid.ID` holds two fields: the canonical string `id` and an integer `pathidx` ([spiffeid/id.go:95-101](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/spiffeid/id.go#L95-L101)). The trust domain and path are substring slices: `TrustDomain()` returns `id[schemePrefixLen:pathidx]` and `Path()` returns `id[pathidx:]` ([spiffeid/id.go:104-119](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/spiffeid/id.go#L104-L119)).

`x509svid.SVID` carries the `ID`, the certificate chain with the leaf first, the `PrivateKey`, and an optional `Hint` ([svid/x509svid/svid.go:20-36](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/svid.go#L20-L36)). The `workloadapi.X509Context` pairs `SVIDs` with their `Bundles`, mirroring the single Workload API response that carries both (`workloadapi/x509context.go`).

`workloadapi.Client` holds the gRPC connection, the generated `SpiffeWorkloadAPIClient`, and its config ([workloadapi/client.go:29-33](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/workloadapi/client.go#L29-L33)).

## A path worth tracing

Follow an X509-SVID from the wire into the application. `watchX509Context` opens the stream and loops on receive ([workloadapi/client.go:547-571](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/workloadapi/client.go#L547-L571)):

```go
stream, err := c.wlClient.FetchX509SVID(ctx, &workload.X509SVIDRequest{})
if err != nil {
    return err
}

for {
    resp, err := stream.Recv()
    if err != nil {
        return err
    }
    backoff.Reset()
    x509Context, err := parseX509Context(resp)
    ...
    watcher.OnX509ContextUpdate(x509Context)
}
```

Each response is decoded by `parseX509Context` ([workloadapi/client.go:673](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/workloadapi/client.go#L673)), which calls `parseX509SVIDs` and turns the raw bytes into an SVID with `x509svid.ParseRaw` ([svid/x509svid/svid.go:75](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/svid.go#L75)), which expects DER certificates and a PKCS#8 key. The watcher then calls `OnX509ContextUpdate` ([workloadapi/watcher.go:187](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/workloadapi/watcher.go#L187)), which swaps the SVID and bundles into the `X509Source`.

On the receiving side, `x509svid.Verify` ([svid/x509svid/verify.go:30](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/verify.go#L30)) extracts the SPIFFE ID from the leaf, rejects a leaf that is a CA or carries `KeyCertSign`/`CRLSign` ([svid/x509svid/verify.go:49-56](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/verify.go#L49-L56)), looks up the trust domain's bundle ([svid/x509svid/verify.go:58](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/verify.go#L58)), and runs the standard library `leaf.Verify` with `ExtKeyUsageAny` ([svid/x509svid/verify.go:63-68](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/svid/x509svid/verify.go#L63-L68)). Authorization keys off the URI SAN and the trust anchors, so DNS SANs play no part.

## Things that surprised me

`spiffeid.ID` is not two strings. By keeping one canonical string plus a `pathidx`, the type is comparable with `==`, usable as a map key, and allocation-free for `String()`, `TrustDomain()`, and `Path()`. The cost is paid once at parse time: `FromString` hand-walks the bytes to validate trust-domain characters rather than leaning entirely on `net/url` ([spiffeid/id.go:51-82](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/spiffeid/id.go#L51-L82)). SPIFFE IDs are created and compared on every mTLS handshake, so the lightweight, comparable representation is a performance choice.

When the Workload API returns more than one SVID with the same `hint`, the first one wins and later duplicates are skipped, matching the spec's guidance that the first message should be selected ([workloadapi/client.go:708](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/workloadapi/client.go#L708)).

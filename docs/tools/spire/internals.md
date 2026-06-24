# Internals

> Read from the source at commit `73215a39`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/spire-server/main.go` | Server entry point; delegates to the CLI |
| `cmd/spire-agent/main.go` | Agent entry point; delegates to the CLI |
| `pkg/server/ca/ca.go` | Server CA: signs workload and agent SVIDs |
| `pkg/agent/endpoints/workload/handler.go` | Workload API gRPC handlers (`FetchX509SVID` and others) |
| `pkg/agent/attestor/workload/workload.go` | Runs workload attestor plugins to derive selectors from a PID |
| `pkg/agent/manager/manager.go` | Agent manager: cache subscription and SVID lifecycle |
| `pkg/agent/manager/cache/workload.go` | Cache types: `Identity`, `WorkloadUpdate`, `X509SVID` |
| `pkg/agent/svid/rotator.go` | Renews the agent SVID by sending a CSR to the server |
| `pkg/common/peertracker/` | Reads UDS peer credentials from the kernel (per OS) |
| `pkg/common/catalog/` | Plugin catalog shared by built-in and external plugins |
| `proto/spire/common/common.pb.go` | Generated protobuf types: `Selector`, `RegistrationEntry` |

## Core data structures

- `common.Selector` (`proto/spire/common/common.pb.go:118`): a `Type` and `Value` pair, the unit of attestation (for example `unix:uid:1000` or `k8s:ns:default`).
- `common.RegistrationEntry` (`proto/spire/common/common.pb.go:339`): the center of SPIRE's policy. It carries `Selectors`, `ParentId`, `SpiffeId`, `FederatesWith`, `EntryId`, `Admin`, `Downstream`, `DnsNames`, `RevisionNumber`, `StoreSvid`, `JwtSvidTtl`, and `Hint`. It declares that under a given parent (a node or intermediate), a workload matching this selector set should be issued this SPIFFE ID.
- `cache.Identity` (`pkg/agent/manager/cache/workload.go:15`): one issued identity, holding `Entry *common.RegistrationEntry`, `SVID []*x509.Certificate`, and `PrivateKey crypto.Signer`.
- `cache.WorkloadUpdate` (`pkg/agent/manager/cache/workload.go:29`): the snapshot handed to a subscriber, with `Identities`, `Bundle`, and `FederatedBundles`.
- `cache.X509SVID` (`pkg/agent/manager/cache/workload.go:40`): a `Chain []*x509.Certificate` and a `PrivateKey crypto.Signer`.

## A path worth tracing

The Workload API `FetchX509SVID` handler at `pkg/agent/endpoints/workload/handler.go:251` is a streaming RPC. Its request body is empty and carries no credential:

```go
func (h *Handler) FetchX509SVID(_ *workload.X509SVIDRequest, stream workload.SpiffeWorkloadAPI_FetchX509SVIDServer) error {
    ctx := stream.Context()
    start := time.Now()
    log := rpccontext.Logger(ctx)

    selectors, err := h.c.Attestor.Attest(ctx)
```

The identity comes entirely from attestation. `Attest` walks the workload attestor plugins, each in its own goroutine, and merges their selectors (`pkg/agent/attestor/workload/workload.go:55-87`):

```go
plugins := wla.c.Catalog.GetWorkloadAttestors()
sChan := make(chan []*common.Selector)
errChan := make(chan error)

for _, p := range plugins {
    go func() {
        if selectors, err := wla.invokeAttestor(ctx, p, pid); err == nil {
            sChan <- selectors
        } else {
            errChan <- err
        }
    }()
}
```

After rate limiting (`handler.go:262`), the handler subscribes to the cache and enters a loop that pushes updates to the open stream (`handler.go:273-283`):

```go
for {
    select {
    case update := <-subscriber.Updates():
        update.Identities = filterIdentities(update.Identities, log)
        if err := h.sendX509SVIDResponse(update, stream, selectors, log, start); err != nil {
            return err
        }
    case <-ctx.Done():
        return nil
    }
}
```

Signing happens off this path. The server CA at `pkg/server/ca/ca.go:335` builds a template from the caller's public key, signs it, and validates the SPIFFE ID (`ca.go:341-358`):

```go
template, err := ca.c.CredBuilder.BuildWorkloadX509SVIDTemplate(ctx, credtemplate.WorkloadX509SVIDParams{
    ParentChain: caChain,
    PublicKey:   params.PublicKey,
    SPIFFEID:    params.SPIFFEID,
    DNSNames:    params.DNSNames,
    TTL:         params.TTL,
    Subject:     params.Subject,
})
```

## Things that surprised me

- **The PID is read from the socket, not sent by the caller.** On Linux the agent calls `unix.GetsockoptUcred(fd, SOL_SOCKET, SO_PEERCRED)` (`pkg/common/peertracker/uds_linux.go:10`) and reads `ucred.Pid/Uid/Gid`. On macOS and BSD it uses `LOCAL_PEERPID` (`pkg/common/peertracker/uds_bsd.go:13`). A workload cannot lie about who it is because it never asserts an identity.
- **Attestation fails only if every plugin fails.** `Attest` returns an error only when `len(errs) == len(plugins)` (`pkg/agent/attestor/workload/workload.go:89-91`). Partial selector contributions are merged.
- **The server CA only ever sees a public key.** `SignWorkloadX509SVID` passes `params.PublicKey` into the template (`pkg/server/ca/ca.go:347`) and never receives a private key. The signing path validates the resulting SVID's SPIFFE ID before returning (`ca.go:358`).
- **Fetch is served from cache, not from the server.** `SubscribeToCacheChanges` maps straight to `m.cache.SubscribeToWorkloadUpdates` (`pkg/agent/manager/manager.go:258`); the agent has rotated the SVID ahead of time, so the hot path has no server round trip.

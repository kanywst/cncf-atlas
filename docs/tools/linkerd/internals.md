# Internals

> Read from the source at commit `7977d50`. Every claim here points at a file and line.

## Code map

These are the directories that carry the control-plane logic. Generated protobuf and vendored code are skipped.

| Path | Responsibility |
| --- | --- |
| `cli/` | The `linkerd` CLI; entry point `cli/main.go` builds the root cobra command and calls `Execute` |
| `controller/cmd/` | Single control-plane binary that dispatches on `os.Args[1]` |
| `controller/webhook/` | Shared admission webhook server (TLS, request decode, handler dispatch) |
| `controller/proxy-injector/` | The mutating webhook handler that injects the sidecar |
| `controller/api/destination/` | gRPC discovery server (`Get`, `GetProfile`) |
| `pkg/identity/` | mTLS certificate authority that signs proxy CSRs |
| `pkg/inject/` | Builds the injection report and the JSON patch from Helm values |
| `policy-controller/` | Rust service that resolves authorization CRDs for proxies |

## Core data structures

The injection path turns on a few types in `pkg/inject`.

- `ResourceConfig` (`pkg/inject/inject.go:120`) is the center of injection. It holds the Helm `values`, the namespace and its annotations, the target workload (object, meta, owner ref), and the pod (meta, labels, annotations, spec).
- `podPatch` (`pkg/inject/inject.go:156`) embeds `l5dcharts.Values` and adds `PathPrefix` plus `AddRoot` flags. It is the render input for the patch chart.
- `Report` (`pkg/inject/report.go:57`) is the injection report; `Injectable()` returns a bool plus the reasons it cannot inject (`pkg/inject/report.go:138`).
- The identity CA is the `Service` type (`pkg/identity/service.go`), holding a `validator`, an `*tls.Issuer`, and an `issuerMutex` (`*sync.RWMutex`) so the issuer cert can be hot-reloaded from disk while requests run.

## A path worth tracing

Trace the mTLS bootstrap in the identity service. When a proxy starts it sends its ServiceAccount token and a CSR to `Certify` (`pkg/identity/service.go:212`). The server validates in three steps before signing:

```text
Certify(req)
  checkCSR(csr, reqIdentity)            // service.go:234  CSR shape is valid
  svc.validator.Validate(ctx, tok)      // service.go:241  TokenReview against Kubernetes
  if reqIdentity != tokIdentity { ... } // service.go:260  identity must match the token
  issuer.IssueEndEntityCrt(csr)         // service.go:269  sign short-lived leaf cert
```

If the requested identity does not equal the identity proven by the token, the call returns `codes.FailedPrecondition` and no certificate is issued (`pkg/identity/service.go:260-265`). Only after all three checks pass does the server take the issuer under the mutex and call `issuer.IssueEndEntityCrt(csr)` to mint the leaf certificate that lets the sidecar speak mTLS (`pkg/identity/service.go:268-269`).

## Things that surprised me

The proxy injector does not hand-build its JSON patch. `GetPodPatch` marshals the `podPatch` to YAML, then loads the `patch` Helm chart (`templates/patch.json`) from an embedded filesystem and renders it (`pkg/inject/inject.go:809-828`). Install-time templating and runtime sidecar injection share one template path and one `Values` type. The price is visible right after: the rendered JSON can carry an invalid trailing comma, so the code strips it with a regex, `rTrail`, replacing `},]` with `}\n]` before returning the patch (`pkg/inject/inject.go:40`, `inject.go:834`). Making a template engine emit a JSON Patch leaves that rough edge.

The webhook server also caps the request body at 10MB via `util.ReadAllLimit(req.Body, 10*util.MB)` (`controller/webhook/server.go:129`), and an empty body is logged and dropped rather than treated as an error (`controller/webhook/server.go:136-139`).

## Sources

- Source 5: [linkerd/linkerd2 (control plane and CLI)](https://github.com/linkerd/linkerd2)
- Source 6: [linkerd/linkerd2-proxy (Rust data plane)](https://github.com/linkerd/linkerd2-proxy)

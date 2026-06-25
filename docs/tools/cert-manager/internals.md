# Internals

> Read from the source at commit `dbc027ee`. Every claim here points at a file and line.

## Code map

The repository is multi-module. The root module is `github.com/cert-manager/cert-manager` (`go.mod:1`, `go 1.26.0` at `go.mod:3`), and several binaries under `cmd/*` carry their own `go.mod`. The controller binary even reaches its real implementation through a separate `controller-binary/app` module (`cmd/controller/main.go:26`).

| Path | Responsibility |
| --- | --- |
| `pkg/apis/` | API type definitions: certmanager, acme, config, meta, experimental. `zz_generated.deepcopy.go` is generated |
| `pkg/controller/` | All reconcilers. `register.go` does plugin registration; `context.go` bundles shared dependencies |
| `pkg/controller/certificates/` | The micro-controllers: trigger, keymanager, requestmanager, issuing, readiness, revisionmanager |
| `pkg/controller/certificaterequests/` | Issuer-specific signers: acme, ca, selfsigned, vault, venafi, plus approver and checks |
| `pkg/controller/acmeorders`, `pkg/controller/acmechallenges` | ACME Order and Challenge reconcilers |
| `pkg/issuer/`, `pkg/acme/` | Issuer abstraction and the ACME client wrapper |
| `pkg/controller/cainjector/` | CA bundle injection reconciler (supporting code under `internal/cainjector`) |
| `cmd/` | Binary entry points, each an independent module |

## Core data structures

A handful of types carry the whole system:

- `CertificateSpec` (`pkg/apis/certmanager/v1/types_certificate.go:133`) and `CertificateStatus` (`:646`). The status holds conditions, revision, renewalTime, and `nextPrivateKeySecretName`, which is the coordination surface the micro-controllers read and write.
- `CertificateRequestSpec` (`pkg/apis/certmanager/v1/types_certificaterequest.go:111`). It carries the CSR (Certificate Signing Request) PEM in `Request`, plus `IssuerRef`, `Duration`, and `IsCA`. It is the issuer-neutral intermediate representation of one issuance.
- `IssuerSpec` (`pkg/apis/certmanager/v1/types_issuer.go:100`) wrapping `IssuerConfig` (`:106`), a union of `ACME`, `CA`, `Vault`, `SelfSigned`, and `Venafi`.
- `Order` (`pkg/apis/acme/v1/types_order.go:39`, spec at `:58`) and `Challenge` (`pkg/apis/acme/v1/types_challenge.go:39`, spec at `:58`). These persist ACME protocol state as CRDs.

## A path worth tracing

Follow how a CertificateRequest becomes a CSR and gets created. In `requestmanager_controller.go`, `ProcessItem` (`:140`) only proceeds when the `Issuing` condition is set (`:156`), decodes the private key from the next-private-key Secret (`:180`), and falls through to `createNewCertificateRequest` (`:236`). That function builds the CSR from the key (`:381`) and PEM-encodes it (`:387`) before the API create (`:435`).

```text
ProcessItem (requestmanager_controller.go:140)
  -> CertificateHasCondition Issuing (:156)
  -> DecodePrivateKeyBytes (:180)
  -> createNewCertificateRequest (:236 -> :367)
       -> pki.EncodeCSR (:381)
       -> pem.Encode CERTIFICATE REQUEST (:387)
       -> CertmanagerV1().CertificateRequests().Create (:435)
```

## Things that surprised me

State is spread across resources on purpose. No single controller owns issuance; trigger flips `Issuing=True` and stops, then keymanager, requestmanager, the signer, and issuing each pick up the next step from status conditions and naming conventions. It reads cleanly per controller but the full lifecycle is only visible by reading several of them together.

The deterministic naming has a documented sharp edge. Under the `StableCertificateRequestName` feature gate, the CertificateRequest name is derived from a cryptographic hash of the certificate name to stay within the 253-character limit (`requestmanager_controller.go:417`-`:432`). The ACME signer carries a TODO that the hash does not account for the request's public key, so two requests could collide on a name (`acme.go:186`-).

ACME failures are sorted by cause. A failed Order create is treated as network-related, so it backs off and retries (`acme.go:158`-`:160`), while a CSR that cannot be decoded or a CommonName missing from the SANs (Subject Alternative Names) calls `reporter.Failed` and returns without retry (`acme.go:122`-`:142`). The split keeps transient outages from becoming permanent failures and keeps user errors from looping forever.

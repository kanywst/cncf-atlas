# Internals

> Read from the source at commit `51ff5ec`. Every claim here should point at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/notation/main.go` | cobra root, subcommand registration, credential cleanup (`cmd/notation/main.go:30`) |
| `cmd/notation/sign.go` | `sign` command, flag set, end-to-end sign flow (`cmd/notation/sign.go:60`) |
| `cmd/notation/verify.go` | `verify` command and verification flow (`cmd/notation/verify.go:43`) |
| `cmd/notation/registry.go` | repository resolution, ORAS client, auth (`cmd/notation/registry.go:44`) |
| `internal/envelope/` | signature payload type and JWS / COSE media-type mapping (`internal/envelope/envelope.go:42`) |
| `internal/version/` | version string baked into the binary (`internal/version/version.go:18`) |

## Core data structures

- `signOpts` (`cmd/notation/sign.go:45`) aggregates every sign flag: `expiry`, `tsaServerURL`, `forceReferrersTag`, `ociLayout`, `inputType`, plus embedded `flag.SignerFlagOpts` and `flag.SecureFlagOpts`.
- `envelope.Payload` (`internal/envelope/envelope.go:37`) has a single field, `TargetArtifact ocispec.Descriptor`. This descriptor of the target artifact is the content that actually gets signed.
- `MediaTypePayloadV1` (`internal/envelope/envelope.go:33`) is `application/vnd.cncf.notary.payload.v1+json`. On verify, `ValidatePayloadContentType` (`internal/envelope/envelope.go:53`) accepts only this content type.
- `inputType` (`cmd/notation/registry.go:35-40`) distinguishes `inputTypeRegistry` (default) from `inputTypeOCILayout` (Experimental).
- `notation.SignOptions` and `notation.VerifyOptions` (assembled at `cmd/notation/sign.go:206` and `cmd/notation/verify.go:141`, defined in `notation-go`) are the DTOs at the CLI/library boundary.

## A path worth tracing

The sign payload is the OCI descriptor of the artifact, and it is always pinned to a digest before signing. In `runSign`, the tag is resolved and a mutability warning is printed for tag references, then the descriptor digest is stored as the artifact reference:

```go
manifestDesc, resolvedRef, err := resolveReference(ctx, cmdOpts.inputType, cmdOpts.reference, sigRepo, func(ref string, manifestDesc ocispec.Descriptor) {
    fmt.Fprintf(os.Stderr, "Warning: Always sign the artifact using digest(@sha256:...) rather than a tag(:%s) ...", ref)
})
if err != nil {
    return err
}
signOpts.ArtifactReference = manifestDesc.Digest.String()
```

That is `cmd/notation/sign.go:166-172`. The signed payload type itself is just the descriptor:

```go
type Payload struct {
    TargetArtifact ocispec.Descriptor `json:"targetArtifact"`
}
```

That is `internal/envelope/envelope.go:37-39`. The core call `notation.SignOCI` (`cmd/notation/sign.go:175`) then pushes the signature as an OCI Referrer.

## Things that surprised me

- Registry credentials read from environment variables are immediately unset. The root command's `PersistentPreRun` calls `os.Unsetenv` on the username and password env vars right after reading them, to avoid leaking them to child processes (`cmd/notation/main.go:35-39`).
- The Referrers strategy is a runtime fallback, not a fixed choice. When `forceReferrersTag` is false, `notation` first attempts the Referrers API and falls back to the Referrers tag schema if the registry does not support it; the two are mutually exclusive flags on sign (`cmd/notation/registry.go:59-93`, `cmd/notation/sign.go:143`).
- Verify always passes `forceReferrersTag` as false, so verification, list, and inspect never force the tag schema and always try the API first (`cmd/notation/verify.go:130`).
- A failed cleanup of the outdated Referrers index is non-fatal: it only emits a garbage-collection warning rather than failing the sign (`cmd/notation/sign.go:177-183`).
- OCI layout input is Experimental and gated. The `--oci-layout` flag is hidden behind an experimental check and switches `inputType` only in `PreRunE` (`cmd/notation/sign.go:113-117`, `cmd/notation/sign.go:145`).

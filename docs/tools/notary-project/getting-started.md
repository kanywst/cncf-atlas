# Getting Started

> Verified against the `main` development line (`v2.0.0-alpha.1`, `internal/version/version.go:18`). Commands assume a Unix shell and an OCI registry you can push to.

## Prerequisites

- Go `>= 1.24` to build from source ([source 12](https://github.com/notaryproject/notation/blob/main/building.md)).
- An OCI artifact you can push to, in a registry that supports the Referrers API or the Referrers tag schema.
- `git` and `make`.

## Install

Build and install from source. `make install` places the binary at `~/bin/notation` ([source 12](https://github.com/notaryproject/notation/blob/main/building.md)):

```bash
git clone https://github.com/notaryproject/notation.git
cd notation
make install
```

If `notation` is not found afterwards, add `~/bin` to your `PATH`:

```bash
export PATH="$HOME/bin:$PATH"
```

## A first working setup

This signs a local artifact and verifies it with a self-generated test key.

1. Confirm the binary runs.

    ```bash
    notation version
    ```

1. Generate a signing key and a self-signed certificate, registering it in the trust store. A signing key must be configured before signing (`cmd/notation/sign.go:68`).

    ```bash
    notation cert generate-test --default "wabbit-networks.io"
    ```

1. Sign an artifact by digest. Signing pins to the digest; a tag reference triggers a mutability warning (`cmd/notation/sign.go:167`). Replace the reference with your own.

    ```bash
    notation sign $REGISTRY/$REPO@$DIGEST
    ```

    Expected output on success (`cmd/notation/sign.go:186-187`):

    ```text
    Successfully signed <registry>/<repo>@sha256:...
    Pushed the signature to <registry>/<repo>@sha256:...
    ```

1. Add a trust policy. Verification requires a certificate in the trust store and a trust policy (`cmd/notation/verify.go:51`). Set the verification level to `strict` so revocation and expiry are enforced ([source 4](https://github.com/notaryproject/specifications/blob/v1.1.0/specs/trust-store-trust-policy.md), [source 9](https://github.com/notaryproject/specifications/security/advisories/GHSA-57wx-m636-g3g8)).

    ```bash
    notation policy import ./trustpolicy.json
    ```

1. Verify the signature.

    ```bash
    notation verify $REGISTRY/$REPO@$DIGEST
    ```

## Verify it works

A successful `notation verify` exits zero and reports the verified artifact. A failure composes the verification errors into a printout and returns a non-zero status (`cmd/notation/verify.go:147-153`). List the signatures attached to an artifact with `notation list <reference>`.

## Where to go next

- Trust store and trust policy reference, including verification levels ([source 4](https://github.com/notaryproject/specifications/blob/v1.1.0/specs/trust-store-trust-policy.md)).
- The rollback-attack advisory for why `permissive` is risky and short expiry plus `strict` is advised ([source 9](https://github.com/notaryproject/specifications/security/advisories/GHSA-57wx-m636-g3g8)).
- Signing with KMS or HSM keys through a plugin, and timestamping with an RFC 3161 TSA ([source 1](https://github.com/notaryproject/notation)).

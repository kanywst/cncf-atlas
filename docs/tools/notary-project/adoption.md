# Adoption & Ecosystem

## Who uses it

These are organizations and services with a citable connection to Notary Project signing. Other names are omitted because the dossier did not establish them.

| Organisation | Use case | Source |
| --- | --- | --- |
| Microsoft Azure Container Registry / AKS | Notary Project signing offered as the replacement for the deprecated Docker Content Trust; Artifact Signing is GA | [source 6](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-content-trust-deprecation), [source 7](https://techcommunity.microsoft.com/blog/appsonazureblog/simplifying-image-signing-with-notary-project-and-artifact-signing-ga/4487942) |
| AWS Signer | Container image signing workflow built on Notation | [source 8](https://docs.aws.amazon.com/signer/latest/developerguide/container-workflow.html) |
| Harbor | Stores Notary Project signatures alongside artifacts in the registry | [source 1](https://github.com/notaryproject/notation) |
| Zot registry | Stores Notation signatures as OCI artifacts | [source 1](https://github.com/notaryproject/notation) |

## Adoption signals

Measured from the GitHub API on 2026-06-24:

- `notaryproject/notation`: 487 stars, 95 forks, 66 open issues, 40 contributors.
- `notaryproject/specifications`: 177 stars.
- `notaryproject/notary` (the older TUF-based v1, a separate project and out of scope here): 3286 stars.

The CNCF project page records acceptance as Incubating and a second completed security audit in 2025 ([source 2](https://www.cncf.io/projects/notary-project/)).

## Ecosystem

- Ratify (CNCF Sandbox): enforces verification at Kubernetes admission time.
- Kyverno: image verification rules.
- notation-action: GitHub Actions integration.
- notation-hashicorp-vault: a signing plugin backed by HashiCorp Vault.
- ORAS (`oras.land/oras-go/v2`): the registry client `notation` builds on (`cmd/notation/registry.go:100`).
- RFC 3161 timestamping via `tspclient-go` (`cmd/notation/sign.go:214-230`).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Sigstore / cosign | Keyless signing with OIDC identities, Fulcio short-lived certs, and the Rekor transparency log. Notation instead relies on standard X.509 PKI and existing CA trust, with no transparency-log dependency ([source 13](https://snyk.io/blog/signing-container-images/)) |
| Docker Content Trust (Notary v1) | TUF-based, with signatures held in a separate server, no cross-registry portability, and one signature per image. Notation is its successor and stores portable signatures as OCI Referrers ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)) |

Pick Notation when you already run a CA or PKI and want signatures that travel with the artifact across registries. Pick Sigstore/cosign when you want keyless signing with short-lived identities and a public transparency log.

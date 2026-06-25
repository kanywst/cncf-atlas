# Notary Project

> Notary Project signs and verifies OCI artifacts with X.509 PKI, storing each signature in the registry next to the artifact it covers.

- **Category**: Supply Chain
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [notaryproject/notation](https://github.com/notaryproject/notation)
- **Documented at commit**: `51ff5ec` (2026-03-26)

## What it is

Notary Project is a set of specifications and tools for signing and verifying OCI artifacts. Its flagship implementation is the `notation` CLI, which signs container images and other OCI artifacts and verifies those signatures against a configured trust store and trust policy. The signing and verification logic lives in the supporting libraries `notation-go` and `notation-core-go`; `notation` is the command layer over them.

The trust model is built on standard X.509 PKI. A signer holds a key and certificate chain; a verifier configures the trusted root certificates and a trust policy that says which identities may sign which artifacts. External keys held in a KMS or HSM are reached through plugins rather than baked into the CLI.

A defining choice is that signatures are stored as OCI Referrers attached to the signed artifact in the same repository (`cmd/notation/registry.go:59-93`). A signature travels with the artifact when the artifact is copied between registries, which removes the cross-registry portability gap that the earlier Docker Content Trust design had.

## When to use it

- You already operate a CA or PKI and want artifact signing that builds on existing X.509 trust rather than a transparency log.
- You need signatures that survive copying an image between registries, because they live alongside the artifact as OCI Referrers.
- You sign with keys in a KMS or HSM and want to integrate them through a signing plugin.
- You are migrating off Docker Content Trust, which registries such as Azure Container Registry are deprecating in favor of Notary Project signatures.

It is a weaker fit when you want keyless signing with short-lived identities and a public transparency log; Sigstore/cosign targets that model instead.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [notaryproject/notation README](https://github.com/notaryproject/notation)
2. [Notary Project (CNCF project page)](https://www.cncf.io/projects/notary-project/)
3. [Notary Project FAQ](https://notaryproject.dev/docs/faq/)
4. [trust-store-trust-policy.md (v1.1.0)](https://github.com/notaryproject/specifications/blob/v1.1.0/specs/trust-store-trust-policy.md)
5. [Notary Project announces a major release](https://notaryproject.dev/blog/2023/announcing-major-release/)
6. [Transition from Docker Content Trust to Notary Project (ACR)](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-content-trust-deprecation)
7. [Simplifying Image Signing with Notary Project and Artifact Signing (GA)](https://techcommunity.microsoft.com/blog/appsonazureblog/simplifying-image-signing-with-notary-project-and-artifact-signing-ga/4487942)
8. [AWS Signer container signing workflow](https://docs.aws.amazon.com/signer/latest/developerguide/container-workflow.html)
9. [GHSA-57wx-m636-g3g8 (rollback attack with permissive policy)](https://github.com/notaryproject/specifications/security/advisories/GHSA-57wx-m636-g3g8)
10. [How Docker Image Signing Will Evolve With Notary v2](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)
11. [Notary Project GOVERNANCE](https://github.com/notaryproject/.github/blob/main/GOVERNANCE.md)
12. [notation building.md](https://github.com/notaryproject/notation/blob/main/building.md)
13. [Signing container images: Sigstore, Notary, DCT (Snyk)](https://snyk.io/blog/signing-container-images/)

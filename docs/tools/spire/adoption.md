# Adoption & Ecosystem

## Who uses it

The project's `ADOPTERS.md` lists these end users with noted contributions (`ADOPTERS.md:7-19`): Anthem, Bloomberg, ByteDance, Duke Energy, GitHub, Netflix, Niantic, Pinterest, Square, Twilio, Uber, Unity Technologies, and Z Lab Corporation. The CNCF graduation announcement separately named Anthem, GitHub, Netflix, Niantic, Pinterest, and Uber as production end users.

The table below lists adopters that have a public case study or talk.

| Organisation | Use case | Source |
| --- | --- | --- |
| AWS | mTLS with SPIFFE/SPIRE in App Mesh on EKS | [AWS blog](https://aws.amazon.com/blogs/containers/using-mtls-with-spiffe-spire-in-app-mesh-on-eks/) |
| Anthem | Zero trust framework using SPIFFE and SPIRE | [upshotstories](https://upshotstories.com/stories/developing-a-zero-trust-framework-at-anthem-using-spiffe-and-spire) |
| Anthropic | SPIRE-issued JWT-SVID plus the SPIRE OIDC Discovery Provider authenticate workloads to the Claude API | [Anthropic docs](https://platform.claude.com/docs/en/manage-claude/wif-providers/spiffe) |
| Bloomberg | TPM-based node attestation | [talk](https://youtu.be/30S0sKRxzjM) |
| Uber | Integration with the workload scheduler | [talk](https://youtu.be/H5IlmYmEDKk?t=4703) |
| Square | mTLS identities for hybrid infrastructure and Lambda | [Square blog](https://developer.squareup.com/blog/providing-mtls-identities-to-lambdas/) |

## Adoption signals

Measured from `gh api repos/spiffe/spire` on 2026-06-23:

- GitHub stars: 2,407; forks: 623; watchers: 79.
- Contributors: 222 (last page number from `repos/spiffe/spire/contributors?per_page=1`).
- Repository created 2017-08-11; latest release `v1.15.1` on 2026-05-28.

SPIRE is a CNCF Graduated project, which required a Cure53 third-party security audit and a CNCF TAG Security review ([CNCF announcement](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/)).

## Ecosystem

Integrations and adjacent tools listed in `ADOPTERS.md:41-67`: Envoy (SVID delivery over SDS), Istio, Linkerd, Consul, Dapr, cert-manager's `csi-driver-spiffe`, Sigstore Fulcio, Tekton Chains, HashiCorp Vault, Traefik, Tornjak (a management UI for SPIRE), and the go-spiffe library. The SPIRE OIDC Discovery Provider exposes JWT-SVIDs as OIDC tokens so external systems such as cloud IAM can consume them.

## Alternatives

SPIRE's distinguishing traits are pluggable multi-stage attestation (node plus workload), both X509-SVID and JWT-SVID, cross-trust-domain federation, secretless bootstrap, and vendor-neutral SPIFFE compliance.

| Alternative | Differs by |
| --- | --- |
| Istio Citadel / istiod | Uses SPIFFE IDs but runs its own CA scoped to the mesh; SPIRE is mesh-independent and spans VMs, bare metal, and Lambda |
| HashiCorp Vault PKI | General secret store and PKI with no attestation of who may request a key; attestation is SPIRE's core |
| AWS IAM Roles Anywhere / GCP Workload Identity | Scoped to a single cloud; SPIRE unifies multi-cloud and on-prem under one trust domain with federation |
| Teleport Machine ID / cert-manager alone | Issue certificates but do not implement the SPIFFE SVID, Workload API, and federation standards |

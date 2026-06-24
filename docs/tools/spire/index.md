# SPIRE

> SPIRE issues short-lived cryptographic identities (X509-SVID and JWT-SVID) to workloads with no shared bootstrap secret, and is the reference implementation of the SPIFFE specification.

- **Category**: Identity & Policy
- **CNCF maturity**: Graduated
- **Language**: Go (`go 1.26.4`, `go.mod:3`)
- **License**: Apache-2.0 (`LICENSE:1-3`)
- **Repository**: [spiffe/spire](https://github.com/spiffe/spire)
- **Documented at commit**: `73215a39` (near tag `v1.15.1`, 2026-06-22)

## What it is

SPIRE is the SPIFFE Runtime Environment. It runs as two binaries: a `spire-server` that acts as the certificate authority for a trust domain, and a `spire-agent` that runs on each node and hands identities to local workloads over a Unix domain socket. The server attests nodes and signs identity documents (SVIDs) from registration entries; the agent attests the processes that ask for an identity and delivers the SVID the manager has already fetched and rotated.

The defining idea is that a workload presents no credential when it asks for its identity. Identity is derived from process metadata the kernel verified, so there is no bootstrap secret to distribute or rotate. SPIRE works across Kubernetes, VMs, bare metal, and serverless, and federates trust between separate trust domains.

It sits below a service mesh, an API gateway, or any mTLS-using system, supplying the identities those layers consume. Envoy, Istio, Linkerd, and Consul can all consume SPIRE-issued SVIDs.

## When to use it

- You need workload identity that spans more than one platform (Kubernetes plus VMs, multiple clouds, on-prem) under a single trust model.
- You want to remove long-lived shared secrets from service-to-service authentication and replace them with short-lived attested certificates.
- You need to federate identity across organizational or trust-domain boundaries.
- You want a vendor-neutral implementation of an open standard (SPIFFE) rather than a mesh-specific or cloud-specific identity system.

When it is not the right fit:

- A single Kubernetes cluster inside one mesh, where the mesh's built-in CA (such as istiod) already covers every workload, may not need a separate identity plane.
- A team that only needs generic secret storage or a general PKI, without attestation, is served by a tool like Vault PKI.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [spiffe/spire (GitHub)](https://github.com/spiffe/spire)
2. [spiffe/spire ADOPTERS.md](https://github.com/spiffe/spire/blob/main/ADOPTERS.md)
3. [SPIFFE and SPIRE Projects Graduate from CNCF Incubator](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/)
4. [SPIRE / CNCF project page](https://www.cncf.io/projects/spire/)
5. [10 Years of SPIFFE (Joe Beda)](https://joe.dev/posts/10-years-of-spiffe/)
6. [Sunil James, CEO of Scytale, Explains SPIFFE (The New Stack)](https://thenewstack.io/sunil-james-ceo-of-scytale-explains-spiffe/)
7. [Opensource SPIFFE and SPIRE (Scytale)](https://scytale.io/opensource-spiffe/)
8. [SPIFFE/SPIRE graduates (HPE Developer)](https://developer.hpe.com/blog/spiffe-spire-graduates-enabling-greater-security-solutions/)
9. [SPIFFE Getting Started (Kubernetes quickstart)](https://spiffe.io/docs/latest/try/getting-started-k8s/)
10. [AWS: mTLS with SPIFFE/SPIRE in App Mesh on EKS](https://aws.amazon.com/blogs/containers/using-mtls-with-spiffe-spire-in-app-mesh-on-eks/)
11. [Anthropic: SPIFFE WIF provider for Claude API](https://platform.claude.com/docs/en/manage-claude/wif-providers/spiffe)
12. [Square: providing mTLS identities to Lambdas](https://developer.squareup.com/blog/providing-mtls-identities-to-lambdas/)
13. [Production Identity Framework SPIRE Graduates from CNCF (InfoQ)](https://www.infoq.com/news/2022/09/spire-graduates-cncf/)

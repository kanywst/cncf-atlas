# SPIFFE

> SPIFFE is a set of standards for giving workloads a short-lived, cryptographically verifiable identity without pre-distributing secrets.

- **Category**: Identity & Policy
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [spiffe/go-spiffe](https://github.com/spiffe/go-spiffe)
- **Documented at commit**: `e9973f6` (v2.8.1)

## What it is

SPIFFE (Secure Production Identity Framework For Everyone) is a vendor-neutral set of standards for workload identity. It defines three things: the SPIFFE ID (a `spiffe://` URI that names a workload), the SVID (an X509-SVID or JWT-SVID, the verifiable identity document), and the Workload API (a gRPC API that issues and rotates SVIDs). The reference server and agent that implement those standards live in a separate project, SPIRE.

This deep-dive reads `spiffe/go-spiffe`, the canonical Go client library applications use to consume SPIFFE. It wraps the Workload API and gives you mutually authenticated TLS between workloads, X509-SVID and JWT-SVID retrieval and validation, and trust bundle management ([README.md:5-9](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/README.md#L5-L9)).

A workload never sees a long-lived credential. It connects to a local Workload API endpoint (a SPIRE Agent over a Unix socket), the agent attests the workload, and go-spiffe streams freshly minted SVIDs into the application's TLS config. Identity is the URI in the certificate, and authorization is checking that URI against an allowed set.

## When to use it

- You run services across clusters, clouds, or VMs and want one identity model instead of per-platform IAM.
- You want mTLS between services where the peer's identity is a `spiffe://` URI, not a hostname or a shared token.
- You need to federate trust between separate trust domains so workloads in one can authenticate workloads in another.
- It is a poor fit if you only need human or end-user authentication; SPIFFE identifies workloads, not people.
- It adds operational weight if you have a single platform whose native workload identity (for example a cloud IAM) already covers your needs.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [spiffe/go-spiffe repository](https://github.com/spiffe/go-spiffe) (pinned v2.8.1).
2. [SPIFFE and SPIRE Projects Graduate from CNCF](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/).
3. [SPIFFE project page (CNCF)](https://www.cncf.io/projects/spiffe/).
4. [SPIFFE standards (SPIFFE-ID / SVID / Workload API)](https://github.com/spiffe/spiffe/tree/main/standards).
5. [spiffe.io and SPIRE case studies](https://spiffe.io/docs/latest/spire-about/case-studies/).
6. [Uber: Our Journey Adopting SPIFFE/SPIRE at Scale](https://www.uber.com/en/blog/our-journey-adopting-spiffe-spire/).
7. [spiffe/spire ADOPTERS.md](https://github.com/spiffe/spire/blob/main/ADOPTERS.md).
8. [go-spiffe v2 Go package reference](https://pkg.go.dev/github.com/spiffe/go-spiffe/v2).

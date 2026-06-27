# Confidential Containers

> Confidential Containers runs unmodified Kubernetes Pods inside hardware-isolated confidential virtual machines and releases secrets only to workloads that pass remote attestation.

- **Category**: Security & Compliance
- **CNCF maturity**: Sandbox
- **Language**: Rust
- **License**: Apache-2.0
- **Repository**: [confidential-containers/trustee](https://github.com/confidential-containers/trustee)
- **Documented at commit**: `af53e98` (2026-06-26, near tag v0.20.0)

## What it is

Confidential Containers (CoCo) is a CNCF Sandbox project that runs Kubernetes workloads inside a Trusted Execution Environment (TEE), a hardware-isolated memory region that the host operating system and hypervisor cannot read. The goal is to protect data while it is in use, so a cloud provider running the infrastructure cannot inspect the tenant's containers or their data.

The project spans several repositories in the [confidential-containers](https://github.com/confidential-containers) GitHub organization. The runtime side reuses Kata Containers to boot each Pod inside a lightweight confidential virtual machine (CVM). This deep-dive focuses on **trustee**, the server-side implementation of attestation and secret delivery. Trustee holds the part of CoCo's trust model that decides which workloads are genuine TEEs and what secrets they may receive.

Trustee is written in Rust as a Cargo workspace. Its central component is the Key Broker Service (KBS), an HTTP server that runs the Request-Challenge-Attestation-Response (RCAR) handshake, verifies hardware evidence through an Attestation Service (AS), and gates every secret behind a Rego policy. A workload's guest agent contacts the KBS, proves it is running in a genuine TEE, and only then receives decryption keys or other secrets, encrypted so that only that specific CVM can read them.

## When to use it

- You run tenant workloads on infrastructure you do not fully trust (public cloud, shared bare metal) and need to keep the cloud operator outside the trust boundary.
- You need keys, model weights, or other secrets released to a workload only after it proves, with hardware-backed evidence, that it runs in a genuine TEE.
- You want one attestation and key-release flow that covers several TEE types (Intel TDX, AMD SEV-SNP, Intel SGX, IBM Secure Execution, Arm CCA, NVIDIA GPU) instead of a per-vendor integration.
- It is a poor fit when your threat model already trusts the host and hypervisor; the overhead of confidential VMs and attestation buys you nothing there.
- It is also a poor fit when you cannot run on TEE-capable hardware, since attestation depends on a signed hardware quote.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. trustee repository: <https://github.com/confidential-containers/trustee>
2. confidential-containers organization: <https://github.com/confidential-containers>
3. ADOPTERS.md: <https://github.com/confidential-containers/confidential-containers/blob/main/ADOPTERS.md>
4. CNCF project page: <https://www.cncf.io/projects/confidential-containers/>
5. cncf/sandbox onboarding issue #216: <https://github.com/cncf/sandbox/issues/216>
6. Red Hat, "What is the Confidential Containers project?": <https://www.redhat.com/en/blog/what-confidential-containers-project>
7. Red Hat, "Understanding the Confidential Containers Attestation Flow": <https://www.redhat.com/en/blog/understanding-confidential-containers-attestation-flow>
8. RATS architecture draft: <https://www.ietf.org/archive/id/draft-ietf-rats-architecture-22.html>
9. Project website: <https://confidentialcontainers.org/>
10. guest-components repository: <https://github.com/confidential-containers/guest-components>

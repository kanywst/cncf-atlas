# in-toto

> A framework that verifies every step of a software supply chain was carried out as planned, by authorized parties, on un-tampered artifacts.

- **Category**: Supply Chain
- **CNCF maturity**: Graduated
- **Language**: Python (>=3.9)
- **License**: Apache-2.0
- **Repository**: [in-toto/in-toto](https://github.com/in-toto/in-toto)
- **Documented at commit**: `a8ce9ee` (2026-05-19)

## What it is

in-toto protects the integrity of a software supply chain end to end. A project owner writes a signed **layout** that lists the steps of the chain (tag, build, test, package) and the **functionaries** authorized to perform each one. When a functionary runs a step, in-toto records what command ran and which files went in and came out into a signed **link** file. At release time the layout, the links, and the owner's public keys travel with the product, and `in-toto-verify` checks that the recorded chain matches the planned one (in_toto/in_toto_verify.py:222).

The Python repository documented here is the reference implementation of the in-toto specification. It ships six command line tools (pyproject.toml:50). The specification itself, and ports in Go, Java, and Rust, live in sibling repositories under the same project.

in-toto is a format and a verification model, not a hosted service. It sits below opinionated layers like SLSA (which expresses build provenance as an in-toto attestation) and alongside Sigstore (which solves the signing and transparency problem). A typical pipeline uses all three together.

## When to use it

- You need cryptographic proof that a released artifact came from the exact sequence of build steps you defined, with no unauthorized step inserted.
- You want to bind separate CI stages (source, build, package) to specific signing keys and enforce that the output of one stage is the input of the next.
- You are producing or consuming SLSA provenance and want the underlying envelope and verification logic.
- It is a poor fit when you only need to sign a single artifact with no notion of a multi-step chain: a plain Sigstore or GPG signature is simpler.
- It does not manage key distribution or revocation; pair it with TUF or Sigstore for that.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [in-toto/in-toto repository](https://github.com/in-toto/in-toto)
2. [GitHub API: in-toto/in-toto metadata](https://api.github.com/repos/in-toto/in-toto)
3. [CNCF project page: in-toto](https://www.cncf.io/projects/in-toto/)
4. [CNCF: in-toto moves to the Incubator (2022)](https://www.cncf.io/blog/2022/03/10/supply-chain-security-project-in-toto-moves-to-the-cncf-incubator/)
5. [CNCF Announces Graduation of in-toto (2025-04-23)](https://www.cncf.io/announcements/2025/04/23/cncf-announces-graduation-of-in-toto-security-framework-enhancing-software-supply-chain-integrity-across-industries/)
6. [InfoQ: CNCF Graduates in-toto](https://www.infoq.com/news/2025/06/cncf-intoto/)
7. [NYU CCS: in-toto graduates from CNCF](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/)
8. [Sbomify: What Is in-toto?](https://sbomify.com/2024/08/14/what-is-in-toto/)
9. [USENIX Security 2019: in-toto farm-to-table guarantees](https://www.usenix.org/system/files/sec19-torres-arias.pdf)
10. [in-toto/friends: integrations and adopters](https://github.com/in-toto/friends)
11. [reproducible-builds.org tools](https://reproducible-builds.org/tools/)
12. [AquilaX: in-toto vs SLSA vs Sigstore](https://aquilax.ai/blog/supply-chain-artifact-signing-slsa)
13. [SLSA v1.1 FAQ](https://slsa.dev/spec/v1.1/faq)

# Adoption & Ecosystem

## Who uses it

The flagship production deployment is Datadog, documented in the USENIX Security 2019 paper. The remaining adopters and integrations below are listed in the project's own [in-toto/friends](https://github.com/in-toto/friends) registry.

| Organisation | Use case | Source |
| --- | --- | --- |
| Datadog | Protects the CI/CD of the agent and its integrations; tag steps signed with a hardware dongle, CI with online keys, distributed alongside TUF | [USENIX 2019](https://www.usenix.org/system/files/sec19-torres-arias.pdf) |
| Debian / Reproducible Builds | `rebuilderd` records rebuild results as in-toto links; `apt-transport-in-toto` verifies k-of-n rebuilder metadata at install | [reproducible-builds.org](https://reproducible-builds.org/tools/), [in-toto/friends](https://github.com/in-toto/friends) |
| Sigstore / cosign | Signs in-toto metadata with keyless signing; used in cosign SLSA provenance generation | [in-toto/friends](https://github.com/in-toto/friends) |
| Tekton Chains | Observes TaskRuns and generates in-toto attestations | [in-toto/friends](https://github.com/in-toto/friends) |
| GitHub | Artifact attestations carry SLSA build provenance and SBOM as in-toto predicate types | [in-toto/friends](https://github.com/in-toto/friends) |
| GUAC / Grafeas | GUAC ingests SLSA/in-toto attestations; Grafeas supports in-toto link metadata | [in-toto/friends](https://github.com/in-toto/friends) |
| Lockheed Martin | Listed as an adopting organisation in the friends registry | [in-toto/friends](https://github.com/in-toto/friends) |

## Adoption signals

For the Python reference repository (in-toto/in-toto), the GitHub API reported 1,009 stars, 155 forks, and 35 watchers, with the repository created on 2016-05-24 (observed 2026-06-22, [GitHub API](https://api.github.com/repos/in-toto/in-toto)). These numbers cover only the Python implementation; the wider ecosystem (the specification, the attestation framework, and the Go, Java, and Rust ports) is larger. in-toto reached CNCF Graduated status in 2025, the maturity tier reserved for projects with demonstrated production adoption ([CNCF announcement](https://www.cncf.io/announcements/2025/04/23/cncf-announces-graduation-of-in-toto-security-framework-enhancing-software-supply-chain-integrity-across-industries/)).

## Ecosystem

in-toto's attestation framework (ITE-6) defines the statement/subject/predicate envelope that other supply chain tools fill in. SLSA Provenance is expressed as a predicate type on top of this envelope ([SLSA v1.1 FAQ](https://slsa.dev/spec/v1.1/faq)). Sigstore provides keyless signing for in-toto metadata, Tekton Chains and GitHub artifact attestations produce it, and GUAC and Grafeas consume and aggregate it ([in-toto/friends](https://github.com/in-toto/friends)).

## Alternatives

These are layers rather than direct competitors: in-toto is the format and verification model, SLSA is the requirements specification on top, and Sigstore solves signing and transparency. A typical pipeline combines all three.

| Alternative | Differs by |
| --- | --- |
| SLSA | A requirements spec, not a tool; uses in-toto attestations as the vehicle for provenance and demands signed provenance at L2/L3 ([SLSA v1.1 FAQ](https://slsa.dev/spec/v1.1/faq)) |
| Sigstore | Solves key management with short-lived OIDC certificates and the Rekor transparency log; fills in-toto's signing layer rather than replacing it ([AquilaX](https://aquilax.ai/blog/supply-chain-artifact-signing-slsa)) |
| TUF | Protects the distribution channel against compromise; complementary, and Datadog uses both ([USENIX 2019](https://www.usenix.org/system/files/sec19-torres-arias.pdf)) |
| Grafeas / GUAC | Metadata API and attestation aggregation respectively; consume in-toto data rather than generate the chain-of-custody proof ([in-toto/friends](https://github.com/in-toto/friends)) |

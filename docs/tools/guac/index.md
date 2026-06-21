# GUAC

> GUAC (Graph for Understanding Artifact Composition) aggregates software supply chain metadata (SBOMs, attestations, VEX, scorecards) into a queryable graph so you can ask audit, policy, and risk questions across many artifacts at once.

- **Category**: Supply Chain
- **CNCF maturity**: Independent (not a CNCF project; an OpenSSF incubating project under the Supply Chain Integrity WG)
- **Language**: Go (`go 1.26.0`)
- **License**: Apache-2.0
- **Repository**: [guacsec/guac](https://github.com/guacsec/guac)
- **Documented at commit**: `362e6da` (main, 2026-06-20)

## What it is

GUAC ingests supply chain documents (SPDX and CycloneDX SBOMs, in-toto/SLSA attestations, OpenVEX and CSAF, OpenSSF Scorecard results), normalizes the entities they describe, and writes them into a single graph that you query over GraphQL. Instead of storing one SBOM per artifact in isolation, it links packages, sources, artifacts, builders, and the evidence about them into one connected model.

It also enriches that graph with metadata that does not live inside an SBOM. During ingestion it can fan out to external sources (OSV for vulnerabilities, ClearlyDefined for licenses, endoflife.date, deps.dev) and attach the results as evidence on the same nodes. The position GUAC stakes out is the "aggregation and synthesis" layer of the supply chain transparency model: it sits above the tools that produce SBOMs and attestations, and below the policy and dashboard tools that consume answers.

GUAC is for teams that already produce supply chain metadata and now need to query it at portfolio scale: which of our images depend on a vulnerable package, which builds lack an SLSA attestation, what licenses are in this release. It is a relationship graph and query layer, not an SBOM store.

## When to use it

- You have many SBOMs/attestations across many artifacts and need cross-cutting answers ("what depends on log4j across all our images").
- You want to enrich supply chain data with third-party vulnerability, license, or end-of-life signals in one place.
- You want a stable GraphQL API over normalized supply chain entities for policy or dashboard tooling to build on.
- Not the right fit if you only need to store and retrieve a single SBOM per artifact: a simpler SBOM repository is enough.
- Not a scanner or attestation generator: GUAC consumes what those tools produce, it does not create the evidence itself.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how documents flow into the graph.
- [Adoption & Ecosystem](./adoption): who builds it and what surrounds it.
- [Internals](./internals): the ingestion code paths, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [guacsec/guac README](https://github.com/guacsec/guac) (accessed 2026-06-22)
2. [guac source at pinned commit 362e6da](https://github.com/guacsec/guac/tree/362e6dacedaa22af63c157b2c9d3e39a51da437f) (accessed 2026-06-22)
3. [GUAC Joins OpenSSF as Incubating Project (OpenSSF)](https://openssf.org/blog/2024/03/07/guac-joins-openssf-as-incubating-project/) (accessed 2026-06-22)
4. [OpenSSF project page: GUAC](https://openssf.org/projects/guac/) (accessed 2026-06-22)
5. [GUAC Joins OpenSSF as Incubating Project (InfoQ)](https://www.infoq.com/news/2024/03/guac-incubating-openssf/) (accessed 2026-06-22)
6. [GUAC Joins OpenSSF (Kusari)](https://www.kusari.dev/blog/graph-for-understanding-artifact-composition-guac-joins-openssf-as-incubating-project) (accessed 2026-06-22)
7. [GUAC Tutorial (Wiz)](https://www.wiz.io/academy/guac-overview) (accessed 2026-06-22)
8. [Red Hat contributes Trustify to the GUAC community](https://www.redhat.com/en/blog/red-hat-contributes-trustify-project-openssfs-guac-community) (accessed 2026-06-22)
9. [GUAC docs / setup](https://docs.guac.sh/) (accessed 2026-06-22)
10. [GitHub REST API repos/guacsec/guac](https://api.github.com/repos/guacsec/guac) (accessed 2026-06-22)

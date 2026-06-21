# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS.md` and the README has no adopters section, so this deep-dive found no citable named production end-user. Rather than invent one, the table below lists the organizations with a documented relationship to the project, which is building and supporting it, not a public statement of running it in production.

| Organisation | Relationship | Source |
| --- | --- | --- |
| Kusari, Google, Purdue University, Citi | Founding collaborators | [Kusari blog](https://www.kusari.dev/blog/graph-for-understanding-artifact-composition-guac-joins-openssf-as-incubating-project) |
| OpenSSF | Hosts GUAC as an incubating project | [OpenSSF project page](https://openssf.org/projects/guac/) |
| Red Hat | Contributed the Trustify project to the GUAC community | [Red Hat blog](https://www.redhat.com/en/blog/red-hat-contributes-trustify-project-openssfs-guac-community) |

## Adoption signals

Because named adopters are not citable, the measurable signals matter more here. As of 2026-06-22 (GitHub REST API): 1,508 stars, 205 forks, and 70 contributors. The project is an OpenSSF incubating project under active development, with commits on `main` past the latest tagged release (sources: GitHub API, OpenSSF project page).

## Ecosystem

GUAC sits downstream of the tools that produce supply chain metadata and integrates a broad set of formats and sources. It ingests SPDX and CycloneDX SBOMs, in-toto/SLSA attestations (ITE6/DSSE), OpenVEX and CSAF, and OpenSSF Scorecard results, and it can enrich the graph from deps.dev, OSV, ClearlyDefined, and endoflife.date (`pkg/handler/processor/process/process.go:57`, `pkg/ingestor/parser/parser.go:109`). Collection sources include file, OCI, GCS, S3, git, GitHub, and Kubescape (`pkg/handler/collector/`). On storage it ships keyvalue (in-memory) and ent+PostgreSQL as supported backends, with ArangoDB, Neo4j, and Neptune also present (`pkg/assembler/backends/backends.go:27`).

## Alternatives

GUAC's distinction is that it is a relationship graph and query layer across many artifacts plus external metadata, not a per-artifact SBOM store and not a scanner.

| Alternative | Differs by |
| --- | --- |
| Dependency-Track | Component/vulnerability analysis dashboard centered on tracked projects, rather than a general GraphQL graph aggregating arbitrary supply chain documents and external sources |
| Trustify | Adjacent supply chain effort contributed by Red Hat into the GUAC community in 2026, consolidating rather than competing ([Red Hat blog](https://www.redhat.com/en/blog/red-hat-contributes-trustify-project-openssfs-guac-community)) |
| Plain SBOM repositories | Store and retrieve individual SBOMs; they do not normalize entities across documents or answer cross-artifact queries |

# History

## Origin

GUAC was created as a joint effort by Kusari, Google, Purdue University, and Citi, with the GitHub repository opened on 2022-06-10 (GitHub API `created_at`). The motivating problem: SBOMs and attestations were being produced in growing volume, but they sat in isolation, so questions that span a whole portfolio ("which of our artifacts are affected by this vulnerability") had no good answer. GUAC was designed to fill the "aggregation and synthesis" layer, combining many documents plus external metadata (deps.dev, OSV, ClearlyDefined) into one graph that audit, policy, and risk tooling can query (README).

## Timeline

| Year | Milestone |
| --- | --- |
| 2022 | GitHub repository created; founding collaboration of Kusari, Google, Purdue, Citi |
| 2024 | Joins OpenSSF as an incubating project under the Supply Chain Integrity WG (2024-03-07) |
| 2026 | Red Hat contributes the Trustify project to the GUAC community |

## How it evolved

The clearest governance shift is the move under OpenSSF. On 2024-03-07 GUAC was accepted as an OpenSSF incubating project, reported as the first project to clear the incubating due-diligence review under the OpenSSF project lifecycle (OpenSSF blog; InfoQ). That placed it under the Supply Chain Integrity WG, the same working group named in the project README.

The ecosystem around GUAC has continued to consolidate. In 2026 Red Hat contributed its Trustify project into the GUAC community (Red Hat blog), bringing an adjacent supply chain effort under the same umbrella rather than competing with it.

## Where it stands now

GUAC is under active development as an OpenSSF incubating project; the README itself flags it as such and points contributors to the Supply Chain Integrity WG. The repository at the documented commit targets Go 1.26 and ships five CLI binaries plus multiple storage backends, with development continuing on `main` past the most recent tagged release (sources 2, 3, 4).

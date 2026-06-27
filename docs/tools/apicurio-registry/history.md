# History

## Origin

The Apicurio community started in 2016 with Apicurio Studio, an API design tool sponsored by Red Hat. Apicurio Registry began in 2019 as a separate project focused on storing and versioning schemas at runtime rather than designing APIs (source 6). The GitHub repository was created on 2019-07-16 (source 3). The first public releases, `1.0.4.Final` and `1.1.0.Final`, both shipped on 2020-02-03 (source 7).

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | Apicurio Studio (API design tool) starts the Apicurio community (source 6) |
| 2019 | Apicurio Registry begins as a separate project; repo created 2019-07-16 (source 3, source 6) |
| 2020 | First public releases `1.0.4.Final` and `1.1.0.Final` (source 7) |
| 2021 | `2.0.0.Final` released on 2021-04-16 (source 7) |
| 2023 | CNCF Sandbox application filed as issue #72 (source 4) |
| 2024 | 3.0 line begins; earliest 3.0 milestone `3.0.0.M3` on 2024-06-17 (source 7) |
| 2025 | `3.1.0` (2025-10-07) absorbs Apicurio Studio design features as opt-in (source 6, source 7) |
| 2026 | `3.3.0` (2026-06-08) adds experimental GitOps storage (source 6, source 7) |

## How it evolved

The 3.0 release in 2024 was the largest restructuring. Earlier versions shipped a different container image per storage backend. Version 3.0 collapsed these into a single deployable artifact whose storage variant is selected at startup, redesigned the REST API, and introduced the hierarchical rule engine (source 1). The README confirms the single-artifact model: "Starting with Apicurio Registry 3.0, we now produce a single artifact suitable for running any storage variant" (source 1).

Version 3.1.0 brought the old Apicurio Studio design-editing capability back into the registry as an opt-in feature and deprecated the standalone Studio, along with support for AI agent artifact types (source 6, source 7). Version 3.3.0 added experimental GitOps storage, which makes a Git repository the source of truth and runs the registry read-only against it (source 6, source 7).

## Where it stands now

The project follows Semantic Versioning. Minor releases (3.3.0, 3.4.0) carry features and bug fixes; patch releases carry only CVE (Common Vulnerabilities and Exposures) and security fixes (source 1). The support window covers the two most recent minor versions (source 1). Apicurio Registry was accepted into the CNCF Sandbox in 2024, and its `GOVERNANCE.md` states vendor-neutral principles despite the existence of the Red Hat downstream build (source 4). A later CNCF issue, #461 (2026-02), tracks deeper ecosystem integration with Strimzi, CloudEvents, and xRegistry (source 5).

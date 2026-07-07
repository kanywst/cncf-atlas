# History

## Origin

Cedar was built at Amazon. Before it was open-sourced, it had already been developed for years as the authorization engine behind two AWS products: Amazon Verified Permissions and AWS Verified Access (src 5). The problem it set out to solve is the one every application reinvents: deciding whether an authenticated principal is allowed to perform a given action on a given resource, without scattering that logic across application code.

On 2023-05-10 AWS announced Cedar as an open-source language for access control and released both the language and the SDK under Apache-2.0 (src 4, src 5). The reference implementation is the Rust workspace in `cedar-policy/cedar` (src 1).

A defining choice from the start was the engineering method, called verification-guided development: the team models the authorization engine formally, uses automated reasoning to prove safety properties (for example that forbid always overrides permit), and confirms the Rust implementation matches the model through differential testing (src 5, src 3). The formal specification is written in the Lean theorem prover and lives in the separate `cedar-spec` repository (src 3).

## Timeline

| Year | Milestone |
| --- | --- |
| 2023 | AWS open-sources the Cedar language and SDK under Apache-2.0 on 2023-05-10 (src 4, src 5) |
| 2025 | CNCF accepts Cedar as a Sandbox project on 2025-10-08 (src 2) |
| 2026 | Release `v4.11.2` published 2026-06-22; the documented commit `991bacf` sits just after it (src 8) |

## How it evolved

Cedar started as the engine inside AWS managed services and was then extracted into a standalone open-source project. Over time the workspace grew beyond a single SDK crate into a set of related crates: the public SDK (`cedar-policy`), the internal core (`cedar-policy-core`), a CLI (`cedar-policy-cli`), a wasm binding (`cedar-wasm`), a Language Server (`cedar-language-server`), a formatter (`cedar-policy-formatter`), and the symbolic compiler (`cedar-policy-symcc`) (README:42-49). The symbolic compiler is the clearest evolution of the original verification idea from a development-time method into a tool users can run against their own policies (README:43).

The CLI and SDK version on independent tag namespaces, so release notes are split across two changelogs (README:150-151). At the documented commit the workspace package version is `4.11.0` while the latest published SDK release is `v4.11.2` (Cargo.toml:63, src 8).

In 2025 the project's governance direction changed. AWS announced that Cedar was joining the CNCF Sandbox to move toward vendor-neutral governance, and named outside organizations already adopting and maintaining it (src 3). The CNCF accepted Cedar on 2025-10-08 (src 2).

## Where it stands now

Cedar releases frequently as a Rust crate; `v4.11.2` shipped on 2026-06-22 (src 8). It is a CNCF Sandbox project (src 2) with maintainers from AWS and outside organizations (src 3). The stated direction is broader, vendor-neutral adoption of one analyzable authorization language across ecosystems, including Kubernetes policy management (src 3, src 6). As an indicator of community size, the repository shows 1,571 stars and 61 non-anonymous contributors as observed on 2026-06-27 (src 1).

# History

## Origin

Cozystack was started by Andrei Kvapil (@kvaps) and was originally built and sponsored by Ænix, a consulting company he founded (README, source 2). The GitHub repository was created on 2023-11-21 (GitHub API, source 8). Kvapil has described the project as the result of a long-standing goal to build his own cloud, assembled from open-source Kubernetes components rather than a proprietary stack (Ænix blog, source 6).

The problem it set out to solve was concrete: hosting providers and platform teams who wanted to offer managed Kubernetes, virtual machines, and databases on their own hardware had to stitch together many separate projects and operate each one. Cozystack packages that stitching as an opinionated platform with a single API.

## Timeline

| Year | Milestone |
| --- | --- |
| 2023 | Repository `cozystack/cozystack` created on 2023-11-21 (source 8). |
| 2024 | Early production adopters appear in ADOPTERS.md, starting with Ænix on 2024-02-14 (source 3); the v0.8.0 line adds a FluxCD operator, E2E tests, and ARM support (source 6). |
| 2025 | The CNCF TOC voted to accept Cozystack into the Sandbox on 2025-02-28; the CNCF announced it publicly on 2025-04-28 (sources 5, 6). |
| 2026 | Release `v1.5.1` on 2026-06-24; the project is in its 1.5 series (source 1). |

## How it evolved

A stated reason for moving into the CNCF was licensing durability. Kvapil cited the license changes made by projects such as MongoDB, Redis, Terraform, and Vault, and framed CNCF donation as a guarantee that Cozystack stays Apache-2.0 (Ænix blog, source 6). The Sandbox application itself is on record in the CNCF process: the sandbox proposal issue `cncf/sandbox#322` and the TAG App Delivery review `cncf/tag-app-delivery#719` (sources on the CNCF side).

Technically, the project grew from a bundle of manifests toward a controller-driven platform. The v0.8.0 line introduced a dedicated FluxCD operator and end-to-end tests, and later releases expanded the managed-service catalog under `packages/apps/` and the system component set under `packages/system/`. The API layer settled on the aggregated apiserver model described in [Architecture](./architecture) and [Internals](./internals), where user-facing kinds are defined by `ApplicationDefinition` resources and served dynamically instead of being hard-coded.

## Where it stands now

Cozystack is a CNCF Sandbox project (source 4) developed under the `cozystack` GitHub organization, with governance and maintainers documented in the repository's GOVERNANCE.md and MAINTAINERS.md (source 1). Releases are cut as tagged versions; the latest at the time of writing is `v1.5.1`, dated 2026-06-24 (source 1). The maintainer set has broadened beyond Ænix to include people from adopting companies such as Urmanac and Hidora (source 3). The project holds an OpenSSF Best Practices badge referenced from its README (source 2).

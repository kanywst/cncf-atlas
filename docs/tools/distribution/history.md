# History

## Origin

The first container registry was Docker's, and it was Python. That original Registry did not use content-addressable storage, which made deduplication and integrity checks awkward. The rewrite that became Distribution was done in Go and reframed as an extensible library: a base that could swap out backends and subsystems rather than a single fixed server. This is the codebase once known as Docker Distribution, or Registry v2 (Docker blog; The New Stack).

The protocol it implemented was the Docker Registry HTTP API V2. That API later moved to the Open Container Initiative and became the basis of the OCI Distribution Specification. The project's README now states plainly that the `registry` component is an implementation of that OCI specification (README; HTTP API V2 docs).

## Timeline

| Year | Milestone |
| --- | --- |
| 2014 | Repository created (2014-12-22) as the Go rewrite of Docker's Python registry |
| 2021 | Accepted into CNCF at the Sandbox level (2021-01-26); Docker publicly announces the donation (2021-02-04); project renamed from `docker/distribution` to `distribution/distribution` |
| 2025 | `v3.0.0` reaches GA |
| 2026 | `v3.1.1` released (2026-05-01); documented here at `472c9d38`, one commit later |

## How it evolved

The defining event was the 2021 donation to the CNCF. Docker announced it was giving Distribution to the foundation so that the code underpinning so many registries could be maintained by a broader group. The stated problem was fragmentation: small forks and unmerged changes had accumulated because the shared base had a single-vendor home. Moving it to a neutral foundation was the fix (Docker blog; The New Stack).

The donation came with a maintainer drive. Docker recruited maintainers from the large operators that already depended on the code, naming Docker, GitHub, GitLab, DigitalOcean, Mirantis, Harbor, and the OCI. The project was renamed from `docker/distribution` to `distribution/distribution` as part of the move (Docker blog). CNCF records the acceptance as Sandbox on 2021-01-26 (CNCF project page).

After the donation the version line advanced from the long-lived v2 series (v2.8.x was the last v2) to v3, which reached GA in 2025. The v3 line is where the project sits today.

## Where it stands now

Distribution is an active CNCF Sandbox project. The current release is `v3.1.1` (2026-05-01), and this deep-dive is pinned one commit later at `472c9d38`. It has not been promoted past Sandbox, which is worth noting given how widely the code is deployed: maturity level and real-world footprint are not the same thing here. The project's own framing is unchanged from the donation: a spec-conformant, extensible base that registry products build on, rather than an end-user product with its own auth, scanning, and UI (README; CNCF project page).

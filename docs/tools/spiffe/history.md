# History

## Origin

SPIFFE began as a vendor-neutral answer to a recurring problem: how do you give every service a verifiable identity without scattering long-lived secrets across the fleet. The work grew out of Scytale (later acquired by HPE) and the CNCF community, with the standards split into the SPIFFE ID, the SVID, and the Workload API. The go-spiffe repository was created on 2017-05-07, before the project entered the CNCF, and is the Go client that applications use to talk to a Workload API implementation.

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | go-spiffe repository created (2017-05-07). |
| 2018 | SPIFFE accepted into the CNCF Sandbox (2018-03-29). |
| 2020 | Promoted to CNCF Incubating (2020-06-22). |
| 2022 | Graduated from the CNCF (2022-08-23; announced 2022-09-20). |
| 2026 | go-spiffe v2.8.1 released (2026-06-19). |

## How it evolved

SPIFFE is a specification project, so its evolution shows up across three repositories. The standards themselves (SPIFFE ID, X509-SVID, JWT-SVID, and the Workload API) live in `spiffe/spiffe`. The reference implementation, SPIRE, provides the server and agent. go-spiffe is the consumption side: the v2 module under `github.com/spiffe/go-spiffe/v2` is the current major version, and its code sits at the repository root rather than in a `v2/` subdirectory.

The graduation in 2022 came alongside SPIRE; the CNCF graduated both projects together, citing production use at companies running large fleets ([source #2](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/)).

## Where it stands now

go-spiffe ships regular tagged releases, with v2.8.1 cut on 2026-06-19. The library tracks the SPIFFE standards and is the Go entry point most projects use. New surface area is staged under `exp/`, for example the experimental WIT-SVID (Workload Identity Token) in `exp/svid/witsvid/`, which lets the maintainers iterate on emerging formats without breaking the stable API. For the broader project direction, the standards repository and the CNCF project page are the authoritative sources ([source #3](https://www.cncf.io/projects/spiffe/), [source #4](https://github.com/spiffe/spiffe/tree/main/standards)).

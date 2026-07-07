# History

## Origin

Dalec was started by Microsoft's Azure Upstream team, with the GitHub repository opened on 2023-06-08 (GitHub API `created_at`). The motivating problem was internal: Azure needed to build software packages in a way that satisfied its compliance rules, meaning reproducible builds that carry signed packages, SBOMs, and provenance. Producing native RPM and DEB packages that way normally requires distro-specific tooling, build hosts, and hand-written scripts. Dalec was built to fold that into one declarative spec that runs through Docker BuildKit, so a build needs no tool beyond `docker build` (Microsoft Community Hub blog; cncf/sandbox #396).

Microsoft does not ship Dalec as a product. The Sandbox proposal frames it the same way AKS relates to upstream Kubernetes: Microsoft uses Dalec downstream for its own compliance builds and develops it in the open, rather than selling it (cncf/sandbox #396).

## Timeline

| Year | Milestone |
| --- | --- |
| 2023 | GitHub repository created by the Azure Upstream team (2023-06-08) |
| 2025 | CNCF Sandbox proposal filed (cncf/sandbox #396, 2025-07-18); accepted as a Sandbox project (2025-10-08); repo moved from `Azure/dalec` to the `project-dalec` org |
| 2026 | Active `v0.21.x` release line; documented here at `0d888c2`, near tag `v0.21.2` |

## How it evolved

The two clear shifts are governance and naming, and they happened together. On 2025-07-18 Riya Choudary filed the CNCF Sandbox proposal on behalf of the Azure Upstream team, with Microsoft's Brendan Burns as the sponsor contact and support from CNCF figures including Jeremy Rickard (a TOC member), Lachie Evenson (a Governing Board member), and Bridget Kromhout (cncf/sandbox #396). The proposal cleared its vote (the issue carries the `gitvote/passed` label) and Dalec was accepted at the Sandbox level on 2025-10-08 (CNCF project page).

Around that acceptance the project moved out of Microsoft's namespace. The repository went from `Azure/dalec` to `project-dalec/dalec`: GitHub now serves a 301 redirect from the old path, the Go module is `github.com/project-dalec/dalec`, and the copyright line reads "Dalec a Series of LF Projects, LLC" (README). The code stayed the same; the home changed to a vendor-neutral CNCF org. Microsoft continued to present Dalec as a CNCF project at KubeCon NA 2025 and EU 2026 (Microsoft open source blogs).

## Where it stands now

Dalec is an active CNCF Sandbox project on a steady release cadence, with the `v0.21.x` line current as of the documented commit (2026-06-26). Governance is defined in `GOVERNANCE.md` ("Dalec Project Governance"), which covers maintainers, the process for becoming one, meetings, a security response team, and voting. Contributions require a signed-off DCO, enforced per pull request by the CNCF `dco-2` GitHub App (README). The maintainer set is still entirely Microsoft (Brian Goff, Jeremy Rickard, Peter Engelbert, with Sertac Ozercan emeritus per `MAINTAINERS.md`), so the move to a neutral org has not yet broadened the contributor base, a point the adoption page returns to.

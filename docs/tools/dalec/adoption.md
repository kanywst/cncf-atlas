# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS.md` (GitHub API returns 404) and this deep-dive found no citable third-party organization running Dalec in production. The one documented user is the vendor itself: Microsoft's Azure Upstream team uses Dalec internally for compliance builds. That is vendor self-use, not an independent adopter, so the table below records the documented relationships rather than claiming outside adoption.

| Organisation | Relationship | Source |
| --- | --- | --- |
| Microsoft (Azure Upstream) | Created Dalec and uses it internally for compliance builds (signed packages, SBOMs, provenance) | [Microsoft Community Hub blog](https://techcommunity.microsoft.com/blog/linuxandopensourceblog/dalec-declarative-package-and-container-builds/4465290) |
| CNCF | Hosts Dalec as a Sandbox project since 2025-10-08 | [CNCF project page](https://www.cncf.io/projects/dalec/) |

## Adoption signals

Because named external adopters are not citable, the measurable signals matter more here. As of 2026-06-26 (GitHub REST API): 310 stars, 54 forks, roughly 38 contributors, 95 open issues, and 12 watchers. The latest release is `v0.21.2` (2026-06-25), and the `v0.21.x` line shows an active release cadence. The maintainer set is entirely Microsoft (Brian Goff, Jeremy Rickard, Peter Engelbert, with Sertac Ozercan emeritus per `MAINTAINERS.md`), so the project is single-vendor today; the move to a neutral CNCF org has not yet translated into a cross-vendor maintainer base. That concentration is the main governance risk to weigh (sources: GitHub API, `MAINTAINERS.md`, CNCF project page).

## Ecosystem

Dalec is built on BuildKit's frontend mechanism: a spec becomes LLB, and any BuildKit (local Docker, `buildx`, CI) solves it, so its runtime dependency is Docker/BuildKit rather than a dedicated service (moby/buildkit; Docker frontend docs). On output it targets native distro packaging: RPM for Azure Linux, AlmaLinux, and Rocky Linux, and DEB for Debian and Ubuntu, plus Windows targets (`targets/`). For supply chain metadata it produces SBOMs and provenance and can sign packages, which places it alongside SBOM/provenance standards like in-toto and SLSA and signing efforts like the Notary Project and Sigstore. In the minimal-CVE-container space it is adjacent to Copa (copacetic), another Microsoft-origin project.

## Alternatives

Dalec's distinction is that it builds native distro packages from source, tests them, and assembles a minimal signed and attested container, all from one YAML spec running through plain `docker build`. The alternatives each cover part of that span.

| Alternative | Differs by |
| --- | --- |
| nfpm | Assembles a DEB/RPM/APK from already-built artifacts; it does not build from source, test, containerize, or attest |
| GoReleaser | Release orchestrator that calls nfpm/BuildKit internally; its scope is release automation, not source builds of native distro packages |
| Plain Dockerfile / Buildx Bake | General image building; you write the RPM `.spec`, the `debian/` directory, or custom scripts yourself, which Dalec replaces with one YAML spec |
| OpenSUSE Build Service (OBS) | Hosted multi-distro build service; Dalec is a client-side frontend that runs to completion in local or CI Docker instead |

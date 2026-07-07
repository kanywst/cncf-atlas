# Dalec

> Dalec is a Docker BuildKit frontend that turns one declarative YAML spec into native RPM/DEB packages and minimal, signed, SBOM-attested containers, using only Docker.

- **Category**: Supply Chain
- **CNCF maturity**: Sandbox (accepted 2025-10-08)
- **Language**: Go (`go 1.25.9`)
- **License**: Apache-2.0
- **Repository**: [project-dalec/dalec](https://github.com/project-dalec/dalec)
- **Documented at commit**: `0d888c2` (main, 2026-06-26, near tag `v0.21.2`)

## What it is

Dalec is a build frontend for Docker BuildKit. BuildKit is the build engine inside modern Docker, and it drives builds from a graph called LLB (Low-Level Build, BuildKit's intermediate representation). A frontend is a program that reads a build definition and emits that LLB graph for BuildKit to execute. A Dockerfile is one such definition handled by the built-in frontend. Dalec provides a different one: instead of a Dockerfile it reads a single YAML spec.

From that one spec, Dalec runs the whole chain: fetch sources, build them, produce a native Linux package (an RPM for Azure Linux, AlmaLinux, or Rocky Linux; a DEB for Debian or Ubuntu), run tests against it, and assemble a minimal container image with the package installed. It can also sign the packages and attach SBOM and provenance attestations. The only tool a user needs is `docker build`. There is no separate build server, no `rpmbuild` or `dpkg` on the host, and no custom shell scripts to write.

Dalec came out of Microsoft's Azure Upstream team, which needed reproducible builds that satisfy internal compliance rules: signed packages, SBOMs, and provenance. It sits between a project's source and a distributable artifact. Above it are the source and the spec that describes how to build; below it are the RPM/DEB package and the container image that ship.

## When to use it

- You need native distro packages (RPM or DEB) built from source, not just files copied into an image, and you want the same spec to target several distros.
- You want signing, SBOMs, and provenance attached to those artifacts as part of the build, to meet a compliance or supply chain policy.
- You want a minimal container that holds only your package and its runtime dependencies, built and tested in one pass.
- You want all of this to run through plain `docker build` in local or CI environments, with no dedicated build service.
- Not the right fit if a plain Dockerfile already gives you what you need and you do not care about native packaging, signing, or attestations.
- Not a release orchestrator: it builds and packages, it does not manage version bumps, changelog generation across a release, or publishing to registries and package repositories.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a build request flows.
- [Adoption & Ecosystem](./adoption): who builds it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working build.

## Sources

1. [project-dalec/dalec README](https://github.com/project-dalec/dalec/blob/main/README.md) (accessed 2026-06-26)
2. [dalec source at pinned commit 0d888c2](https://github.com/project-dalec/dalec) (accessed 2026-06-26)
3. [Dalec: Declarative Package and Container Builds (Microsoft Community Hub)](https://techcommunity.microsoft.com/blog/linuxandopensourceblog/dalec-declarative-package-and-container-builds/4465290) (accessed 2026-06-26)
4. [\[Sandbox\] Dalec, cncf/sandbox Issue #396](https://github.com/cncf/sandbox/issues/396) (accessed 2026-06-26)
5. [Dalec project page (CNCF)](https://www.cncf.io/projects/dalec/) (accessed 2026-06-26)
6. [Dalec documentation site](https://project-dalec.github.io/dalec/) (accessed 2026-06-26)
7. [What's new with Microsoft at KubeCon NA 2025](https://opensource.microsoft.com/blog/2025/11/10/whats-new-with-microsoft-in-open-source-and-kubernetes-at-kubecon-north-america-2025/) (accessed 2026-06-26)
8. [What's new with Microsoft at KubeCon EU 2026](https://opensource.microsoft.com/blog/2026/03/24/whats-new-with-microsoft-in-open-source-and-kubernetes-at-kubecon-cloudnativecon-europe-2026/) (accessed 2026-06-26)
9. [moby/buildkit (LLB and frontend mechanism)](https://github.com/moby/buildkit) (accessed 2026-06-26)
10. [Docker BuildKit custom frontend syntax](https://docs.docker.com/build/buildkit/frontend/) (accessed 2026-06-26)
11. [GitHub REST API repos/project-dalec/dalec](https://api.github.com/repos/project-dalec/dalec) (accessed 2026-06-26)

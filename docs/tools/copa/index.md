# Copacetic

> Copacetic (Copa) patches known vulnerabilities in an existing container image by applying only the fixed packages as a new layer, driven by a scanner report, without rebuilding the image from its Dockerfile.

- **Category**: Security & Compliance
- **CNCF maturity**: Sandbox (accepted 2023-09-19)
- **Language**: Go (`go 1.25.11`)
- **License**: Apache-2.0
- **Repository**: [project-copacetic/copacetic](https://github.com/project-copacetic/copacetic)
- **Documented at commit**: `0f6f0ab` (main, 2026-06-24)

## What it is

Copacetic is a command-line tool that patches a container image in place. It reads a vulnerability report from a scanner such as Trivy, resolves the fixed package versions, downloads only those packages, and uses BuildKit to write them into the image as an additional layer. The result is a new image tag whose vulnerable OS packages are updated, produced without access to the original Dockerfile or build context (`src/README.md:38-42`).

The project states three design goals: patch an existing image as-is rather than requiring a rebuild, cooperate with the scanner and package-manager ecosystems that already exist rather than replacing them, and let someone who is not the image publisher (a platform or security team) apply the patch (`src/README.md:46-54`). The CLI itself is small: a `patch` command and a `generate` command wired through Cobra (`src/main.go:42-43`). The heavy lifting is delegated to BuildKit, the build engine behind Docker, which solves the patched image as a build graph.

Copacetic is for teams that receive images they did not build and are told to keep them free of known CVEs. Waiting for an upstream base-image rebuild can take days; re-running `apt upgrade` in a fork of the Dockerfile is not possible when there is no Dockerfile. Copa targets that gap by turning a scanner report into a minimal patch layer.

## When to use it

- You run images you did not build and need to remediate OS-package CVEs quickly, before the publisher ships a new base image.
- You want the patch to be a small additive layer so the rest of the image cache stays intact.
- You want remediation driven by a scanner report so only the flagged packages are touched.
- You need to patch distroless or shell-less images where you cannot run a package manager inside the image.
- Not the right fit if you control the Dockerfile and can simply rebuild on an updated base: that gives a cleaner result than layering patches.
- Not a scanner. Copa consumes a report from Trivy or another scanner; it does not find the vulnerabilities itself.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a patch flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working patch.

## Sources

1. [project-copacetic/copacetic (GitHub)](https://github.com/project-copacetic/copacetic) (accessed 2026-06-28)
2. [Copacetic README](https://github.com/project-copacetic/copacetic/blob/main/README.md) (accessed 2026-06-28)
3. [Copacetic source at pinned commit 0f6f0ab](https://github.com/project-copacetic/copacetic/tree/0f6f0ab2c3ee4590530a621094502047fad127cf) (accessed 2026-06-28)
4. [Releases](https://github.com/project-copacetic/copacetic/releases) (accessed 2026-06-28)
5. [CNCF project page: Copa](https://www.cncf.io/projects/copa/) (accessed 2026-06-28)
6. [CNCF Sandbox onboarding issue #152](https://github.com/cncf/sandbox/issues/152) (accessed 2026-06-28)
7. [CNCF Sandbox application issue #41](https://github.com/cncf/sandbox/issues/41) (accessed 2026-06-28)
8. [Microsoft Open Source: Project Copacetic](https://opensource.microsoft.com/blog/2024/09/18/project-copacetic-quick-and-efficient-container-image-patching/) (accessed 2026-06-28)
9. [Copacetic adopters page](https://project-copacetic.github.io/copacetic/website/adopters) (accessed 2026-06-28)
10. [Copacetic installation docs](https://project-copacetic.github.io/copacetic/website/installation) (accessed 2026-06-28)
11. [Copacetic quick start](https://project-copacetic.github.io/copacetic/website/quick-start) (accessed 2026-06-28)
12. [project-copacetic/copa-action (GitHub Action)](https://github.com/project-copacetic/copa-action) (accessed 2026-06-28)

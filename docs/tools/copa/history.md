# History

## Origin

Copacetic started at Microsoft and is maintained by the Microsoft Open Source team ([Microsoft Open Source blog, 2024-09-18](https://opensource.microsoft.com/blog/2024/09/18/project-copacetic-quick-and-efficient-container-image-patching/)). The GitHub repository was created on 2023-01-11 (GitHub `createdAt`). The problem it set out to solve is the lag between a CVE being fixed upstream and that fix reaching a running image: the conventional answer is to wait for a new base image and rebuild, which the image consumer does not control. Copa was built so that the party running an image, not only the party that published it, could apply the package fix directly.

## Timeline

| Year | Milestone |
| --- | --- |
| 2023 | Repository created (2023-01-11); applied to and accepted into the CNCF Sandbox (accepted 2023-09-19) |
| 2024 | Docker Desktop Extension announced, exposing scan/tag/patch to users without the command line |
| 2026 | `v0.14.x` line adds local OCI output (`--oci-dir`), end-of-life checks (`--exit-on-eol`), and single-layer re-patching |

## How it evolved

The project entered the CNCF Sandbox in 2023. The application was filed as [cncf/sandbox issue #41](https://github.com/cncf/sandbox/issues/41), and onboarding was tracked in [issue #152](https://github.com/cncf/sandbox/issues/152), which also records the short name Copa alongside the original name Copacetic. The repository still uses `copacetic`; the CNCF listing uses Copa ([CNCF project page](https://www.cncf.io/projects/copa/)).

In 2024 the project added a Docker Desktop Extension so that scanning, tagging, and patching could be done without the CLI, widening the audience beyond command-line users ([Microsoft Open Source blog](https://opensource.microsoft.com/blog/2024/09/18/project-copacetic-quick-and-efficient-container-image-patching/)). More recent `v0.14.x` releases moved beyond the original report-driven single-image flow: `--oci-dir` writes the patched image to a local OCI layout instead of a container runtime, `--exit-on-eol` with `--eol-api-url` flags images built on end-of-life distributions, and re-patching an already-patched image now collapses into a single layer instead of stacking ([releases](https://github.com/project-copacetic/copacetic/releases)).

## Where it stands now

Copacetic is an active CNCF Sandbox project under Microsoft Open Source stewardship, with an open governance model in the repository. The documented commit `0f6f0ab` (2026-06-24) sits on `main` ahead of the most recent tagged release `v0.14.1` (2026-05-18), targets Go 1.25, and carries the OpenSSF Best Practices and Scorecard badges (`src/README.md:5-6`). Development continues on multi-platform patching and experimental language-package patching (see [Internals](./internals)).

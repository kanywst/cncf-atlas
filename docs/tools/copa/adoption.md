# Adoption & Ecosystem

## Who uses it

The organizations below are listed on the project's [adopters page](https://project-copacetic.github.io/copacetic/website/adopters) (accessed 2026-06-28). They are split by how they integrate Copa: as a CLI called from another tool, or through the GitHub Action. This deep-dive lists only what that page cites and does not add others.

| Organisation | Use case | Source |
| --- | --- | --- |
| Kubescape | Patches images via Copa, using Grype for the scan step | [adopters page](https://project-copacetic.github.io/copacetic/website/adopters) |
| Devtron | Copacetic plugin in its CI/CD pipelines | [adopters page](https://project-copacetic.github.io/copacetic/website/adopters) |
| Helmper | Patches images referenced inside Helm charts | [adopters page](https://project-copacetic.github.io/copacetic/website/adopters) |
| Verity | Uses the Copa CLI | [adopters page](https://project-copacetic.github.io/copacetic/website/adopters) |
| AKS Periscope, Azure Workload Identity, AI Kit, Unoplat | Use the Copa GitHub Action | [adopters page](https://project-copacetic.github.io/copacetic/website/adopters) |

## Adoption signals

As of 2026-06-28 (`gh repo view project-copacetic/copacetic`): 1,652 stars and 120 forks. The GitHub contributors API paginates to roughly 48 contributors. The project is a CNCF Sandbox project (accepted 2023-09-19) and displays the OpenSSF Best Practices badge (project 8031) and an OpenSSF Scorecard badge in its README (`src/README.md:5-6`). Releases are tagged regularly, with `v0.14.1` on 2026-05-18 and the documented commit `0f6f0ab` on `main` after it.

## Ecosystem

Copa sits between a scanner and a container runtime or registry. Its built-in report parser handles Trivy; other scanners integrate through `copa-<scanner>` plugin binaries, which is how Grype-based flows work (`src/pkg/report/report.go:52-55`). Around the core CLI the project ships [copa-action](https://github.com/project-copacetic/copa-action) for GitHub Actions and a Docker Desktop Extension for a GUI flow. On output it can load into Docker or Podman, push to a registry, or write a local OCI layout, and it emits OpenVEX documents describing what it patched.

## Alternatives

Copa's distinction is that it patches an existing image as an additive layer, driven by a scanner report, and can be run by someone who is not the image publisher.

| Alternative | Differs by |
| --- | --- |
| Rebuild on an updated base image | Produces a clean image but requires the Dockerfile and build context and controlling the publish pipeline; Copa patches when you have neither |
| Chainguard / Wolfi images | Remediate by shipping a freshly rebuilt minimal base rather than patching an existing image; Copa extends the life of an image already in use (`src/README.md:29-54`) |
| `apt upgrade` in a derived Dockerfile | Updates every outdated package and rebuilds the layer; Copa touches only the packages the scanner flagged and keeps the change to one layer |

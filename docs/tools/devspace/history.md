# History

## Origin

DevSpace comes from Loft Labs, a company founded in 2019 that builds Kubernetes developer tooling and also authors vcluster (virtual clusters). The GitHub repository was created on 2018-08-17, before the company itself, and the first public release, `v1.0.2`, shipped on 2018-09-17 (GitHub repository metadata and Releases). The idea from the start was to let developers work directly against Kubernetes instead of approximating the cluster locally. The pitch in the README has stayed consistent: declare the build, deploy, and dev workflow once in a `devspace.yaml` that the team shares through git, and use two-way file sync to hot-reload a running container without rebuilding its image or restarting it.

## Timeline

| Year | Milestone |
| --- | --- |
| 2018 | GitHub repository created (2018-08-17); first release `v1.0.2` (2018-09-17) |
| 2019 | Loft Labs founded as the commercial steward |
| 2022 | v6 rewrite introduces Pipelines and config version `v2beta1`; donated to CNCF Sandbox (accepted 2022-12-13) |
| 2026 | Active `v6.4.x` line; documented here at `8ff6260`, near tag `v6.4.0-rc.1` |

## How it evolved

The largest change in the project's life is the v6 rewrite in 2022. Before v6, the built-in workflows (dev, build, deploy, purge) were hard-coded sequences, and the way to adjust them was to bolt on hooks around fixed steps. v6 replaced that with Pipelines: each workflow became a POSIX shell script that runs on an embedded shell interpreter, with DevSpace-specific commands (`build_images`, `create_deployments`, `start_dev`, and so on) available as built-ins inside that script. A user can now override an entire workflow in `devspace.yaml` rather than working around a fixed one. The same release moved the config schema to `v2beta1` and added imports (pulling configuration from another `devspace.yaml`) and an injected SSH server (DevSpace 6 announcement; Pipelines docs; v6.0.0 release notes).

The other shift is governance. On 2022-12-13 the CNCF TOC accepted DevSpace as a Sandbox project, donated by Loft Labs. The company framed the move as keeping its role as a leading contributor while handing governance to the Linux Foundation and the wider community, and noted the context that dozens of Kubernetes developer tools existed but almost none were CNCF-hosted at the time (The New Stack; Loft Labs blog; BusinessWire; ComputerWeekly). A visible artifact of that transition is the split between the repository and the Go module path: the code now lives at `devspace-sh/devspace`, while `go.mod` still declares the module as `github.com/loft-sh/devspace` to avoid breaking every import that depends on it (`go.mod:1`).

## Where it stands now

DevSpace is an active CNCF Sandbox project. By the documented commit it had shipped 312 releases, with the `v6.4.x` line current and `v6.4.0-rc.1` the latest tag (GitHub Releases). The pinned commit `8ff6260` sits 12 commits past that tag (`git describe` reports `v6.4.0-rc.1-12-g8ff62607`). Loft Labs remains the primary steward, and the project keeps the Pipelines model from v6 as its core design. The [Adoption](./adoption) page is candid that named organizational adopters are thin: there is no ADOPTERS file and the CNCF project page lists none, so the honest signals are the GitHub and DevStats numbers rather than a roster of companies.

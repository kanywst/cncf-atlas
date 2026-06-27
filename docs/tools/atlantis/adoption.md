# Adoption & Ecosystem

## Who uses it

The cited adopters are the organisations listed in the project's `ADOPTERS.md` at the pinned commit (source 8). No broader CNCF case studies are claimed here, so the table is limited to what that file states.

| Organisation | Use case | Source |
| --- | --- | --- |
| [Lambda](https://lambda.ai) | Orchestrating self-service infrastructure for Lambda's internal platform | [ADOPTERS.md](https://github.com/runatlantis/atlantis/blob/main/ADOPTERS.md) |
| [Rapid7](https://www.rapid7.com/) | Per-project Atlantis installations in Kubernetes orchestrating all Terraform deployments for teams | [ADOPTERS.md](https://github.com/runatlantis/atlantis/blob/main/ADOPTERS.md) |
| [CloudScript](https://www.cloudscript.com.br/) | Multi-cloud Kubernetes platform standardisation across enterprise clients | [ADOPTERS.md](https://github.com/runatlantis/atlantis/blob/main/ADOPTERS.md) |
| [Vend](https://vend.com/) | Infrastructure for multiple teams across multiple cloud providers | [ADOPTERS.md](https://github.com/runatlantis/atlantis/blob/main/ADOPTERS.md) |

The original launch post records the early Hootsuite usage as a historical data point: 78 contributors and 144 Terraform repositories, with Atlantis used for every Terraform change at the company (source 2).

## Adoption signals

Measured from `gh repo view` on 2026-06-26 against the pinned commit: 9,155 stars and 1,285 forks. The license reported by the GitHub API is `apache-2.0`, and the repository was created on 2018-02-06. The project carries an OpenSSF (Open Source Security Foundation) Best Practices badge, linked from the README. Maintainership is shared across companies: `MAINTAINERS.md` lists Dylan Page (Lambda), PePe Amengual (Slalom), and Rui Chen (Meetup) as Maintainers, plus several Core Contributors (source 14). The project is a CNCF Sandbox project, accepted 2024-06-18 (source 6).

## Ecosystem

Atlantis integrates rather than replaces. On the VCS side it supports GitHub, GitLab, Gitea (including Forgejo), Bitbucket Cloud and Server, and Azure DevOps. On the engine side it runs both Terraform and OpenTofu, selectable with `terraform_distribution: opentofu`. The custom Docker image plus the `run` workflow step is the standard way to bolt on adjacent tools: Terragrunt for DRY configuration (source 11), Conftest or Open Policy Agent Rego in a `policy_check` step, and Infracost for cost estimates. The pairing with OpenTofu is documented as a first-class path (source 12).

## Alternatives

Atlantis is the self-hosted, state-free end of the spectrum: it automates the pull request and leaves state, policy, and drift detection to your own backend and tools. The commercial TACOS products bundle those concerns.

| Alternative | Differs by |
| --- | --- |
| Spacelift | Commercial TACOS with built-in OPA policy stages, a private module registry, drift detection, and stack dependencies; Atlantis leaves these to you (source 9). |
| env0 | SaaS-centric TACOS whose signature feature is TTL-bounded ephemeral environments (source 9). |
| Digger (OpenTaco) | Open source; runs Terraform inside your existing CI (GitHub Actions, GitLab CI) so secrets stay in the CI runner. Rebranded to OpenTaco in 2025-11 (source 10). |
| HashiCorp HCP Terraform / Scalr | Managed state plus execution; Atlantis holds no state and defers to the user's backend. |
| Terragrunt | Not a competitor; commonly used together by calling it from an Atlantis `run` step (source 11). |

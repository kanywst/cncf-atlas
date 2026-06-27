# Atlantis

> A server that runs Terraform and OpenTofu from pull request comments, so infrastructure changes are planned and applied in the open before merge.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [runatlantis/atlantis](https://github.com/runatlantis/atlantis)
- **Documented at commit**: `b7cea53` (main, 2026-06-25; just after release `v0.44.0`)

## What it is

Atlantis is a self-hosted HTTP server that sits between a version control system (VCS) and the Terraform or OpenTofu binary. It listens for webhooks from GitHub, GitLab, Gitea, Bitbucket, and Azure DevOps. When someone opens a pull request or writes a comment like `atlantis plan` or `atlantis apply`, Atlantis clones the repository, runs the matching Terraform command on its own disk, and writes the output back as a comment on the pull request.

The execution model is server-side. The Terraform state stays in the backend the user already configured (for example an S3 bucket or a remote backend); Atlantis itself only persists locks and plan metadata. This is what makes the "apply before merge" workflow safe for a team: a plan is reviewed in the pull request, an apply runs against real infrastructure while the change is still open, and a lock prevents two pull requests from touching the same project at once.

Atlantis is for teams that already keep Terraform in Git and want a shared, auditable way to run it without handing every engineer production credentials. It is not a state backend, not a module registry, and not a managed SaaS. It is the automation layer that turns pull request comments into Terraform runs.

## When to use it

- You keep Terraform or OpenTofu in Git and want plan and apply to happen on the pull request, reviewed by the team.
- You want to centralise the credentials and the Terraform binary on one server instead of on every developer laptop.
- You need locking so two pull requests cannot run against the same project and workspace at the same time.
- You want to self-host the automation and keep state in your own backend rather than a vendor's.

It is a weaker fit when you want a managed service with state storage, drift detection, and a policy engine all built in; a commercial Terraform Automation and Collaboration Software (TACOS) product fits that case better. It is also not the tool if you do not use a supported VCS, since the entire trigger model is webhook and comment driven.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. runatlantis/atlantis source, pinned at commit `b7cea53`: <https://github.com/runatlantis/atlantis>
2. Introducing Atlantis (Luke Kysow, Medium): <https://medium.com/runatlantis/introducing-atlantis-6570d6de7281>
3. Moving Atlantis to runatlantis/atlantis (Medium): <https://medium.com/runatlantis/moving-atlantis-to-runatlantis-atlantis-on-github-4efc025bb05f>
4. Sandbox proposal, cncf/sandbox#60: <https://github.com/cncf/sandbox/issues/60>
5. TAG App Delivery review, cncf/tag-app-delivery#474: <https://github.com/cncf/tag-app-delivery/issues/474>
6. Atlantis CNCF project page: <https://www.cncf.io/projects/atlantis/>
7. Atlantis documentation site: <https://www.runatlantis.io>
8. ADOPTERS.md at pin `b7cea53`: <https://github.com/runatlantis/atlantis/blob/main/ADOPTERS.md>
9. Spacelift: Atlantis alternatives: <https://spacelift.io/blog/atlantis-alternatives>
10. Digger: why OpenTaco: <https://digger.dev/whyopentaco>

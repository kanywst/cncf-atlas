# Devfile

> Devfile is a YAML standard for declaring a cloud development workspace, with the specification defined as Go types in the `devfile/api` repository and every other artifact (CRDs, JSON schemas, a TypeScript model) generated from them.

- **Category**: Developer Tools
- **CNCF maturity**: Sandbox (accepted 2022-01-11)
- **Language**: Go (`go 1.24`)
- **License**: Apache-2.0
- **Repository**: [devfile/api](https://github.com/devfile/api)
- **Documented at commit**: `368ea4e` (near tag `v2.3.0`, `git describe` = `v2.3.0-17-g368ea4e`)

## What it is

A devfile is a single YAML file that describes a development environment: the containers a developer works in, where the source comes from, and the commands that build, run, and debug the code. A tool that understands the format reads the file and stands up a reproducible workspace from it. The idea is to keep the environment definition next to the code, so anyone who opens the project gets the same setup.

The `devfile/api` repository is the specification itself, not a tool a developer runs directly. It defines the format as Go types under `pkg/apis/workspaces/v1alpha2/`, and the README states plainly that these Go sources are the origin from which the Kubernetes CRDs, the JSON schemas, and the npm TypeScript model are all generated (`README.md:11-24`). The devfile 2.x format is a subset of a Kubernetes API called `DevWorkspace` that this repository also defines, so the file format and the cluster resource share one set of types.

Alongside the type definitions, `devfile/api` ships a small runtime library: utilities that apply a parent devfile or a plugin as an override, merge inherited content, normalize discriminated unions, and validate a devfile's internal references. It does not contain the full parser. Reading a `devfile.yaml`, resolving its `parent`, and fetching stacks from a registry live in a separate repository, `devfile/library`. This page and the ones that follow read from `devfile/api` at commit `368ea4e`.

## When to use it

- You run a cloud or remote development platform (something Eclipse Che, OpenShift Dev Spaces, or a CLI like odo powers) and want a standard, tool-neutral way for projects to declare their workspace.
- You want the workspace definition to live in the repository as code, so onboarding does not depend on a wiki page or a laptop setup script.
- You are building tooling and want to consume the format from Go (the API types and the override/merge/validate helpers) or from TypeScript (the `@devfile/api` npm package generated from the schema).
- Less of a fit if you only need a local container to open in an editor: Development Containers (`devcontainer.json`) target that case and are what VS Code and GitHub Codespaces read.
- Not a package or shell environment manager: Nix, devbox, and flox reproduce toolchains at a different layer and do not orchestrate an IDE workspace.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how an override flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): write a devfile and run the override library.

## Sources

1. [devfile/api README](https://github.com/devfile/api/blob/main/README.md) (accessed 2026-07-08)
2. [devfile/api source at pinned commit 368ea4e](https://github.com/devfile/api/tree/368ea4e93a4c9b772240eefc80b2ac24e42c5ee2) (accessed 2026-07-08)
3. [Devfile project page (CNCF)](https://www.cncf.io/projects/devfile/) (accessed 2026-07-08)
4. [devfile.io documentation](https://devfile.io/docs/2.3.0/what-is-a-devfile) (accessed 2026-07-08)
5. [Kubernetes union types KEP](https://github.com/kubernetes/enhancements/blob/master/keps/sig-api-machinery/20190325-unions.md) (accessed 2026-07-08)
6. [Amazon CodeCatalyst devfile documentation](https://docs.aws.amazon.com/codecatalyst/latest/userguide/devenvironment-devfile.html) (accessed 2026-07-08)
7. [Red Hat OpenShift Dev Spaces](https://developers.redhat.com/products/openshift-dev-spaces/overview) (accessed 2026-07-08)
8. [GitHub REST API repos/devfile/api](https://api.github.com/repos/devfile/api) (accessed 2026-07-08)

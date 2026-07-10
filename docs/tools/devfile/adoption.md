# Adoption & Ecosystem

## Who uses it

Devfile is a specification, so its adoption sits with the tools that implement it rather than with users of one repository. `devfile/api` has no `ADOPTERS` file. The named implementers below each carry a citable source; where a project only implements a subset of the spec, the note says so.

| Organisation | Use case | Source |
| --- | --- | --- |
| Amazon (CodeCatalyst) | Dev Environments were configured with a devfile; CodeCatalyst has stopped accepting new customers, and existing use continues per AWS notice | [AWS CodeCatalyst devfile docs](https://docs.aws.amazon.com/codecatalyst/latest/userguide/devenvironment-devfile.html) |
| Red Hat (OpenShift Dev Spaces / Eclipse Che) | Defines developer environments in the devfile format; the DevWorkspace operator is the Che runtime | [OpenShift Dev Spaces overview](https://developers.redhat.com/products/openshift-dev-spaces/overview) |
| Red Hat (odo) | CLI whose workflows are driven by a devfile | [devfile.io documentation](https://devfile.io/docs/2.3.0/what-is-a-devfile) |
| JetBrains (Space Cloud Dev) | Sets up a remote development environment tied to a Git repository from a devfile | [devfile.io documentation](https://devfile.io/docs/2.3.0/what-is-a-devfile) |

The devfile.io site lists AWS, IBM, JetBrains, and Red Hat as contributing organizations, and `MAINTAINERS.md` names maintainers affiliated with Red Hat and AWS.

## Adoption signals

Because devfile is a spec, the star count on `devfile/api` understates its reach: the weight is in the implementations (Che, Dev Spaces, CodeCatalyst, odo), not in one repository's popularity. As of 2026-07-08 (GitHub REST API), `devfile/api` has 340 stars, 77 forks, and 26 open issues, with about 30 contributors counted across the paginated contributors list. The CNCF project page reported 46 contributing organizations, down 30 percent year over year at the same observation date. Releases have been roughly annual, with `v2.3.0` (2024-06) the current schema version in the tree (`schemas/latest/jsonSchemaVersion.txt`).

## Ecosystem

The devfile ecosystem is spread across the `devfile` GitHub organization, one repository per concern.

- `devfile/library`: the Go parser that reads a `devfile.yaml`, resolves its `parent`, and pulls from a registry. This is what `devfile/api` deliberately does not contain.
- `devfile/registry` and `devfile/registry-support`: the registry that publishes reusable devfile stacks and samples.
- `devfile/devworkspace-operator`: the Kubernetes controller that reconciles a `DevWorkspace` into a running environment; it is the runtime under Eclipse Che.
- `devfile/alizer`: source analysis that detects a project's language and framework and proposes a devfile.
- `@devfile/api`: the npm TypeScript model generated from the JSON schema, for JavaScript and TypeScript tooling.

## Alternatives

Devfile targets remote and cloud development workspaces defined as a Kubernetes-native resource. The main alternatives overlap but come from a different starting point.

| Alternative | Differs by |
| --- | --- |
| Development Containers (`devcontainer.json`) | The de facto standard for VS Code and GitHub Codespaces; describes a container to open locally or in Codespaces rather than a Kubernetes `DevWorkspace` reconciled on a server |
| Gitpod `.gitpod.yml` | Gitpod's own workspace definition, tied to Gitpod rather than a tool-neutral CRD |
| DevPod (Loft) | Stands up environments from `devcontainer.json` across providers; provider-agnostic but built on the devcontainer format, not devfile |
| Nix / devbox / flox | Declarative environments at the package and shell layer; they reproduce toolchains, they do not orchestrate an IDE workspace on a cluster |

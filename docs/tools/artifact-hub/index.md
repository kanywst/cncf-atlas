# Artifact Hub

> A CNCF-hosted web application that indexes Cloud Native packages so you can find, install, and publish them across more than two dozen artifact kinds, without hosting the artifacts itself.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Incubating
- **Language**: Go (backend), TypeScript + React (web)
- **License**: Apache-2.0
- **Repository**: [artifacthub/hub](https://github.com/artifacthub/hub)
- **Documented at commit**: `0d8b1c0` (after tag v1.22.0, author date 2026-05-12)

## What it is

Artifact Hub is a search and discovery layer for Cloud Native artifacts. It indexes packages from registered repositories, normalizes their metadata, and serves search, filtering, and detail pages through a web UI and HTTP API. It does not store the artifacts. Each package page links back to the original source, and install instructions point at the publisher's registry or repository.

The backend is written in Go and ships as four binaries: `hub` (the HTTP API server), `tracker` (the indexer), `scanner` (vulnerability reporting), and `ah` (a CLI). A large part of the business logic lives in PostgreSQL PL/pgSQL functions, which the Go layer calls by passing JSON. The web frontend is a React single-page application that talks to the `hub` API.

The project supports more than twenty artifact kinds, including Helm charts, OLM operators, Tekton tasks and pipelines, Krew plugins, Falco rules, OPA and Gatekeeper policies, Kyverno policies, KEDA scalers, and Backstage plugins. The public instance at `artifacthub.io` is run by the CNCF.

## When to use it

- You publish a Cloud Native artifact (a Helm chart, an OLM operator, a Tekton task) and want it discoverable in one place that CNCF users already search.
- You consume artifacts and want a single search surface with security scan results, signatures, and version history instead of crawling many separate hubs.
- You want to run an internal index of your organization's repositories, deployed from the official Helm chart.

It is a weaker fit when you need to actually host or serve the artifact bytes. Artifact Hub indexes and links, so a registry such as an OCI registry or Harbor still does the hosting.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [artifacthub/hub source, pinned at `0d8b1c0`](https://github.com/artifacthub/hub)
2. [README (artifacthub/hub)](https://github.com/artifacthub/hub/blob/master/README.md)
3. [architecture.md (artifacthub/hub)](https://github.com/artifacthub/hub/blob/master/docs/architecture.md)
4. [Repositories guide (Artifact Hub docs)](https://artifacthub.io/docs/topics/repositories/)
5. [Artifact Hub becomes a CNCF incubating project (CNCF)](https://www.cncf.io/blog/2024/09/17/artifact-hub-becomes-a-cncf-incubating-project/)
6. [Artifact Hub project page (CNCF)](https://www.cncf.io/projects/artifact-hub/)
7. [CNCF Artifact Hub, a One-Stop Shop for Cloud Native Config (The New Stack)](https://thenewstack.io/cncf-artifact-hub-a-one-stop-shop-for-cloud-native-config/)
8. [Release v1.22.0 (artifacthub/hub)](https://github.com/artifacthub/hub/releases/tag/v1.22.0)

# Distribution

> Distribution is the open-source registry that stores and serves container images and other OCI artifacts, and the core library that many public registries are built on.

- **Category**: Container Registry
- **CNCF maturity**: Sandbox (accepted 2021-01-26)
- **Language**: Go (`go 1.25.0`)
- **License**: Apache-2.0
- **Repository**: [distribution/distribution](https://github.com/distribution/distribution)
- **Documented at commit**: `472c9d38` (main, 2026-06-19, one commit after tag `v3.1.1`)

## What it is

Distribution is a container registry: a server that stores container images and other OCI artifacts and hands them to clients over HTTP. When `docker pull` or `docker push` talks to a registry, it speaks the protocol this project implements. The `registry` component is an implementation of the OCI Distribution Specification, the standard that grew out of the earlier Docker Registry HTTP API V2 (README; OCI Distribution Specification).

The project is as much a library as a server. Its README describes it as a core library for many registry operators, including Docker Hub, GitHub Container Registry, GitLab Container Registry, and DigitalOcean Container Registry, as well as the CNCF Harbor Project and VMware Harbor Registry (README). The code is structured so that a team can build a larger registry product on top of it: the storage backend, the HTTP layer, and the storage drivers are separable pieces rather than one monolith.

On its own, Distribution is deliberately thin. It stores and serves content and does the content-addressable bookkeeping that makes that safe and space-efficient. It does not ship a full authentication system, vulnerability scanning, or a web UI. Products like Harbor add those on top. Distribution sits at the bottom of that stack: the piece that actually holds the bytes.

## When to use it

- You need a private registry to store and serve your own images, run with plain `docker run`, and back it with a filesystem or an object store (S3, GCS, Azure Blob).
- You are building a registry product or service and want a spec-conformant core to build on rather than implementing the OCI Distribution protocol yourself.
- You want images served directly from object storage at scale, with the registry redirecting clients to the backing store instead of proxying every byte.
- Not the right fit on its own if you need built-in RBAC, vulnerability scanning, image signing policy, replication, or a UI: reach for Harbor (which is built on Distribution) or a managed registry instead.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a pull flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working registry.

## Sources

1. [distribution/distribution README](https://github.com/distribution/distribution/blob/main/README.md) (accessed 2026-07-08)
2. [Distribution project page (CNCF)](https://www.cncf.io/projects/distribution/) (accessed 2026-07-08)
3. [Donating Docker Distribution to the CNCF (Docker blog)](https://www.docker.com/blog/donating-docker-distribution-to-the-cncf/) (accessed 2026-07-08)
4. [Docker Distribution Gets a Home at the CNCF (The New Stack)](https://thenewstack.io/this-week-in-programming-docker-distribution-gets-a-home-at-the-cncf/) (accessed 2026-07-08)
5. [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec) (accessed 2026-07-08)
6. [HTTP API V2 (CNCF Distribution docs)](https://distribution.github.io/distribution/spec/api/) (accessed 2026-07-08)
7. [Distribution Registry documentation](https://distribution.github.io/distribution/) (accessed 2026-07-08)
8. [goharbor/harbor](https://github.com/goharbor/harbor) (accessed 2026-07-08)
9. [distribution source at pinned commit 472c9d38](https://github.com/distribution/distribution/tree/472c9d38c9fc523599f37ca3207279e5ab10f74f) (accessed 2026-07-08)
10. [distribution/distribution GitHub repository signals](https://github.com/distribution/distribution) (accessed 2026-07-08)

# Harbor

> An OCI registry that adds project-scoped RBAC, vulnerability scanning, replication, and signature verification on top of a plain Docker Distribution backend.

- **Category**: Supply Chain
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [goharbor/harbor](https://github.com/goharbor/harbor)
- **Documented at commit**: `6872989` (main, 2026-06-22)

## What it is

Harbor is a self-hosted registry for container images and other OCI artifacts. It does not store blobs or manifests itself. It runs a reverse proxy in front of [distribution/distribution](https://github.com/distribution/distribution) (the Docker Registry) and inserts its own gates in front of that backend: authorization, quota, immutability, signature checks, and vulnerability policy.

The added value is everything an enterprise needs around a raw registry. Multi-tenant projects with role-based access control, LDAP/AD and OIDC login, policy-driven replication between registries, scheduled vulnerability scanning, image retention and garbage collection, and a web portal. The code is three Go binaries (an API core, an async job worker, and a registry controller) plus an Angular UI.

Harbor sits between your CI/CD system and your container runtimes. CI pushes images to a Harbor project, deploy targets pull from it, and Harbor enforces who can do what and which images are allowed to ship.

## When to use it

- You need a registry you run yourself, on-premises or in a private cloud, rather than a managed cloud registry.
- You need multi-tenant isolation: many teams sharing one registry with per-project RBAC and quotas.
- You want scanning, signing, and replication built into the registry instead of bolted on around it.
- You replicate artifacts across data centers or air-gapped environments.

It is less compelling when a managed cloud registry (ECR, ACR, Artifact Registry) already covers your needs, or when you only need a single private registry with no access control, where plain Distribution is enough.

## In this deep-dive

- [History](./history): origin at VMware and the path to CNCF Graduated.
- [Architecture](./architecture): the three binaries and the proxy-plus-middleware design.
- [Adoption & Ecosystem](./adoption): cited production adopters and alternatives.
- [Internals](./internals): the image-pull path read from source.
- [Getting Started](./getting-started): install with the offline installer.

## Sources

1. [goharbor/harbor](https://github.com/goharbor/harbor) (README, ADOPTERS, LICENSE, VERSION), accessed 2026-06-22.
2. [goharbor/harbor at commit 687298935](https://github.com/goharbor/harbor/commit/687298935db944c5df68e0c3b14b410ba005cbe2), accessed 2026-06-22.
3. [Harbor on CNCF](https://www.cncf.io/projects/harbor/) (maturity dates and metrics), accessed 2026-06-22.
4. [CNCF announces Harbor Graduation](https://www.cncf.io/announcements/2020/06/23/cloud-native-computing-foundation-announces-harbor-graduation/), accessed 2026-06-22.
5. [Harbor: Enterprise-grade container registry for modern private cloud](https://www.cncf.io/blog/2025/12/08/harbor-enterprise-grade-container-registry-for-modern-private-cloud/), accessed 2026-06-22.
6. [InfoQ: Open Source Registry Harbor's Graduation](https://www.infoq.com/news/2020/06/harbor-graduation-michael/), accessed 2026-06-22.
7. [Harbor install & configuration guide](https://goharbor.io/docs/latest/install-config/), accessed 2026-06-22.
8. [gh api repos/goharbor/harbor](https://api.github.com/repos/goharbor/harbor), accessed 2026-06-22.

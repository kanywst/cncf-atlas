# OpenFGA

> A fine-grained authorization engine, modeled on Google Zanzibar, that answers "can this user do this on this object?" from relationship tuples and a declarative model.

- **Category**: Identity & Policy
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [openfga/openfga](https://github.com/openfga/openfga)
- **Documented at commit**: `9a556d8` (2026-06-18, one commit after `v1.18.0`)

## What it is

OpenFGA is a service that decides authorization questions. You give it a model (the relationship types your domain has, written in a small DSL) and a set of relationship tuples (facts such as `document:1 # viewer @ user:alice`), and it answers queries: `Check` (is this allowed?), `ListObjects`, `ListUsers`, and `Expand`. It implements the relationship-based access control (ReBAC) approach from Google's Zanzibar paper, and extends it with conditions for attribute-based checks (ABAC).

The engine is stateless. It holds no authorization data itself; tuples and models live in a pluggable datastore (in-memory, PostgreSQL, MySQL, or SQLite). That separation lets you run many OpenFGA instances behind a load balancer and scale horizontally, which is the operational shape Zanzibar-style systems are built for.

It originated inside Auth0 (later acquired by Okta) and was open-sourced in 2022. The same engine backs the commercial Auth0/Okta FGA offering, so the self-hosted project and the managed product share an implementation.

## When to use it

- You need per-object permissions ("Alice can edit this one document"), not just per-role permissions, and you want relationships to inherit (a folder grant flowing to the documents inside it).
- You want to centralize authorization decisions across services instead of re-implementing checks in each codebase.
- You want to self-host an authorization service with a clear model DSL, a Playground, a CLI, and SDKs, with the option to move to a managed offering later.

When it is not the right fit:

- Pure RBAC with a handful of static roles is simpler to keep in your own database; a dedicated authorization service adds a network hop and operational surface.
- If your policies are primarily attribute and rule expressions over request context (not relationship graphs), a policy-as-code engine like OPA/Rego or a policy language like Cedar maps more directly.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [openfga/openfga (GitHub)](https://github.com/openfga/openfga)
2. [Announcing OpenFGA, Auth0's Open Source Fine Grained Authorization System](https://auth0.com/blog/auth0s-openfga-open-source-fine-grained-authorization-system/)
3. [OpenFGA Becomes a CNCF Incubating Project](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/)
4. [OpenFGA project page (CNCF)](https://www.cncf.io/projects/openfga/)
5. [LEVEL CHANGE: OpenFGA to Incubation (cncf/toc #1949)](https://github.com/cncf/toc/issues/1949)
6. [OpenFGA documentation](https://openfga.dev/)
7. [Top 5 Google Zanzibar open-source implementations (WorkOS)](https://workos.com/blog/top-5-google-zanzibar-open-source-implementations-in-2024)

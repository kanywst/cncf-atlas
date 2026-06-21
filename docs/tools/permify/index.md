# Permify

> A Google Zanzibar-style authorization engine that resolves fine-grained access checks against relation tuples stored in PostgreSQL.

- **Category**: Identity & Policy
- **CNCF maturity**: Independent
- **Language**: Go
- **License**: AGPL-3.0
- **Repository**: [Permify/permify](https://github.com/Permify/permify)
- **Documented at commit**: `aa3a7c6` (2026-06-18, after `v1.7.1`)

## What it is

Permify is an authorization service modeled on Google's Zanzibar paper. You define a schema in its DSL, store relationships between entities as relation tuples, and ask the engine permission questions like "can user 3 view document 12". The engine answers by walking the schema tree and resolving relations recursively against the stored data.

The schema expresses RBAC, ReBAC, and ABAC in one language. Relations and permission rewrites cover role-based and relationship-based models. Attributes plus CEL rules cover attribute-based decisions in the same `Check` call. Permify exposes both gRPC and REST APIs and runs as a standalone container; PostgreSQL is the primary backing store, with an in-memory store for development.

It sits between your application and your data. The application sends authorization writes (relationships, attributes) and authorization reads (`Check`, `Expand`, `LookupEntity`, `LookupSubject`) to Permify rather than encoding access logic in application code or SQL.

## When to use it

- You need centralized fine-grained authorization shared across multiple services rather than per-service ad hoc checks.
- Your access model is relationship-heavy (ownership, hierarchies, group membership) and a static role table is not enough.
- You want RBAC, ReBAC, and ABAC in one schema and one decision path.
- You already run PostgreSQL and are comfortable making it the consistency anchor for authorization data.

When it is not the right fit:

- You need a permissive license for embedding in a closed-source network service. Permify is AGPL-3.0, so its copyleft reaches networked use.
- You want broad datastore choice (MySQL, CockroachDB, Spanner) or the most Zanzibar-faithful per-request consistency knobs. SpiceDB fits that better.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. Show HN: Permify, open-source authorization service based on Google Zanzibar (2022): <https://news.ycombinator.com/item?id=32096610>
2. Show HN: Permify 1.0 (2024): <https://news.ycombinator.com/item?id=41311489>
3. FusionAuth Acquires Permify, Unifying AuthN + AuthZ: <https://fusionauth.io/blog/fusionauth-permify-pr>
4. An Exciting New Chapter: Permify Joins FusionAuth: <https://permify.co/post/fusionauth-acquires-permify/>
5. Top 5 Google Zanzibar open-source implementations (WorkOS): <https://workos.com/blog/top-5-google-zanzibar-open-source-implementations-in-2024>
6. OpenFGA vs Permify vs SpiceDB (PkgPulse): <https://www.pkgpulse.com/guides/openfga-vs-permify-vs-spicedb-zanzibar-authorization-2026>
7. Permify/permify GitHub repository: <https://github.com/Permify/permify>

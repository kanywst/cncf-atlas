# SpiceDB

> A Google Zanzibar-inspired database that answers "can this subject do this on that resource?" by traversing a graph of relationships.

- **Category**: Identity & Policy
- **CNCF maturity**: Independent
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [authzed/spicedb](https://github.com/authzed/spicedb)
- **Documented at commit**: `4bb1d7b3` (2026-06-19)

## What it is

SpiceDB is an open-source implementation of the authorization system described in Google's 2019 Zanzibar paper. Instead of storing permissions as flat access-control lists, you store relationships between objects (for example `document:budget#viewer@user:anne`) and define a schema that derives permissions from those relationships. To make an access decision, SpiceDB walks the relationship graph rather than evaluating a static rule.

It runs as a server exposing gRPC and HTTP APIs. Clients write a schema, write relationships, then ask permission questions such as `CheckPermission`. The relationship data lives in a pluggable datastore: PostgreSQL, MySQL, CockroachDB, Google Spanner, or an in-memory store for development.

SpiceDB is built and maintained by AuthZed. It sits in the authorization layer of an application stack: the service that owns the data calls SpiceDB to decide who may see or change each object, keeping authorization logic out of the application database.

## When to use it

- You need relationship-based access control (ReBAC): permissions that follow ownership, group membership, and folder hierarchies rather than a fixed role matrix.
- You want consistency guarantees across services, using ZedToken to avoid the "New Enemy" problem where a stale read leaks data after a permission was revoked.
- You want one authorization service that several applications share, decoupled from any single application database.
- It is a poorer fit when your needs are a small fixed set of roles (a simpler RBAC library is enough), or when your decisions are pure policy-over-attributes with no relationship graph (a policy engine like OPA fits better).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [authzed/spicedb (GitHub)](https://github.com/authzed/spicedb)
2. [authzed/spicedb GitHub REST API](https://api.github.com/repos/authzed/spicedb)
3. [Starlet #17 SpiceDB (star-history)](https://www.star-history.com/blog/spicedb/)
4. [SpiceDB, the Google Zanzibar open source solution (AuthZed)](https://authzed.com/blog/spicedb-is-open-source-zanzibar)
5. [Google Zanzibar (AuthZed Docs)](https://authzed.com/docs/spicedb/concepts/zanzibar)
6. [Top 5 Google Zanzibar open-source implementations in 2024 (WorkOS)](https://workos.com/blog/top-5-google-zanzibar-open-source-implementations-in-2024)
7. [Alternatives to OpenFGA (AuthZed)](https://authzed.com/learn/openfga-alternatives)
8. [Top Alternatives to SpiceDB (Oso)](https://www.osohq.com/learn/spicedb-alternatives-authorization-tools-comparison)
9. [Google Zanzibar vs OPA (Permit.io)](https://www.permit.io/blog/zanzibar-vs-opa)
10. [SpiceDB product page (AuthZed)](https://authzed.com/spicedb)
11. [spicedb/README.md](https://github.com/authzed/spicedb/blob/main/README.md)

# ZITADEL

> An API-first, event-sourced identity and access platform that is multi-tenant from the first design, positioned between Auth0's developer experience and Keycloak's self-host control.

- **Category**: Identity & Policy
- **CNCF maturity**: Independent (not a CNCF-hosted project)
- **Language**: Go (75.8%), TypeScript (11.7%, console and login UIs)
- **License**: AGPL-3.0-only, with Apache-2.0 for `proto/` and `apps/docs/` and MIT for the login app and client SDKs
- **Repository**: [zitadel/zitadel](https://github.com/zitadel/zitadel)
- **Documented at commit**: `10087e7` (main, near tag `v4.15.2`, 2026-06-17)

## What it is

ZITADEL is a self-hostable identity provider. It issues and validates OIDC, OAuth 2.0, and SAML 2.0 tokens, manages users and their authentication factors, and answers authorization questions through an RBAC model. It ships as a single Go binary backed by PostgreSQL, and the same codebase runs both the hosted ZITADEL Cloud and self-hosted deployments.

What sets it apart from a conventional IdP is the storage model. Every state change is written as an immutable event to an event store, and read models (projections) are built from that event stream (README.md:65). The result is a complete audit trail that is part of the data model rather than a separate log, and it can be streamed to external systems through webhooks.

It targets teams that need multi-tenancy as a built-in concept. The hierarchy of Instance, Organization, Project, and Application is baked into the event layer, so tenant isolation is a property of the data rather than a convention layered on top.

## When to use it

- You need a self-hosted IdP with B2B multi-tenancy (separate organizations, delegated administration) without building that layer yourself.
- You need a tamper-evident, API-accessible audit trail of every identity change, not just a subset of logged actions.
- You want one codebase that you can self-host and also consume as SaaS with parity.
- You integrate over APIs: ZITADEL exposes every resource through gRPC, connectRPC, and HTTP/JSON from one service definition.

When it is a poor fit:

- You need ZITADEL to act as an LDAP server or RADIUS endpoint. It can federate from an external LDAP as an upstream IdP, but it does not serve LDAP or RADIUS itself. Keycloak or Authentik fit better there.
- You want a CNCF-governed project with vendor-neutral governance. ZITADEL is commercially driven and dual-licensed.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [zitadel/zitadel (GitHub)](https://github.com/zitadel/zitadel)
2. [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md)
3. [LICENSING.md](https://github.com/zitadel/zitadel/blob/main/LICENSING.md)
4. [GitHub REST repo metadata](https://api.github.com/repos/zitadel/zitadel)
5. [About ZITADEL](https://zitadel.com/about)
6. [ZITADEL raises $9 million Series A](https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a)
7. [ZITADEL v3 announcement](https://zitadel.com/blog/zitadel-v3-announcement)
8. [Moving to AGPL 3.0](https://zitadel.com/blog/apache-to-agpl)
9. [Key Changes in Version 3 (discussion #9529)](https://github.com/zitadel/zitadel/discussions/9529)
10. [Open Source in the AI Era](https://zitadel.com/blog/open-source-in-the-ai-era)
11. [CNCF Landscape](https://landscape.cncf.io/)
12. [Open Source Authentication in 2026 (skycloak)](https://skycloak.io/blog/open-source-authentication-comparison-2026/)
13. [State of Open-Source Identity 2025 (houseoffoss)](https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel)
14. [ZITADEL API introduction](https://zitadel.com/docs/apis/introduction)
15. [Self-hosting deploy with Compose](https://zitadel.com/docs/self-hosting/deploy/compose)

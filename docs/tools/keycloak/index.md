# Keycloak

> Open-source identity and access management server speaking OIDC, OAuth 2.0, and SAML for apps and services.

- **Category**: Identity & Policy
- **CNCF maturity**: Incubating
- **Language**: Java (`maven.compiler.release` 17)
- **License**: Apache-2.0
- **Repository**: [keycloak/keycloak](https://github.com/keycloak/keycloak)
- **Documented at commit**: `e733440` (2026-06-24, near tag `26.6.3`)

## What it is

Keycloak is a standalone identity provider (IdP). Applications delegate login, single sign-on, and token issuance to it instead of building their own. It speaks OpenID Connect, OAuth 2.0, and SAML 2.0, so a web app, a mobile client, or a backend service can authenticate users and obtain tokens through standard protocols.

Beyond issuing tokens, Keycloak manages the users themselves. It can store accounts in its own database, federate them from LDAP, Active Directory, or Kerberos, or broker identity from external IdPs and social logins. It also ships fine-grained Authorization Services based on User-Managed Access (UMA) 2.0 for projects that need policy-driven access decisions in one place.

The runtime is a Quarkus application. The same server runs the login flows, the admin REST API, the React-based Admin and Account consoles, and an optional Kubernetes Operator for cluster deployment.

## When to use it

- You need a full IdP with user storage, SSO, and token issuance, not just a token endpoint.
- You must integrate with enterprise directories (LDAP, Active Directory, Kerberos) or broker external and social IdPs.
- You want one server for OIDC, OAuth 2.0, and SAML rather than separate components per protocol.
- You need centralized, policy-driven authorization (UMA 2.0 Authorization Services).

It is heavier than you want when you only need a lightweight OAuth2/OIDC token server with no built-in user management; a dedicated token server is a closer fit there.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [keycloak/keycloak (GitHub)](https://github.com/keycloak/keycloak)
2. [Keycloak (CNCF project page)](https://www.cncf.io/projects/keycloak/)
3. [Keycloak joins CNCF as an incubating project](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/)
4. [Migrating to Quarkus distribution](https://www.keycloak.org/migration/migrating-to-quarkus)
5. [Keycloak 17 is out, Quarkus is now the default (n-k.de)](https://www.n-k.de/2022/02/keycloak-17-quarkus-distribution-default.html)
6. [Getting started with Keycloak on Docker](https://www.keycloak.org/getting-started/getting-started-docker)
7. [Keycloak releases](https://github.com/keycloak/keycloak/releases)
8. [ADOPTERS.md (in-repo)](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md)
9. [Keycloak (Wikipedia)](https://en.wikipedia.org/wiki/Keycloak)
10. [Best Keycloak Alternatives & Competitors 2025 (Oso)](https://www.osohq.com/learn/best-keycloak-alternatives-2025)
11. [State of Open-Source Identity 2025 (House of FOSS)](https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel)

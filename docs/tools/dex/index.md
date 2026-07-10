# Dex

> A federated OpenID Connect provider. Applications speak one protocol (OIDC) to Dex, and Dex delegates the actual authentication to an upstream identity provider such as LDAP, SAML, GitHub, or Google.

- **Category**: Identity & Policy
- **CNCF maturity**: Sandbox
- **Language**: Go (`go 1.25`)
- **License**: Apache-2.0
- **Repository**: [dexidp/dex](https://github.com/dexidp/dex)
- **Documented at commit**: `17a54e9` (v2.45.0 plus 248 commits)

## What it is

Dex is an authentication service that presents a single OpenID Connect (OIDC) face to the applications in front of it, and delegates the real authentication to some other identity provider behind it. An application integrates OIDC once. Dex then absorbs the differences between LDAP, SAML, GitHub, Google, and a dozen other upstreams through pluggable connectors.

The token Dex issues is a standard OIDC ID Token, a signed JWT. That matters because the Kubernetes API server's OIDC plugin and AWS STS can consume such a token directly. A common deployment puts Dex in front of a company directory (LDAP or SAML) so that `kubectl` and cluster dashboards can authenticate users against that directory without each of them learning the directory's protocol.

Dex holds no user database of its own. It keeps only short-lived request state and issued tokens, in a storage backend you pick: an in-memory store, a SQL database, etcd, or Kubernetes custom resources. Running on Kubernetes CRDs means Dex can operate cluster-native with no separate database.

## When to use it

- You want to give Kubernetes, or any OIDC-aware application, a single sign-on entry point backed by an existing directory (LDAP, SAML, or an OAuth2 provider like GitHub or Google).
- You are building an open-source product and want to embed an OIDC provider rather than ask every deployment to run a full identity platform. This is Dex's main habitat: Argo CD, Kubeflow, and others ship it.
- You need a small, delegating provider rather than a system of record for users.

It is a weaker fit when you need to own the user lifecycle: registration, self-service password reset, roles, and an admin console. Dex has no user management UI. For that, see the comparison with Keycloak and Zitadel on the [Adoption & Ecosystem](./adoption) page.

## In this deep-dive

- [History](./history): the CoreOS origin, the v2 rewrite, and the donation to CNCF.
- [Architecture](./architecture): the server, connectors, and storage, and how an authorization request flows.
- [Adoption & Ecosystem](./adoption): who runs it, the signals, and the real alternatives.
- [Internals](./internals): the token endpoint, PKCE, and ID Token signing, read from source.
- [Getting Started](./getting-started): a minimal working provider with a mock connector.

## Sources

- [Dex repository](https://github.com/dexidp/dex)
- [Dex documentation](https://dexidp.io/docs/)
- [CNCF Sandbox proposal for Dex (TOC)](https://github.com/cncf/toc/pull/379)
- [Dex ADOPTERS file](https://github.com/dexidp/dex/blob/master/ADOPTERS.md)

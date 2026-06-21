# Authelia

> An open-source authentication and authorization server. It provides single sign-on and two-factor authentication for applications behind a reverse proxy, and it can act as an OpenID Connect provider.

- **Category**: Identity & Policy
- **CNCF maturity**: Independent (not a CNCF project)
- **Language**: Go (`go 1.26`), React frontend
- **License**: Apache-2.0
- **Repository**: [authelia/authelia](https://github.com/authelia/authelia)
- **Documented at commit**: `06af72a` (v4.39.20)

## What it is

Authelia sits between your reverse proxy and the applications behind it. The proxy forwards each incoming request to Authelia first. Authelia checks whether the request carries a valid session and whether that session is allowed to reach the target, then answers with `200 OK` to let it through or a redirect to its own login portal. This pattern is called forward authentication, and it lets Authelia protect applications that have no authentication of their own.

On top of the proxy gate, Authelia runs the login portal itself: a username and password step backed by a file or LDAP user store, then a second factor (TOTP, WebAuthn or passkey, or Duo push). It also speaks OpenID Connect 1.0 as a provider, so applications that support OIDC natively can authenticate against Authelia directly instead of through the proxy.

It is a single Go binary with a SQL database (SQLite, MySQL, or PostgreSQL), an optional Redis for sessions, and a YAML configuration file. The container image is small and its memory footprint is low, which is part of why it became a default choice in the self-hosting community.

## When to use it

- You run several web applications behind one reverse proxy (Traefik, NGINX, Caddy, Envoy) and want one login and one access-control policy in front of all of them.
- You need to add two-factor authentication to applications that do not support it themselves.
- You want a small, self-hosted SSO portal rather than a full enterprise identity platform.

It is a weaker fit when you need a full identity provider with user federation, brokering, and many tenants. For that, see the comparison with Keycloak and Authentik on the [Adoption & Ecosystem](./adoption) page.

## In this deep-dive

- [History](./history): the Node.js origin, the v4 rewrite to Go, and where it stands now.
- [Architecture](./architecture): the components and how a forward-auth request flows through them.
- [Adoption & Ecosystem](./adoption): proxy support, adoption signals, and the real alternatives.
- [Internals](./internals): the authorization engine and the access decision, read from source.
- [Getting Started](./getting-started): the minimum pieces for a working setup.

## Sources

- [Authelia repository](https://github.com/authelia/authelia)
- [Authelia documentation](https://www.authelia.com/)
- [Authelia 4.39 release notes](https://www.authelia.com/blog/4.39-release-notes/)

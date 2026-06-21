# OAuth2 Proxy

> A reverse proxy that puts an OAuth2 / OIDC login in front of a web service, so the service itself never handles authentication.

- **Category**: Identity & Policy
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: MIT
- **Repository**: [oauth2-proxy/oauth2-proxy](https://github.com/oauth2-proxy/oauth2-proxy)
- **Documented at commit**: `10b6871` (master, 2026-06-14, just after tag v7.15.3)

## What it is

OAuth2 Proxy is an authentication shim. It runs as a reverse proxy in front of an upstream service, intercepts each request, and checks for a valid session. If there is none, it sends the user through an OAuth2 or OIDC login with an external identity provider (Google, GitHub, GitLab, Azure, Keycloak, generic OIDC, and others), then stores the result in a session cookie. The upstream service receives only authenticated requests, optionally enriched with identity headers.

It does not authenticate users itself. It delegates the credential check to the configured provider and keeps the resulting tokens in a session, server side in Redis or client side in a cookie. Authorization is a thin layer on top: an email-domain or allowed-emails check plus the provider's own group or org rules.

A common deployment is as an `auth_request` backend for nginx, a `forwardAuth` middleware for Traefik, or a sidecar in Kubernetes, gating dashboards and internal tools that have no login of their own.

## When to use it

- You need to put SSO in front of an app that has no authentication, and you already run an OIDC or OAuth2 identity provider.
- You use nginx, Traefik, or Kubernetes ingress and want a subrequest-based auth gate (`/oauth2/auth` returning 202 or 401).
- You want broad provider coverage without writing per-provider OAuth code.
- It is a poor fit when you need built-in MFA, a fine-grained policy engine, or context-aware authorization. Those belong to fuller stacks like Pomerium or Authelia.
- It is also a poor fit when the traffic is not browser-driven SSO and you cannot present a login redirect.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. CNCF project page, OAuth2 Proxy (Sandbox, accepted 2025-10-02): <https://www.cncf.io/projects/oauth2-proxy/>
2. CNCF Landscape entry: <https://landscape.cncf.io/?selected=o-auth2-proxy>
3. cncf/sandbox issue #397, OAuth2 Proxy sandbox application: <https://github.com/cncf/sandbox/issues/397>
4. cncf/sandbox issue #407, project onboarding: <https://github.com/cncf/sandbox/issues/407>
5. OAuth2 Proxy README (fork history and rename): <https://github.com/oauth2-proxy/oauth2-proxy/blob/master/README.md>
6. OAuth2 Proxy documentation: <https://oauth2-proxy.github.io/oauth2-proxy/>
7. OAuth2 Proxy installation docs: <https://oauth2-proxy.github.io/oauth2-proxy/installation>
8. Pomerium blog, OAuth2 Proxy alternatives: <https://www.pomerium.com/blog/best-oauth2-proxy-alternative>
9. oauth2-proxy issue #1170, OAuth2 Proxy vs Pomerium: <https://github.com/oauth2-proxy/oauth2-proxy/issues/1170>
10. OAuth2 Proxy GitHub repository: <https://github.com/oauth2-proxy/oauth2-proxy>

# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS.md`, and no first-party source naming production-adopting organisations was found during research. The closest signal is the CNCF Sandbox application, where a maintainer states that engineers from Microsoft, OpenAI, Adobe, and Morgan Stanley have contributed to the project (source 3). That describes contributor affiliation, not confirmed production use, so it is reported here as exactly that.

| Organisation | Use case | Source |
| --- | --- | --- |
| (no named production adopters confirmed) | Maintainer cites contributors affiliated with Microsoft, OpenAI, Adobe, and Morgan Stanley | [cncf/sandbox #397](https://github.com/cncf/sandbox/issues/397) |

In practice OAuth2 Proxy is widely recommended in hardening guides as the default way to put SSO in front of dashboards and internal tools behind an authenticating reverse proxy, often alongside Pomerium (source 8).

## Adoption signals

Measured from the GitHub API on 2026-06-22 (source 10):

- Stars: 14,557
- Forks: 2,139
- Open issues: 218
- Contributors: over 400 (the contributors API paginates past 400 single-entry pages)
- Latest release: v7.15.3, published 2026-06-09
- CNCF maturity: Sandbox, accepted 2025-10-02 (source 1)

## Ecosystem

OAuth2 Proxy is most often deployed as an integration point rather than standalone:

- **nginx**: as the backend for the `auth_request` directive.
- **Traefik**: as a `forwardAuth` middleware target.
- **Kubernetes**: via an official Helm chart, frequently with the nginx ingress `auth-url` annotation.
- **Redis**: as the server-side session store for large or many sessions.
- **Identity providers**: Google, GitHub, GitLab, Azure, Keycloak, ADFS, Microsoft Entra ID, and generic OIDC, implemented under `providers/`.

## Alternatives

OAuth2 Proxy is a thin shim: it delegates authentication to an external IdP, supports many providers, and integrates cleanly with `auth_request`-style gates. It does not bring its own MFA or a fine-grained policy engine. The main alternatives differ on exactly that axis.

| Alternative | Differs by |
| --- | --- |
| [Pomerium](https://github.com/pomerium/pomerium) | Identity- and context-aware zero-trust proxy with policy authorization based on identity attributes and context, and support for non-browser (API/CLI) traffic, not just an OAuth2 login gate (source 9). |
| [Authelia](https://github.com/authelia/authelia) | Self-contained authentication portal with built-in MFA, session memory, and policy authorization, rather than delegating everything to an external IdP (source 8). |
| [Vouch Proxy](https://github.com/vouch/vouch-proxy) | Lightweight SSO aimed specifically at nginx `auth_request`, with a narrower scope and no configuration UI (source 8). |

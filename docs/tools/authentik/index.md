# authentik

> A self-hosted identity provider that bundles SSO, OAuth2/OIDC, SAML, LDAP, RADIUS, and SCIM behind one server and a visual flow editor.

- **Category**: Identity & Policy
- **CNCF maturity**: Independent (not a CNCF project)
- **Language**: Python (Django) core, Go outposts, TypeScript/Lit web UI
- **License**: MIT core, with `website/` under CC BY-SA 4.0 and `authentik/enterprise/` under a source-available Enterprise license
- **Repository**: [goauthentik/authentik](https://github.com/goauthentik/authentik)
- **Documented at commit**: `9da4c56` (code declares version `2026.8.0-rc1`; nearest stable tag `version/2026.5.3`)

## What it is

authentik is an identity provider you run yourself. A single server speaks the protocols an application is likely to need for login: OAuth2/OIDC, SAML, LDAP, RADIUS, and SCIM. It also acts as a forward-auth gateway for apps that have no native authentication, through a separate Go process called an outpost.

The distinguishing idea is the "Flow, Stage, Policy" model. Instead of a fixed login screen, an administrator composes an authentication flow from ordered stages (identification, password, MFA, consent) and gates each stage with policies. A policy can be a static user/group membership check or a user-defined Python expression. The flow planner evaluates these and produces a flat list of stages to execute.

It is built and run from a single repository that mixes three languages: a Python/Django core that owns the data model and protocol providers, Go outposts for proxy/LDAP/RADIUS/RAC, and a TypeScript/Lit frontend for the admin UI and the flow executor.

## When to use it

- You want one self-hosted server to cover OIDC, SAML, LDAP, and forward-auth instead of stitching several tools together.
- You are replacing a hosted IdP (Okta, Auth0, Entra ID) and want identity to stay on infrastructure you control.
- You need custom login logic (conditional MFA, scripted access rules) expressed as composable flows and policies rather than code changes.

It is a weaker fit when you want a neutral-foundation governed project (authentik is single-vendor open core, see [History](./history)), or when a lightweight forward-auth-only gate such as Authelia already covers your needs.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [goauthentik/authentik source](https://github.com/goauthentik/authentik), pinned at commit `9da4c56`.
2. [Happy Birthday to Us!](https://goauthentik.io/blog/2023-11-1-happy-birthday-to-us/), authentik blog on the project's origin and history.
3. [Install authentik via Docker Compose](https://docs.goauthentik.io/install-config/install/docker-compose), official docs.
4. [Welcome to authentik](https://docs.goauthentik.io/), official documentation.
5. [CNCF Projects](https://www.cncf.io/projects/), confirming authentik is not a CNCF project.
6. [GitHub REST API: repos/goauthentik/authentik](https://api.github.com/repos/goauthentik/authentik), observed 2026-06-22.
7. [Authentik: The Open Source Alternative to Okta & Auth0](https://www.opentechhub.io/authentik/).
8. [Authentik vs Authelia vs Keycloak (2026)](https://blog.elest.io/authentik-vs-authelia-vs-keycloak-choosing-the-right-self-hosted-identity-provider-in-2026/).

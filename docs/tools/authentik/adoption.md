# Adoption & Ecosystem

## Who uses it

This deep-dive did not find named adopters with a primary citable source. The repository has no `ADOPTERS` file (checked at commit `9da4c56`), and the reviews encountered describe authentik's popularity in the self-hosting community and as an Okta/Auth0 alternative without naming individual organizations as first-party sources ([opentechhub](https://www.opentechhub.io/authentik/)). Rather than invent adopters, this page reports the GitHub signals below.

## Adoption signals

Observed via the [GitHub REST API](https://api.github.com/repos/goauthentik/authentik) on 2026-06-22:

| Signal | Value |
| --- | --- |
| Stars | 22,091 |
| Forks | 1,663 |
| Watchers | 68 |
| Repository created | 2019-12-30 |

The contributor list runs to roughly 557 pages at `per_page=1` (including anonymous contributors), indicating a broad contributor base. Releases follow a frequent calendar-versioned cadence (the code at this commit declares `2026.8.0-rc1`, nearest stable tag `version/2026.5.3`).

## Ecosystem

- Forward-auth outposts front reverse proxies such as Traefik, nginx, and Envoy, adding authentication to apps that lack it.
- Deployment paths include an official Helm chart, Docker Compose, and Kubernetes manifests ([docs](https://docs.goauthentik.io/)).
- Bundled protocol providers (`authentik/providers/`) cover OAuth2/OIDC, SAML, LDAP, RADIUS, RAC, and SCIM, so a single server integrates with both applications and external directories.
- `authentik/sources/` adds social login and inbound directory federation.

## Alternatives

authentik's real distinction is the visual "Flow, Stage, Policy" model for composing authentication, combined with bundling many protocols (OIDC, SAML, LDAP, RADIUS, RAC, SCIM) in one server ([elest.io comparison](https://blog.elest.io/authentik-vs-authelia-vs-keycloak-choosing-the-right-self-hosted-identity-provider-in-2026/)). Pick it when you want that breadth self-hosted; pick an alternative when its narrower focus fits better.

| Alternative | Differs by |
| --- | --- |
| Keycloak | Red Hat's full-featured OSS IdP; closest in capability but a heavier, more complex admin experience |
| Authelia | Lightweight, focused on forward-auth; fewer IdP features than authentik |
| Zitadel | OSS IdP with a multi-tenant, cloud-native focus |
| Ory | Composable identity components (Kratos, Hydra) rather than one bundled server |
| Okta / Auth0 / Entra ID | Hosted commercial IdPs; no self-hosting, managed operations |

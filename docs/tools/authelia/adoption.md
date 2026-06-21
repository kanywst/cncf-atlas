# Adoption & Ecosystem

## Who uses it

Authelia's adoption is visible mainly through its GitHub presence and its standing in the self-hosting community, not through named enterprise case studies. As of 2026-06-21 the repository has about 28,100 stars and 1,420 forks. The README credits more than one hundred contributors.

There is no ADOPTERS file and no published case study naming specific organisations running Authelia in production. Several independent comparison write-ups from 2025 and 2026 consistently describe it as a default, purpose-built SSO and 2FA choice in the homelab and self-hosting community, often paired with LLDAP as a lightweight user store. That is the honest shape of its adoption: broad in self-hosting, not documented in enterprise references.

## Adoption signals

| Signal | Value | Observed |
| --- | --- | --- |
| GitHub stars | ~28,100 | 2026-06-21 |
| GitHub forks | ~1,420 | 2026-06-21 |
| Contributors | 100+ | per README |
| Container image | small image, low memory footprint | per project docs |

## Ecosystem

Authelia is a companion to a reverse proxy, so its ecosystem is the set of proxies it integrates with. From the official support matrix:

| Proxy | Method | Status |
| --- | --- | --- |
| Traefik (v2 and v3) | ForwardAuth | Fully supported |
| Caddy (v2.5.1+) | ForwardAuth | Fully supported |
| NGINX | auth_request | Fully supported |
| Envoy (v4.37.0+) | ExtAuthz | Fully supported |
| HAProxy | ForwardAuth (Lua) | Supported, Lua required |
| Skipper | ForwardAuth | Fully supported |

It integrates in Kubernetes through the NGINX and Traefik ingress controllers and through Envoy Gateway or Istio using external authorization. Apache httpd and IIS are not supported, because neither has a suitable auth module. It is commonly deployed alongside LLDAP for the user store, Redis for sessions, and an SMTP server for notifications, and it can also stand alone as an OpenID Connect provider for applications that speak OIDC.

## Alternatives

The genuine distinction between Authelia and its alternatives is forward-auth gate versus full identity provider. The comparisons below are synthesized from practitioner write-ups; verify the licensing notes against each project before relying on them.

| Alternative | The real distinction |
| --- | --- |
| Keycloak | A full, battle-tested identity provider with realms, SAML, and LDAP or AD federation. Heavier, and not natively a forward-auth gate. Pick Keycloak for enterprise IAM with federation; pick Authelia for a lightweight gate. |
| Authentik | A full identity provider that also offers forward-auth through a proxy outpost. The strongest single tool when you need both, but heavier. Pick Authelia for a minimal footprint. |
| Ory (Kratos, Hydra, Oathkeeper) | API-first identity primitives for building auth into a product. More assembly required. Pick Authelia for a ready-made portal. |
| oauth2-proxy | A pure proxy auth shim with no user store or MFA of its own; it delegates to an external provider. Pick Authelia when you want the provider and MFA themselves. |
| Zitadel | An API-first, multi-tenant provider for SaaS, with no forward-auth mode. Pick Authelia for proxy-gated self-hosting. |

## Sources

- [GitHub API: authelia/authelia](https://api.github.com/repos/authelia/authelia)
- [Proxy integration support matrix](https://www.authelia.com/integration/proxies/support/)
- [The state of open-source identity in 2025](https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel)
- [Authentik vs Authelia vs Keycloak, 2026](https://blog.elest.io/authentik-vs-authelia-vs-keycloak-choosing-the-right-self-hosted-identity-provider-in-2026/)

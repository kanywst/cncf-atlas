# Adoption & Ecosystem

## Who uses it

The in-repo `ADOPTERS.md` lists organizations that agreed to be named publicly. The CNCF acceptance blog cites further production users.

| Organisation | Use case | Source |
| --- | --- | --- |
| Accenture | Public adopter | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| CERN (European Organisation for Nuclear Research) | Public adopter | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| Hewlett-Packard Enterprise | Public adopter | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| Hitachi | Public adopter | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| Capgemini | Public adopter | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| Bundesagentur für Arbeit | Public adopter | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| AlmaLinux Foundation | Public adopter | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| Cisco, Ohio Supercomputing Center, Okta, Quest | Cited as production users | [CNCF blog](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/) |

## Adoption signals

- GitHub stars: 35,044; forks: 8,531 (GitHub API, observed 2026-06-24).
- Contributors: over 1,800 including anonymous, via the GitHub contributors API (observed 2026-06-24).
- At CNCF acceptance the project reported over 15,000 stars and over 150,000 monthly visits to keycloak.org ([CNCF blog](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/)).
- Frequent minor releases on the `26.x` line; `26.6.3` released 2026-06-04 ([releases](https://github.com/keycloak/keycloak/releases)).

## Ecosystem

Keycloak acts as an IdP over OIDC, OAuth 2.0, and SAML 2.0. It federates users from LDAP, Active Directory, and Kerberos, brokers identity from external IdPs and social logins, and offers UMA 2.0 Authorization Services. It ships a Kubernetes Operator (`operator/`) and React-based Admin and Account consoles (`js/`). It is the upstream for the Red Hat build of Keycloak.

## Alternatives

Keycloak is the default for enterprise federation and legacy integration. Its strength is feature coverage and maturity; the trade-off is weight and configuration complexity ([Oso](https://www.osohq.com/learn/best-keycloak-alternatives-2025)).

| Alternative | Differs by |
| --- | --- |
| Authentik (Python/TS) | Flow Engine for flexible auth flows and a forward-auth proxy mode, so it can front apps that do not speak OIDC ([House of FOSS](https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel)) |
| Zitadel (Go) | Event-sourced with auditable changes, native multi-tenancy, Kubernetes-first design; moved from Apache-2.0 to AGPL-3.0 in 2025 ([Oso](https://www.osohq.com/learn/best-keycloak-alternatives-2025)) |
| Ory Hydra (Go) | An OAuth2/OIDC token server only, with no user management; pair it with Kratos. Suited to lightweight token issuance for many clients ([Oso](https://www.osohq.com/learn/best-keycloak-alternatives-2025)) |

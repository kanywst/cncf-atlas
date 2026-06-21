# Adoption & Ecosystem

## Who uses it

There is no CNCF case study or vendor-neutral adopter survey for ZITADEL, because it is not a CNCF-hosted project. The citable adopters are the organizations that self-reported in the repository's `ADOPTERS.md`. Treat this as self-declared rather than independently verified.

| Organisation | Use case | Source |
| --- | --- | --- |
| Rawkode Academy | Self-declared adopter | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| XPeditionist | Self-declared adopter | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| devOS: Sanity Edition | Self-declared adopter | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| CNAP.tech | Self-declared adopter | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| Minekube | Self-declared adopter | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| OpenAIP | Self-declared adopter | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| roclub GmbH | Self-declared adopter | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| CEEX AG | Self-declared adopter | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |

The file also lists Dribdat, Micromate, Smat.io, hirschengraben, and D1V.AI. At the Series A in 2022 the company claimed more than 150 customers ([Series A](https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a)), but those organizations are not individually named in a public source.

## Adoption signals

Measured from the GitHub API on 2026-06-22 ([repo metadata](https://api.github.com/repos/zitadel/zitadel)):

- Stars: 14,138
- Forks: 1,121
- Open issues: 1,083
- Watchers: 61
- Contributors: about 246 (non-anonymous, by API pagination)

Release cadence is active, with point releases on the v4 line in mid-2026 ([repo](https://github.com/zitadel/zitadel)). At the 2022 Series A the project reported 10k+ stars and 200+ contributors ([Series A](https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a)), so the trend since then is steady growth.

ZITADEL is not in the CNCF landscape as a hosted project at any maturity level ([CNCF Landscape](https://landscape.cncf.io/), checked 2026-06-22). Its closest competitor Keycloak entered CNCF incubation in 2023, a deliberate contrast the maintainers have written about ([Open Source in the AI Era](https://zitadel.com/blog/open-source-in-the-ai-era)).

## Ecosystem

ZITADEL implements OpenID Connect (certified), OAuth 2.0, SAML 2.0, and a SCIM 2.0 provisioning server ([API introduction](https://zitadel.com/docs/apis/introduction)). Actions v2 provides webhooks, custom code, and token enrichment as extension hooks. Around the core there are language SDKs, a Helm chart and Terraform provider, and a Kubernetes operator for self-hosting (README.md:117). ZITADEL Cloud is the managed offering and runs the same codebase as the self-hosted distribution.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Keycloak | Java/Quarkus, CNCF incubating, the broadest feature set including acting as an LDAP server; heavier to run |
| Ory (Hydra + Kratos) | Go, headless API-first microservices you compose yourself; no bundled admin UI or built-in multi-tenancy |
| Authentik | Python/TypeScript, strong flow-based UI, can serve LDAP and forward-auth; less event-sourced auditing |
| FusionAuth | Commercial-friendly single binary, free tier, not fully open source |
| Auth0 / Okta | SaaS only, not self-hostable, no open source code |

Pick ZITADEL when you want self-hostable B2B multi-tenancy, an event-sourced audit trail exposed over APIs, and SaaS/self-host parity. Pick Keycloak or Authentik when you need ZITADEL to act as an LDAP server, which it does not do ([skycloak comparison](https://skycloak.io/blog/open-source-authentication-comparison-2026/), [houseoffoss comparison](https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel)).

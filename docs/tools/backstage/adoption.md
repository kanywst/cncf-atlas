# Adoption & Ecosystem

## Who uses it

The repository's `ADOPTERS.md` is a self-reported list of 288 lines of organisations, collected through an adopter form and PRs. The entries below are organisations listed there whose Backstage use is publicly known (S1). Spotify is the origin and continues to build on it (S7).

| Organisation | Use case | Source |
| --- | --- | --- |
| Spotify | Created Backstage; runs it internally and ships the commercial Spotify Portal on top | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1), [Spotify Engineering](https://engineering.atspotify.com/2025/4/celebrating-five-years-of-backstage) (S7) |
| American Airlines | Internal developer portal | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Expedia | Internal developer portal | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Splunk | Internal developer portal | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Booking.com | Internal developer portal | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Zalando | Internal developer portal | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Mercedes-Benz | Internal developer portal | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Epic Games | Internal developer portal | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |

Other organisations listed in the same file include VMware, Wayfair, Box, HP, Fidelity, Telenor, Twilio, Volvo, and Palo Alto Networks (S1).

## Adoption signals

Measured from the GitHub API on 2026-06-24 at the pinned commit (S1):

- Stars: 33,688; forks: 7,423; watchers (subscribers): 231; open issues: 448.
- Contributors: the paginated contributors API counts 360+ distinct commit authors, and the API caps results so the real number is higher.
- CNCF velocity ranking moved from 8th among 100+ projects in the 2020 donation year to 6th among 230+ by 2025, per CNCF and Aniszczyk (S8).

The category itself is growing: Gartner's 2025 IDP Market Guide, cited by Port, predicts that by 2028 85% of software organisations will adopt internal developer platforms, up from under 25% in 2023 (S10).

## Ecosystem

Backstage ships 159 official plugins in `plugins/*`, plus a community plugin ecosystem. Representative integration plugins cover Kubernetes, GitHub, ArgoCD, and PagerDuty (S2, S3). The backend persists through Knex against Postgres or SQLite (S2). Recent additions show the project reaching toward AI and MCP: `plugin-mcp-actions-backend` and `catalog-backend-module-ai-model` appear in the example backend, and the catalog model gained `AiResourceEntityV1alpha1` and `McpServerApiEntity` kinds (S1).

Managed and commercial offerings built on Backstage include Roadie (managed Backstage) and Spotify Portal for Backstage (S7, S10).

## Alternatives

Backstage is a framework: you build and operate your own portal, which buys flexibility at the cost of needing engineers on it. The main alternatives are products with a more fixed data model and faster time-to-value (S10).

| Alternative | Differs by |
| --- | --- |
| Port | SaaS IDP; productized with a more fixed data model, stands up in days rather than weeks |
| Cortex | SaaS IDP focused on service maturity and scorecards, run as a product not a framework |
| OpsLevel | SaaS IDP centered on service catalog and ownership, managed rather than self-built |
| Roadie | Managed Backstage: the same OSS core, operated for you instead of self-hosted |

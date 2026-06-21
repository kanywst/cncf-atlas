# History

## Origin

ZITADEL was built by CAOS AG, a company founded in 2019 in St. Gallen, Switzerland, by Florian Forster (CEO), Fabienne Bühler, and Maximilian Panne, who came from identity and infrastructure backgrounds ([About ZITADEL](https://zitadel.com/about)). The GitHub repository was created on 2020-03-16 ([GitHub repo metadata](https://api.github.com/repos/zitadel/zitadel)).

The stated goal was to combine the developer experience of Auth0 with the self-hosting control of Keycloak, and to make multi-tenancy a first-class design property rather than something bolted on later. The team chose Go and an event-sourced architecture to deliver that ([About ZITADEL](https://zitadel.com/about)). Being based in Switzerland is also a deliberate data-sovereignty pitch toward finance, healthcare, and government workloads.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | CAOS AG founded in St. Gallen, Switzerland ([About](https://zitadel.com/about)) |
| 2020 | GitHub repository created on 2020-03-16 ([repo metadata](https://api.github.com/repos/zitadel/zitadel)) |
| 2022 | Seed round, then a $9M Series A led by Nexus Venture Partners with Floodgate participating; over 150 companies and 10k+ stars claimed at the time ([Series A](https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a)) |
| 2025 | v3 (2025-03-31): license changed from Apache-2.0 to AGPL-3.0, and CockroachDB support dropped in favor of PostgreSQL only ([v3 announcement](https://zitadel.com/blog/zitadel-v3-announcement)) |
| 2026 | Active release stream on main; tag `v4.15.2` shipped 2026-06-17 ([repo](https://github.com/zitadel/zitadel)) |

## How it evolved

The defining shift was v3 in March 2025, which made two large changes at once. First, the project relicensed from Apache-2.0 to AGPL-3.0-only to protect against unpaid commercial reuse, while keeping the `proto/` definitions and SDKs under permissive licenses so that generated gRPC client code does not inherit copyleft ([Moving to AGPL](https://zitadel.com/blog/apache-to-agpl), [LICENSING.md](https://github.com/zitadel/zitadel/blob/main/LICENSING.md)). Second, CockroachDB support was removed and PostgreSQL became the only supported database; existing v2.x CockroachDB deployments were kept on maintenance-only support until 2025-09-30 ([Key Changes in Version 3](https://github.com/zitadel/zitadel/discussions/9529)).

The total funding raised across rounds is about $15.5M ([Series A](https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a)). The codebase also shows an in-progress next-generation backend under `backend/v3/`, which `main.go` already imports for instrumentation, signaling an ongoing internal restructuring rather than a finished rewrite.

## Where it stands now

ZITADEL ships frequently, with point releases on the v4 line in mid-2026 and a `v5.0.0-base` version tag present in the repository. Development is company-led by what is now ZITADEL (formerly CAOS AG), and the project runs a dual-license, commercially self-funded model rather than seeking neutral foundation governance. The maintainers have explicitly contrasted this with Keycloak's 2023 entry into CNCF incubation, framing self-sustaining open source as their chosen path ([Open Source in the AI Era](https://zitadel.com/blog/open-source-in-the-ai-era)).

# History

## Origin

Microcks was started by Laurent Broudoux in February 2015 as a personal side project. The GitHub repository's `created_at` is `2015-02-23`, which matches his own account of when the work began (sources 1, 6). Broudoux was at Red Hat at the time, and the project stayed close to the Red Hat developer ecosystem for years (source 6).

The founding idea was to simulate any API dependency, regardless of protocol, without writing a single line of custom code. The aim was to fold mocking and testing of every enterprise service into one tool that worked for both green-field and legacy systems (source 6). The 1.0.0 release was described by Broudoux as the realisation of a vision set out 18 months earlier (source 6).

Yacine Kheddache joined as co-founder and community lead. Both founders are now sponsored by Postman, which is the main project sponsor (source 1).

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | First commit; project started as a personal side project (sources 1, 6) |
| 2018 | 1.0.0 release, described as the realisation of the original vision (source 6) |
| 2023 | Accepted into the CNCF Sandbox on 2023-06-22 (sources 2, 3) |
| 2026 | Promoted to CNCF Incubating after a TOC vote (CNCF blog, 2026-05-07) (sources 2, 4) |

## How it evolved

Microcks grew from a REST/SOAP mock generator into a multi-protocol platform. The codebase now ships mock controllers for REST, SOAP, GraphQL, and gRPC, plus a dedicated Quarkus async minion for event-driven (AsyncAPI) protocols across Kafka, MQTT, AMQP, NATS, Google Pub/Sub, Amazon SNS, and Amazon SQS (see [Architecture](./architecture)).

More recent additions reflect where API tooling is heading: a controller that exposes mocks as a Model Context Protocol server (`McpController`), and an OpenAI-backed AI Copilot (`AICopilotController`), both present in the web layer at the documented commit.

Governance moved from a single-author project to a vendor-neutral CNCF model. The project documents a four-tier role structure (Maintainer, Code Owner, Contributor, Adopter) and three top-level maintainers: Laurent Broudoux and Yacine Kheddache (both Postman-sponsored) and Sebastien Degodez (AXA France) (sources 1, 10).

## Where it stands now

At the documented commit the version in `pom.xml` is `1.15.0-SNAPSHOT`, sitting just before the `1.15.0-rc1` tag dated 2026-06-22; the latest stable release at the time was `1.14.0`. The project is CNCF Incubating as of May 2026. The CNCF promotion blog cites 645 cumulative contributors, container image downloads exceeding 2.5 million in 2025 (triple the 2024 figure), and 34 public adopters (source 2). Activity and contributor metrics are tracked publicly via DevStats at [microcks.devstats.cncf.io](https://microcks.devstats.cncf.io/) (source 10).

# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS` file, and this deep-dive found one named organization with a citable source: Netstar, a fleet monitoring and management company in South Africa, ran Drasi as a preview partner. Netstar tracks vehicles and cargo from pickup through port terminals, and it had been rebuilding the same integration each time to correlate vehicle IDs, waypoints, GPS, and IoT telemetry that lived in separate systems. It replaced that recurring integration work with Drasi's continuous queries and reactions, and used a Drasi Grafana plugin to bring the results into one dashboard. The CNCF case study and a Microsoft Community Hub blog both quote Netstar's technical lead Daniel Joubert and solution architect Dustyn Lightfoot (CNCF case study; Microsoft Community Hub).

| Organisation | Use case | Source |
| --- | --- | --- |
| Netstar | Fleet and cargo monitoring: correlating vehicle IDs, waypoints, GPS, and IoT telemetry across systems with continuous queries and reactions, surfaced in one Grafana dashboard | [CNCF case study](https://www.cncf.io/case-studies/netstar/), [Microsoft Community Hub](https://techcommunity.microsoft.com/blog/linuxandopensourceblog/how-netstar-streamlined-fleet-monitoring-and-reduced-custom-integrations-with-dr/4499592) |

## Adoption signals

Since named external adopters are scarce, the measurable signals carry more weight. As of 2026-07-08 (GitHub API): 1,244 stars and 87 forks, with the repository created on 2024-05-27 and last pushed 2026-07-06. The README carries an OpenSSF Best Practices badge (project 10588). Drasi is a young CNCF Sandbox project accepted on 2025-01-21, and the Azure blog positions it as part of Microsoft's CNCF contributions alongside Dapr, KEDA, Radius, and Copacetic (CNCF project page; Azure blog). The development is Microsoft-led, which is the main governance concentration to weigh for a project this early.

## Ecosystem

Drasi is tied to several projects rather than standing alone. It depends on **Dapr** for pub/sub, virtual actors, and state, from the same Azure Incubations team, so its loosely coupled component model largely assumes Dapr is present. Its relational Source embeds **Debezium** as the change-data-capture engine (`sources/relational/debezium-reactivator`), so Debezium is a part it uses rather than a thing it replaces. The query language is **Cypher** (openCypher), which is what lets a single query join across sources as a graph. For visualization, a Drasi **Grafana** plugin renders query results, as in the Netstar case (CNCF case study). Beyond those, Sources and Reactions are extensible through SDKs, and the prebuilt set spans PostgreSQL, Cosmos DB, Dataverse, Event Hubs, and Kubernetes on the Source side, and HTTP, SignalR, Gremlin, Dapr, SQL, Debezium, AWS, Azure, Power Platform, vector-store sync, and MCP on the Reaction side (`sources/`, `reactions/`).

## Alternatives

Drasi's distinction is that it evaluates a condition across multiple sources as a live Cypher query, without moving the data into its own store, and it runs reactions on the result diff. The alternatives each cover part of that span.

| Alternative | Differs by |
| --- | --- |
| Debezium | Captures change streams from databases and stops there; it does not evaluate a standing query, diff a result set, or fire a reaction. Drasi uses Debezium inside its relational Source and adds the evaluation and reaction layers on top |
| Materialize | A database that provides incremental view maintenance in SQL; the incremental-view idea is close, but Materialize ingests data into its own storage and speaks SQL, while Drasi leaves data in place, joins across sources in Cypher, and runs reactions on Kubernetes |
| ksqlDB / Kafka Streams | Stream processing centered on Kafka topics; Drasi does not assume Kafka and instead turns any system's change feed into a Source and evaluates it with graph patterns |
| Apache Flink | A general, lower-level stream-processing engine with more expressive power and scale; you assemble the detect-evaluate-react pattern yourself, whereas Drasi ships that pattern as the fixed Source/Continuous Query/Reaction shape with declarative resources |

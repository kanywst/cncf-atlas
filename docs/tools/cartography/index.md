# Cartography

> Cartography pulls cloud and SaaS assets and the relationships between them into a Neo4j graph so you can query exposure and access paths with Cypher.

- **Category**: Security & Compliance
- **CNCF maturity**: Sandbox
- **Language**: Python
- **License**: Apache-2.0
- **Repository**: [cartography-cncf/cartography](https://github.com/cartography-cncf/cartography)
- **Documented at commit**: `cdf66e2` (master, 2026-06-25)

## What it is

Cartography is a Python tool that pulls infrastructure assets and the relationships between them into a [Neo4j](https://www.neo4j.com) graph database (README.md:12). Once the data is in the graph, you ask questions across providers with Cypher, Neo4j's query language. The point is the relationships: which Identity and Access Management (IAM) principal can reach which resource, which compute node is exposed to the internet, which account owns what.

It started inside Lyft as a way to find the shortest path an attacker could take to reach administrator access through the IAM graph, and the team later found the same graph useful for defenders ([Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7)). The Cloud Native Computing Foundation (CNCF) accepted it at the Sandbox level on 2024-08-23 ([CNCF project page](https://www.cncf.io/projects/cartography/)).

It ships connectors for 30+ providers, including Amazon Web Services (AWS), Google Cloud Platform (GCP), Azure, GitHub, Okta, and Kubernetes, plus vulnerability sources (README.md:81-99). Each connector follows the same shape: fetch from a provider Application Programming Interface (API), load into the graph, then delete stale data.

## When to use it

- You run across multiple clouds or SaaS providers and need one place to ask cross-cutting questions, such as which internet-exposed host can assume an admin role.
- You want to model relationships, not just an inventory list, and you are willing to learn Cypher.
- You need a snapshot you can diff over time or feed into a rules engine for security checks.
- It is a weaker fit when you only need point-in-time compliance scoring of a single account; a dedicated auditor like Prowler answers that without running a graph database.
- It is a weaker fit if you cannot operate a Neo4j instance.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a sync flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [cartography-cncf/cartography](https://github.com/cartography-cncf/cartography) (source, README, LICENSE, pyproject.toml), accessed 2026-06-26.
2. [Cartography | CNCF project page](https://www.cncf.io/projects/cartography/) (Sandbox, accepted 2024-08-23), accessed 2026-06-26.
3. [Cartography joins the CNCF](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7) (Lyft Engineering, history and donation), accessed 2026-06-26.
4. [Launch HN: SubImage (YC W25)](https://news.ycombinator.com/item?id=43161332) (built on Cartography), accessed 2026-06-26.
5. [CloudQuery vs Cloud Asset Inventory Tools](https://www.cloudquery.io/blog/cloudquery-vs-cloud-asset-inventory-tools) (alternatives comparison), accessed 2026-06-26.
6. [GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography) (stars, forks, release), accessed 2026-06-26.
7. [CNCF Sandbox application issue](https://github.com/cncf/sandbox/issues/58), accessed 2026-06-26.

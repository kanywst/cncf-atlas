# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS` file, so the only named users below are ones with a citable public source. Do not read the short table as the full user base; it is the cited subset.

| Organisation | Use case | Source |
| --- | --- | --- |
| Lyft | Built Cartography internally to find attack paths to admin access through the IAM graph, then donated it to the CNCF | [Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7) |
| SubImage (YC W25) | Builds an "attacker's view" infrastructure product on top of Cartography | [Launch HN](https://news.ycombinator.com/item?id=43161332) |

## Adoption signals

Because named adopters are thin, GitHub signals are the better measure. As of 2026-06-26 ([GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography)):

- Stars: 3,940
- Forks: 526
- Open issues: 106
- Created: 2019-02-27
- Primary language: Python
- Latest release: `0.138.1` (2026-06-19)

The project releases often (the pinned master commit `cdf66e2` is six commits ahead of `0.138.1`), and the maintainer roster is recorded in MAINTAINERS.md. The CNCF accepted it at the Sandbox level on 2024-08-23 ([CNCF project page](https://www.cncf.io/projects/cartography/)).

## Ecosystem

Cartography runs against a Neo4j 5 community database (README.md:36) and pulls from 30+ providers through their SDKs and APIs, including AWS via boto3, GCP, Azure, GitHub, Okta, and Kubernetes (README.md:81-99). It also integrates vulnerability sources such as Common Vulnerabilities and Exposures (CVE) data, Trivy, Syft, Semgrep, and Docker Scout. The bundled `cartography-rules` command runs security checks against the graph (README.md:71-79).

## Alternatives

Cartography is distinctive because relationships are first-class: it stores assets as a graph and lets you traverse access paths with Cypher. The trade-off is that you must run Neo4j and learn Cypher. SQL-based inventory tools are easier to query with familiar tooling but model relationships as joins rather than as a traversable graph ([CloudQuery comparison](https://www.cloudquery.io/blog/cloudquery-vs-cloud-asset-inventory-tools)).

| Alternative | Differs by |
| --- | --- |
| CloudQuery / Steampipe | SQL-based cloud asset inventory; relationships are joins, not a graph, so attack-path traversal is harder ([CloudQuery comparison](https://www.cloudquery.io/blog/cloudquery-vs-cloud-asset-inventory-tools)). |
| Prowler / ScoutSuite | Point-in-time compliance auditors; they score configuration but do not build a cross-resource relationship graph. |
| AWS Config / Azure Resource Graph / GCP Cloud Asset Inventory | Cloud-native inventories scoped to one provider; weak at cross-cloud and cross-account traversal. |

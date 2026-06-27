# Getting Started

> Verified against the Quick Start in README.md at commit `cdf66e2`. Commands assume Python 3.10+ (pyproject.toml:37) and Docker for the Neo4j database.

## Prerequisites

- Python 3.10 or newer (pyproject.toml:37).
- Docker, to run Neo4j locally.
- Read access credentials for at least one provider. This guide uses AWS.

## Install

```bash
pip install cartography
```

## A first working setup

This is the shortest path to a graph you can query, following the README Quick Start (README.md:25-67).

1. Start a Neo4j 5 community database. The container publishes the browser port 7474 and the Bolt protocol port 7687, and disables auth for local use.

    ```bash
    docker run -d --publish=7474:7474 --publish=7687:7687 -v data:/data --env=NEO4J_AUTH=none neo4j:5-community
    ```

2. Confirm Neo4j is up by opening `http://localhost:7474` in a browser.

3. Configure AWS credentials and a default region, for example through `AWS_PROFILE` and `AWS_DEFAULT_REGION` or `~/.aws/config`.

4. Run a sync that only ingests AWS by passing `--selected-modules aws`. The flag maps to `build_sync(selected_modules)` (cli.py:2047-2049).

    ```bash
    cartography --neo4j-uri bolt://localhost:7687 --selected-modules aws
    ```

## Verify it works

Open `http://localhost:7474` and run a Cypher query against the data you just loaded. This one, from the README (README.md:64-66), lists internet-exposed EC2 instances:

```cypher
MATCH (instance:EC2Instance{exposed_internet: true})
RETURN instance.instanceid, instance.publicdnsname
```

If the sync ran, the query returns rows (or an empty result if no instance is exposed) rather than an error about a missing label. The command-line output also logs the start of each sync stage.

## Where to go next

- The [full install guide](https://cartography-cncf.github.io/cartography/install.html) covers running against other providers and platforms.
- The [querying tutorial](https://cartography-cncf.github.io/cartography/usage/tutorial.html) and [data schema](https://cartography-cncf.github.io/cartography/usage/schema.html) document the node labels and relationships.
- The [rules docs](https://cartography-cncf.github.io/cartography/usage/rules.html) cover running `cartography-rules` for security checks.

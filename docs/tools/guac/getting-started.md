# Getting Started

> Verified against the source at commit `362e6da`. Commands assume Docker with Compose and a local clone of the repository.

## Prerequisites

- Docker with the Compose plugin (the local stack runs as containers).
- `git` and `curl`.
- Go 1.26 only if you want to build the binaries from source instead of using the released image.

## Install

The quickstart path uses the published GUAC image through Docker Compose. Clone the repository first:

```bash
git clone https://github.com/guacsec/guac.git
cd guac
```

To build the CLI binaries from source instead (output lands in `./bin`):

```bash
make build
```

## A first working setup

This brings up the GUAC services with the in-memory backend, ingests a folder of documents, and queries the result.

1. Start the stack (GraphQL server, collectsub, ingestor) with the in-memory backend. The target force-recreates containers and waits for the GraphQL endpoint to answer on port 8080.

   ```bash
   make start-service
   ```

1. Ingest a folder of SBOMs/attestations directly into the graph. The `files` subcommand talks straight to the GraphQL endpoint (`cmd/guacone/cmd/files.go:62`).

   ```bash
   bin/guacone collect files /path/to/sbom-folder
   ```

1. Query the graph from the CLI.

   ```bash
   bin/guacone query
   ```

## Verify it works

The `start-service` target polls `http://localhost:8080` and prints `Inmem GUAC service is up!` once the GraphQL endpoint responds (`Makefile:161`). You can also open the GraphQL playground at `http://localhost:8080` in a browser. To tear the stack down and flush in-memory state:

```bash
make stop-service
```

## Where to go next

For production concerns (the ent+PostgreSQL backend, collectors running as daemons, pub/sub via NATS, and TLS), follow the official setup guide at <https://docs.guac.sh/>. The repository also ships a `.devcontainer` that brings up the full stack (GraphQL, REST, collectsub, ingestor, NATS, and the deps_dev/osv/ClearlyDefined collectors) for editor-based exploration.

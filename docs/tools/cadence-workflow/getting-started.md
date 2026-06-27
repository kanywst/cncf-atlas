# Getting Started

> Verified against the repository at commit `66dcbaf`. Commands assume Docker Desktop and `git` on macOS or Linux.

## Prerequisites

- Docker with the Compose plugin (`docker compose`).
- `git`.
- For the no-Docker path only: Go 1.24 to build the binaries (`go.mod:3`).

## Install

The fastest install is to run the bundled Docker Compose stack, which brings up the server, the database, and the UI together.

```bash
git clone https://github.com/cadence-workflow/cadence.git
cd cadence
docker compose -f docker/docker-compose.yml up
```

## A first working setup

This starts the backend, registers a domain (Cadence's unit of namespacing for workflows), and opens the UI.

1. Start the backend components and leave them running.

   ```bash
   docker compose -f docker/docker-compose.yml up
   ```

2. In a second terminal, register a domain using the official CLI image. The frontend listens on port 7933 (`tools/cli/defs.go:34`); `host.docker.internal` reaches it from another container on Docker Desktop.

   ```bash
   docker run --rm ubercadence/cli:master \
     --address host.docker.internal:7933 \
     --domain test-domain domain register
   ```

3. Confirm the domain exists.

   ```bash
   docker run --rm ubercadence/cli:master \
     --address host.docker.internal:7933 \
     --domain test-domain domain describe
   ```

4. Open the web UI at `http://localhost:8088` to browse workflow histories and traces (`README.md:29`).

5. Run a sample workflow against this server with the [cadence-samples](https://github.com/cadence-workflow/cadence-samples) (Go) or [cadence-java-samples](https://github.com/cadence-workflow/cadence-java-samples) (Java) repositories.

## Verify it works

The `domain describe` command in step 3 prints the domain's configuration if the server is healthy. You can also watch the Compose logs for the four services (frontend, history, matching, worker) reporting started, and the UI at `http://localhost:8088` should load and list `test-domain`.

If you prefer no Docker, build the binaries and run the server against SQLite (`CLAUDE.md`):

```bash
make bins
make install-schema-sqlite
./cadence-server --zone sqlite start
```

## Where to go next

- Production deployment on Kubernetes uses the [cadence-charts](https://github.com/cadence-workflow/cadence-charts) Helm chart (`README.md:32-34`).
- Write workflows with the official [Go](https://github.com/cadence-workflow/cadence-go-client) or [Java](https://github.com/cadence-workflow/cadence-java-client) SDK.
- For high availability, multi-cluster replication, security, and scaling, follow the official documentation rather than this local setup.

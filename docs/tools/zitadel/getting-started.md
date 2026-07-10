# Getting Started

> Based on the Docker Compose quickstart documented at commit `10087e7`. Commands assume a Linux or macOS host with Docker and Docker Compose installed.

## Prerequisites

- Docker and the Docker Compose plugin.
- PostgreSQL 14 or newer. The Compose setup provisions this for you; a standalone install needs an external database (README.md:147).
- `curl` to fetch the manifests.

## Install

The fastest path is the published Docker Compose manifest, which brings up ZITADEL and its database together (README.md:78):

```bash
curl -LO https://raw.githubusercontent.com/zitadel/zitadel/main/deploy/compose/docker-compose.yml \
  && curl -LO https://raw.githubusercontent.com/zitadel/zitadel/main/deploy/compose/.env.example \
  && cp .env.example .env \
  && docker compose up -d --wait
```

## A first working setup

1. Create a working directory and fetch the Compose file plus the example environment.

   ```bash
   mkdir zitadel && cd zitadel
   curl -LO https://raw.githubusercontent.com/zitadel/zitadel/main/deploy/compose/docker-compose.yml
   curl -LO https://raw.githubusercontent.com/zitadel/zitadel/main/deploy/compose/.env.example
   ```

1. Copy the example environment to `.env`. The defaults are fine for a local trial; review them before any real deployment.

   ```bash
   cp .env.example .env
   ```

1. Start the stack and wait for the containers to become healthy.

   ```bash
   docker compose up -d --wait
   ```

1. Open the Console in a browser at the address printed in the Compose output (the local default is `http://localhost:8080/ui/console`) and sign in with the initial admin credentials from the docs ([Compose deploy](https://zitadel.com/docs/self-hosting/deploy/compose)).

## Verify it works

Check that the containers are up and healthy, then confirm the API responds:

```bash
docker compose ps
curl -s http://localhost:8080/debug/healthz
```

A healthy stack shows the ZITADEL container as running, and the health endpoint returns a success response. From there, the Console UI lets you create your first organization, project, and application.

## Where to go next

- [Compose deployment guide](https://zitadel.com/docs/self-hosting/deploy/compose) for the full local setup and TLS notes.
- [Kubernetes self-hosting](https://zitadel.com/docs/self-hosting/deploy/kubernetes) via the Helm chart for production.
- [API introduction](https://zitadel.com/docs/apis/introduction) to script organizations, projects, and users over gRPC, connectRPC, or HTTP/JSON.

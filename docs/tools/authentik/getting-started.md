# Getting Started

> Verified against the Docker Compose install from the official docs. Commands assume a Linux host with Docker and Docker Compose, roughly 2 CPU and 2 GB RAM.

## Prerequisites

- A host with Docker and the Docker Compose plugin.
- About 2 CPU cores and 2 GB of RAM.
- `openssl` for generating secrets.

## Install

The Compose file bundles PostgreSQL and Redis, so no external database is required ([docs](https://docs.goauthentik.io/install-config/install/docker-compose)).

```bash
curl -O https://docs.goauthentik.io/compose.yml
```

## A first working setup

1. Download the Compose file (above).

1. Generate the required secrets into a `.env` file next to `compose.yml`.

```bash
echo "PG_PASS=$(openssl rand -base64 36 | tr -d '\n')" >> .env
echo "AUTHENTIK_SECRET_KEY=$(openssl rand -base64 60 | tr -d '\n')" >> .env
```

1. Pull the images and start the stack.

```bash
docker compose pull
docker compose up -d
```

1. Open the initial setup page and create the first administrator account (`akadmin`).

```text
http://<your-host>:9000/if/flow/initial-setup/
```

## Verify it works

Confirm the containers are running, then load the UI:

```bash
docker compose ps
```

Browse to `http://<your-host>:9000`; a healthy install shows the login flow, and after the initial setup you reach the admin interface. The setup flow itself is rendered by the same flow executor described in [Architecture](./architecture).

## Where to go next

For production concerns (TLS termination, high availability, external PostgreSQL/Redis, hardening, and configuring outposts for forward-auth in front of Traefik/nginx/Envoy), see the [official documentation](https://docs.goauthentik.io/). For how flows and policies are evaluated under the hood, see [Internals](./internals).

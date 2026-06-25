# Getting Started

> Verified against `26.6.3`. Commands assume Docker is installed and port 8080 is free.

## Prerequisites

- Docker (or Podman) to run the container image.
- A free local port 8080 for the HTTP listener and Admin Console.

## Install

The fastest path is the official container image. No local build is needed.

```bash
docker pull quay.io/keycloak/keycloak:26.6.3
```

## A first working setup

This starts Keycloak in development mode: no persistence, plain HTTP, and an initial admin account. The `KC_BOOTSTRAP_ADMIN_*` variables seed that account (`docs/documentation/server_admin/topics/assembly-creating-first-admin.adoc:22-27`).

Start the server with `start-dev`.

```bash
docker run -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.6.3 start-dev
```

Then:

1. Open the Admin Console at `http://localhost:8080` and log in with `admin` / `admin`.
2. Create a realm.
3. Create a client to start issuing tokens for an application.

## Verify it works

Watch the startup log for the running message; the server prints `The server is running` once Quarkus has bootstrapped (`quarkus/runtime/src/main/java/org/keycloak/quarkus/runtime/KeycloakMain.java:63`). Then confirm the Admin Console responds at `http://localhost:8080` and that you can log in.

## Where to go next

Development mode is not for production. For a real deployment, use the two-phase model: `kc.sh build` fixes build-time options, then `kc.sh start` applies the database, hostname, and TLS settings. See the [getting-started Docker guide](https://www.keycloak.org/getting-started/getting-started-docker) and the [Quarkus migration doc](https://www.keycloak.org/migration/migrating-to-quarkus) for production concerns such as database, hostname, TLS, and HA.

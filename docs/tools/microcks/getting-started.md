# Getting Started

> Verified against the Docker Compose install at commit `24db054`. Commands assume Docker with the Compose plugin.

## Prerequisites

- Docker installed and running.
- The Docker Compose plugin (`docker-compose` / `docker compose`).
- Free local ports `8080` (UI and REST), `9090` (gRPC), and `18080` (Keycloak).

## Install

The simplest setup uses the Compose stack in the repository (source 9). Clone the repo and start the stack:

```bash
git clone https://github.com/microcks/microcks.git
cd microcks/install/docker-compose
docker-compose up -d
```

This starts MongoDB (`microcks-db`), Keycloak (`microcks-sso`, host port `18080`), a Postman runtime, and the Microcks core (`microcks`, host ports `8080` and `9090`), all defined in `install/docker-compose/docker-compose.yml`.

## A first working setup

1. Open the UI at the address below and log in through Keycloak.

   The UI is served at `http://localhost:8080` and redirects to the Keycloak login page (source 9).

2. Use the default credentials from the README (`README.md`):

   ```text
   Username: admin
   Password: microcks123
   ```

3. Import an API artifact. In the UI, add a sample OpenAPI or Postman collection (or point an importer at a URL). Microcks reads the examples in the artifact and immediately publishes them as live mock endpoints under `/rest/{service}/{version}/...`, served by `RestController` (`webapp/src/main/java/io/github/microcks/web/RestController.java:97-107`).

## Verify it works

Check the health endpoint exposed by the core container; the Compose healthcheck uses the same path (`docker-compose.yml:64`):

```bash
curl -f http://localhost:8080/api/health
```

A successful response and a reachable UI at `http://localhost:8080` confirm the stack is up. After importing a sample API, calling its generated mock URL should return the example response from the spec.

## Where to go next

For event-driven (AsyncAPI) mocking, add the async minion and a broker with the `async-addon.yml` overlay in the same `install/docker-compose` directory. For production concerns such as Kubernetes deployment (the Operator and Helm chart), high availability, and authentication hardening, see the official documentation at [microcks.io/documentation](https://microcks.io/documentation/).

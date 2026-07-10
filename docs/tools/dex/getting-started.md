# Getting Started

> Based on the repository at commit `17a54e9`. Commands assume a Unix shell with Go 1.25 installed.

## Prerequisites

- Go 1.25 or newer, or Docker if you prefer the container image.
- A downstream OIDC client to test against. The repository ships an `example-app` you can build from source.

## Install

Build the `dex` binary from the repository:

```bash
git clone https://github.com/dexidp/dex.git
cd dex
make build
# produces ./bin/dex
```

A container image is also published, so `docker pull ghcr.io/dexidp/dex` is an alternative to building.

## A first working setup

The shortest working provider uses the SQLite storage and a mock connector, so no upstream identity provider is needed. The repository's `config.dev.yaml` is exactly this.

**Step 1: point Dex at the sample config.** It declares an issuer, SQLite storage, one static client (`example-app`), and a `mockCallback` connector that logs in a canned user without contacting any upstream:

```yaml
issuer: http://127.0.0.1:5556/dex
storage:
  type: sqlite3
  config:
    file: var/sqlite/dex.db
web:
  http: 127.0.0.1:5556
staticClients:
  - id: example-app
    redirectURIs:
      - 'http://127.0.0.1:5555/callback'
    name: 'Example App'
    secret: ZXhhbXBsZS1hcHAtc2VjcmV0
connectors:
  - type: mockCallback
    id: mock
    name: Example
```

**Step 2: start the server:**

```bash
./bin/dex serve config.dev.yaml
```

**Step 3: build and run the example client** in another terminal, then open it in a browser to drive a full login:

```bash
make examples
./bin/example-app
# open http://127.0.0.1:5555
```

Clicking login redirects to Dex, the mock connector logs you in, and the example app receives and displays the issued ID Token.

## Verify it works

Confirm the provider is up by fetching its discovery document. It should return JSON describing the issuer and endpoints:

```bash
curl http://127.0.0.1:5556/dex/.well-known/openid-configuration
```

A healthy Dex also serves its public signing keys at `/dex/keys`, which is what downstream clients use to verify the ID Token signature.

## Where to go next

Replace the mock connector with a real one (LDAP, SAML, GitHub, Google, or generic OIDC) and switch storage to Postgres, etcd, or Kubernetes CRDs for anything beyond a test. For production concerns such as high availability, key rotation, and connector configuration, follow the official documentation rather than re-deriving it here.

## Sources

- [Dex documentation: getting started](https://dexidp.io/docs/getting-started/)
- [Dex `config.dev.yaml`](https://github.com/dexidp/dex/blob/17a54e9046cee1142530de4d0a809809d7c9cee9/config.dev.yaml)

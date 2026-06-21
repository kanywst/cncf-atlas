# Getting Started

> Verified against the `ghcr.io/permify/permify` container at commit `aa3a7c6`. Commands assume Docker and a terminal.

## Prerequisites

- Docker (to run the container) or a Go 1.25+ toolchain to build from source.
- A free TCP port for REST (3476) and one for gRPC (3478).
- PostgreSQL is optional for a first run; the default starts with an in-memory store (`README.md:100-114`).

## Install

The fastest path is the container. It starts with an in-memory store and no external dependencies.

```bash
docker run -p 3476:3476 -p 3478:3478 ghcr.io/permify/permify serve
```

To build from source instead:

```bash
go build ./cmd/permify
./permify serve
```

## A first working setup

This runs Permify and reaches its API. The default configuration serves REST on 3476 and gRPC on 3478, storing authorization data in memory (`README.md:104-114`).

Start the server with the install command above. Then:

1. Confirm the API answers (see "Verify it works" below).
2. Write a schema, insert relationships (and attributes for ABAC), then ask `Check`. This is the minimal authorization loop.

The server exposes both REST (3476) and gRPC (3478). The Playground under `playground/` is the quickest way to author a schema and try checks before wiring an SDK from `sdk/`.

## Verify it works

Permify exposes a health endpoint on the REST port. A running server answers:

```bash
curl localhost:3476/healthz
```

This is the connection test the project documents (`README.md:116-121`).

## Where to go next

- Production data: switch the in-memory store for PostgreSQL and run `permify migrate` (registered in `cmd/permify/permify.go`).
- Distributed deployment: the binary registers a consistent-hash gRPC balancer and the Kubernetes resolver at startup (`cmd/permify/permify.go:16-17`).
- Configuration, schema language, and API reference live in the official documentation linked from the README (`README.md:113-114`).

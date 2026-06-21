# Getting Started

> Verified against the documented commit `4bb1d7b3` (near `v1.54.0`). Commands assume Docker, or Homebrew on macOS/Linux, plus `curl`.

## Prerequisites

- Docker, or Homebrew (`brew`), to install the server.
- `curl` to call the HTTP API in the examples below.

## Install

With Homebrew (macOS and Linux), the official tap ships both the server and the `zed` CLI:

```bash
brew install authzed/tap/spicedb authzed/tap/zed
```

Debian-based and RPM-based Linux can install `spicedb` and `zed` from the AuthZed APT/YUM repositories instead (see the README for the repository setup).

## A first working setup

The shortest path is the in-memory datastore, which needs no external database. It is for development and testing only.

1. Start a server with the in-memory store, exposing gRPC (50051) and HTTP (8443), using a preshared key as the API token:

```bash
docker run --rm -p 50051:50051 -p 8443:8443 authzed/spicedb \
  serve --http-enabled true --grpc-preshared-key "somerandomkeyhere"
```

1. Write a schema defining `user`, `folder`, and `document` with a `view` permission:

```bash
curl --location 'http://localhost:8443/v1/schema/write' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer somerandomkeyhere' \
  --data '{
    "schema": "definition user {} \n definition folder { \n relation parent: folder\n relation viewer: user \n permission view = viewer + parent->view \n } \n definition document {\n relation folder: folder \n relation viewer: user \n permission view = viewer + folder->view \n }"
  }'
```

1. Write a relationship: `anne` is a viewer of `folder:budget`:

```bash
curl --location 'http://localhost:8443/v1/relationships/write' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer somerandomkeyhere' \
  --data '{
    "updates": [
      {
        "operation": "OPERATION_TOUCH",
        "relationship": {
          "resource": { "objectType": "folder", "objectId": "budget" },
          "relation": "viewer",
          "subject": { "object": { "objectType": "user", "objectId": "anne" } }
        }
      }
    ]
  }'
```

## Verify it works

Ask whether `anne` may `view` `folder:budget`:

```bash
curl --location 'http://localhost:8443/v1/permissions/check' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer somerandomkeyhere' \
  --data '{
    "consistency": { "minimizeLatency": true },
    "resource": { "objectType": "folder", "objectId": "budget" },
    "permission": "view",
    "subject": { "object": { "objectType": "user", "objectId": "anne" } }
  }'
```

A working setup returns `PERMISSIONSHIP_HAS_PERMISSION`:

```text
{
    "checkedAt": { "token": "GhUKEzE3NTE1NjYwMjUwMDAwMDAwMDA=" },
    "permissionship": "PERMISSIONSHIP_HAS_PERMISSION"
}
```

## Where to go next

For production, drop the in-memory store and pick a real backend with `--datastore-engine` (PostgreSQL, MySQL, CockroachDB, or Spanner). The AuthZed docs cover schema design, the `zed` CLI, consistency and ZedToken, the Watch API, and operating SpiceDB in a cluster with dispatch fan-out.

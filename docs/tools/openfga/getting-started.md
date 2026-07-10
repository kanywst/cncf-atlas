# Getting Started

> Verified against `v1.18.0`. Commands assume Docker and `curl`, with the in-memory datastore (data is discarded when the server stops).

## Prerequisites

- Docker (or Homebrew, or a Go toolchain) to run the `openfga` binary.
- `curl` to talk to the HTTP API on port 8080.

## Install

The fastest path is the Docker image with the in-memory datastore and Playground (1):

```bash
docker run -p 8080:8080 -p 3000:3000 openfga/openfga run
```

Alternatives from the README (1):

```bash
# Homebrew
brew install openfga
openfga run

# go install
go install github.com/openfga/openfga/cmd/openfga
openfga run
```

The default in-memory store needs no migration. For PostgreSQL, MySQL, or SQLite, run `openfga migrate` to create the schema, then start with the matching `--datastore-engine`. HTTP listens on 8080, gRPC on 8081, and the Playground on 3000 (1).

## A first working setup

1. Create a store.

   ```bash
   curl -X POST 'localhost:8080/stores' \
     --header 'Content-Type: application/json' \
     --data-raw '{"name": "openfga-demo"}'
   ```

A successful response returns the store, for example (1):

```json
{
  "id": "01G3EMTKQRKJ93PFVDA1SJHWD2",
  "name": "openfga-demo",
  "created_at": "2022-05-19T17:11:12.888680Z",
  "updated_at": "2022-05-19T17:11:12.888680Z"
}
```

1. Save the returned `id` and write a minimal authorization model (a `document` type with a `viewer` relation, in the JSON form the API accepts).

   ```bash
   STORE=01G3EMTKQRKJ93PFVDA1SJHWD2
   curl -X POST "localhost:8080/stores/$STORE/authorization-models" \
     --header 'Content-Type: application/json' \
     --data-raw '{
       "schema_version": "1.1",
       "type_definitions": [
         { "type": "user" },
         { "type": "document",
           "relations": { "viewer": { "this": {} } },
           "metadata": { "relations": { "viewer": { "directly_related_user_types": [ { "type": "user" } ] } } }
         }
       ]
     }'
   ```

1. Write a relationship tuple granting `user:alice` the `viewer` relation on `document:1`.

   ```bash
   curl -X POST "localhost:8080/stores/$STORE/write" \
     --header 'Content-Type: application/json' \
     --data-raw '{
       "writes": { "tuple_keys": [
         { "user": "user:alice", "relation": "viewer", "object": "document:1" }
       ] }
     }'
   ```

1. Ask a Check question.

   ```bash
   curl -X POST "localhost:8080/stores/$STORE/check" \
     --header 'Content-Type: application/json' \
     --data-raw '{
       "tuple_key": { "user": "user:alice", "relation": "viewer", "object": "document:1" }
     }'
   ```

The response is the authorization decision:

```json
{ "allowed": true }
```

## Verify it works

- The Check in step 4 returns `{"allowed": true}` for `user:alice` and `{"allowed": false}` for a user with no matching tuple.
- The Playground is served at `http://localhost:3000/playground` when the server is run with the defaults above.

## Where to go next

For persistent storage, performance tuning, and a secure production deployment, see the official [Running in Production](https://openfga.dev/docs/getting-started/running-in-production) guide and the broader [OpenFGA documentation](https://openfga.dev/) (6). The DSL, SDKs, and the `fga` CLI are documented there rather than re-covered here.

# Getting Started

> Verified against flagd `v0.16.0` (commit `80b9e95`). Commands assume Docker and a local shell.

## Prerequisites

- Docker (the published image is `ghcr.io/open-feature/flagd`).
- A local port free for the evaluation service (`8013`) and OFREP (`8016`).
- `curl` to test the OFREP REST endpoint.

## Install

The simplest path is the container image; no build step is needed (6).

```bash
docker pull ghcr.io/open-feature/flagd:latest
```

To build from source instead, the repository uses a Go workspace and a Makefile target (`make build` produces the `flagd` binary) (1).

## A first working setup

1. Write a flag definition file `flags.json` in the current directory. `state` enables the flag, `variants` lists the possible values, and `defaultVariant` is returned when no targeting matches.

   ```json
   {
     "flags": {
       "show-welcome-banner": {
         "state": "ENABLED",
         "variants": {
           "on": true,
           "off": false
         },
         "defaultVariant": "off"
       }
     }
   }
   ```

1. Start flagd, mounting the file and passing it as a `file:` sync source. The default flag ports are `8013` (evaluation), `8014` (management), `8015` (gRPC sync), and `8016` (OFREP) (`flagd/cmd/start.go:53-56`).

   ```bash
   docker run --rm -it \
     -p 8013:8013 -p 8016:8016 \
     -v "$(pwd)":/etc/flagd \
     ghcr.io/open-feature/flagd:latest \
     start --uri file:/etc/flagd/flags.json
   ```

1. Evaluate the flag over OFREP (the REST evaluation API). An empty context evaluates with no targeting input.

   ```bash
   curl -X POST http://localhost:8016/ofrep/v1/evaluate/flags/show-welcome-banner \
     -H 'Content-Type: application/json' \
     -d '{"context": {}}'
   ```

The response carries the resolved value and a reason. With no targeting rule, the reason is `STATIC` and the value is the `defaultVariant` (`core/pkg/evaluator/json.go:420`).

## Verify it works

- The OFREP call above should return the `off` variant value (`false`) with reason `STATIC`.
- Add a `targeting` JSONLogic rule to the flag and re-evaluate with a matching context; the reason changes to `TARGETING_MATCH` (`core/pkg/evaluator/json.go:401-406`).
- A disabled flag (`"state": "DISABLED"`) returns reason `DISABLED` (`core/pkg/evaluator/json.go:349-352`).

## Where to go next

- flagd documentation for sync sources beyond files (HTTP, Kubernetes CRD, gRPC, and blob storage) and the OpenFeature Operator for sidecar injection (1)(12).
- The OpenFeature SDKs to call flagd from application code through a provider, rather than raw OFREP (5).
- Official docs for production concerns such as TLS, OpenTelemetry export, and the flagd-proxy for fan-out (1)(12).

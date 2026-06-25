# Getting Started

> Verified against `v1.21.1`. Commands assume Docker (v20.10+) and Docker Compose (v2.30+).

## Prerequisites

- Docker and Docker Compose installed.
- About 4 GB RAM and 10 GB disk free.
- Linux, macOS, or Windows with WSL2.

## Install

Cortex ships as a binary and as a container image at `quay.io/cortexproject/cortex`. The fastest path to a working setup is the Docker Compose bundle in the repository, which runs Cortex in single-binary mode together with Prometheus, Grafana, and SeaweedFS (S3-compatible storage).

```bash
git clone https://github.com/cortexproject/cortex.git
cd cortex/docs/getting-started
```

## A first working setup

This brings up Cortex (`-target=all`), Prometheus remote-writing into it, S3-compatible storage, and Grafana for queries.

1. Start the bundled stack.

   ```bash
   docker compose up -d
   ```

2. Compose pulls images, starts SeaweedFS, initializes S3 buckets, then starts Cortex, Prometheus, and Grafana. Prometheus scrapes itself and remote-writes the samples to Cortex at `/api/v1/push`.

3. To run Cortex directly instead of via the bundle, use single-binary mode with a config file (a local blocks-storage example ships at `docs/configuration/single-process-config-blocks-local.yaml`).

   ```bash
   cortex -target=all -config.file=./single-process-config-blocks-local.yaml
   ```

## Verify it works

- Cortex serves a readiness endpoint at `/ready`; a healthy instance returns HTTP 200.

```bash
curl -s http://localhost:9009/ready
```

- In Grafana, add Cortex as a Prometheus data source and query a metric such as `up` to confirm samples are stored and queryable.
- Multi-tenant requests require the `X-Scope-OrgID` header, because auth is enabled by default (`pkg/cortex/cortex.go:151`). Local URLs such as `http://localhost:9009` are placeholders for your own deployment.

## Where to go next

- The repository's `docs/getting-started/single-binary.md` walks through the full Compose tutorial, including recording rules and Alertmanager.
- For production concerns (HA, security hardening, scaling each module independently), see the configuration docs under `docs/configuration/` and the microservices guide in `docs/getting-started/microservices.md`.

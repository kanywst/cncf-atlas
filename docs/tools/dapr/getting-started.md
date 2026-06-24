# Getting Started

> Verified against Dapr v1.18.1 (runtime at commit `9f2dcfd9`). Commands assume a self-hosted setup with Docker running.

## Prerequisites

- Docker (the default `dapr init` deploys the control-plane containers there).
- The Dapr CLI (`dapr/cli`), installed below.

## Install

Install the CLI, then initialize the runtime. The init step pulls the sidecar image and starts the placement, scheduler, and Redis containers in Docker.

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | /bin/bash
dapr init
```

## A first working setup

The shortest path is to run any process with a sidecar and call it through the service-invocation API.

1. Start an app with a sidecar. Replace the trailing command with your own; here a Python HTTP server stands in for the app.

```bash
dapr run --app-id myapp --app-port 8080 -- python3 -m http.server 8080
```

1. Call the app through its sidecar. The runtime listens on HTTP port `3500` by default, so a service-invocation request to app ID `myapp` looks like the command below. The host is the local sidecar, addressed as `localhost:3500`.

```bash
curl http://127.0.0.1:3500/v1.0/invoke/myapp/method/
```

The sidecar resolves the target by app ID, applies any resiliency policy, and forwards the call to your app on its `--app-port` (`pkg/api/http/directmessaging.go:97`).

## Verify it works

- Confirm the runtime version: `daprd --version` prints the build version and exits (`cmd/daprd/app/app.go:65`).
- List running Dapr apps and their sidecars: `dapr list`.
- Check the control-plane containers: `docker ps` should show the placement, scheduler, and Redis containers created by `dapr init`.

## Where to go next

For Kubernetes, run `dapr init -k` to install the injector, operator, sentry, placement, and scheduler, then annotate pods with `dapr.io/enabled: "true"` so the sidecar is injected. The official docs at [docs.dapr.io](https://docs.dapr.io/) cover production concerns such as HA mode, mTLS hardening, and the full building-block API reference.

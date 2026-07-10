# Getting Started

> Based on the `flux bootstrap github` flow at commit `65d975b` (nearest tag `v2.8.8`). Commands assume a working `kubectl` context and a GitHub account.

## Prerequisites

- A Kubernetes cluster you can reach with `kubectl`.
- A GitHub account and a personal access token with repo scope.
- The `flux` CLI (installed below).

## Install

```bash
brew install fluxcd/tap/flux
```

The Makefile builds the same binary from source with `CGO_ENABLED=0 go build -ldflags="-s -w -X main.VERSION=..." -o ./bin/flux ./cmd/flux` (`Makefile:57`).

## A first working setup

The shortest path is `flux bootstrap github`, which creates the repository if needed, installs the controllers into `flux-system`, and commits a self-syncing `Kustomization` (`cmd/flux/bootstrap_github.go:39`).

1. Check the cluster meets Flux's prerequisites.

   ```bash
   flux check --pre
   ```

1. Export a GitHub token. Flux reads it from the `GITHUB_TOKEN` environment variable (`cmd/flux/bootstrap_github.go:115`).

   ```bash
   export GITHUB_TOKEN=<your-token>
   ```

1. Bootstrap. This creates the repo, installs the controllers, and commits the sync configuration. The default reconcile interval is one minute.

   ```bash
   flux bootstrap github \
     --owner=<organization> \
     --repository=<repository name> \
     --path=clusters/my-cluster
   ```

## Verify it works

Confirm the controllers are healthy and the sync objects are reconciling.

```bash
flux check
flux get kustomizations
```

The `flux-system` Kustomization should report a `Ready` condition with the latest commit revision. Internally, bootstrap waits on the same signal by comparing the expected revision against `status.lastAttemptedRevision` (`pkg/bootstrap/bootstrap.go:268`).

## Where to go next

From here, commit Kubernetes manifests under your cluster path and they reconcile automatically. For production concerns such as high availability, multi-tenancy, image automation, and SOPS secret decryption, see the official documentation at [fluxcd.io](https://fluxcd.io/).

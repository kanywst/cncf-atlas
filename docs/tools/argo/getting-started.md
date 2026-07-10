# Getting Started

> Based on the official Getting Started guide (source 8). Commands assume a running Kubernetes cluster and `kubectl` configured against it.

## Prerequisites

- A Kubernetes cluster you can reach with `kubectl`.
- The `kubectl` CLI.
- The `argocd` CLI (install per the official docs) for login and app management.

## Install

Create the namespace and apply the upstream install manifests from the `stable` branch (source 8).

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

The manifest set lives under `manifests/` in the repo.

## A first working setup

1. Wait for the core pods to come up.

   ```bash
   kubectl wait --for=condition=available --timeout=300s \
     deployment/argocd-server -n argocd
   ```

1. Get the initial admin password and expose the API server locally.

   ```bash
   argocd admin initial-password -n argocd
   kubectl port-forward svc/argocd-server -n argocd 8080:443
   ```

The port-forward serves the UI and API on the local address `localhost:8080`.

1. Log in and register an Application that points at a Git repo path.

   ```bash
   argocd login localhost:8080
   argocd app create guestbook \
     --repo https://github.com/argoproj/argocd-example-apps.git \
     --path guestbook \
     --dest-server https://kubernetes.default.svc \
     --dest-namespace default
   ```

1. Sync it so the controller applies the manifests.

   ```bash
   argocd app sync guestbook
   ```

## Verify it works

Check the app reports `Synced` and `Healthy`:

```bash
argocd app get guestbook
```

Look for `Sync Status: Synced` and `Health Status: Healthy` in the output. You can also watch the controller reconcile in the api-server UI at `localhost:8080`.

## Where to go next

For production concerns such as high availability, declarative setup, SSO, RBAC, and scaling the repo-server and controller, see the [official Argo CD documentation](https://argo-cd.readthedocs.io/en/stable/). This guide intentionally stops at a single non-HA install.

# Getting Started

> Based on the official Kubernetes quick start ([source 9](https://d7y.io/docs/getting-started/quick-start/kubernetes/)). Commands assume a working Kubernetes cluster and Helm 3.

## Prerequisites

- A Kubernetes cluster with `kubectl` configured.
- Helm 3 installed.
- containerd as the node runtime, since the mirror configuration below targets containerd.

## Install

Add the chart repository and update:

```bash
helm repo add dragonfly https://dragonflyoss.github.io/helm-charts/
helm repo update
```

## A first working setup

The chart deploys the full set of roles: manager, scheduler, seed peer, and the `dfdaemon` client as a DaemonSet.

1. Install Dragonfly into its own namespace.

   ```bash
   helm install --create-namespace --namespace dragonfly-system dragonfly dragonfly/dragonfly
   ```

2. Point containerd at the Dragonfly proxy as a registry mirror so image pulls flow through Dragonfly. The chart documents the mirror configuration; apply it on each node and restart containerd. See the quick start for the exact `config.toml` snippet ([source 9](https://d7y.io/docs/getting-started/quick-start/kubernetes/)).

3. Pull an image as usual. The pull now goes through the Dragonfly peer, which fetches pieces from peers or seed peers and falls back to the origin only when needed.

## Verify it works

Confirm the pods are running:

```bash
kubectl get pods --namespace dragonfly-system
```

You should see the manager, scheduler, seed-peer, and `dfdaemon` pods in `Running` state. To confirm pulls are being accelerated, pull the same image on a second node and check the `dfdaemon` logs for piece downloads served from peers rather than the origin.

## Where to go next

For production concerns such as high availability, the database backing the manager, TLS between roles, and tuning the scheduler, see the official Dragonfly documentation ([source 9](https://d7y.io/docs/getting-started/quick-start/kubernetes/)). For AI model distribution with `hf://` and `modelscope://` sources, see the CNCF write-up ([source 8](https://www.cncf.io/blog/2026/04/06/peer-to-peer-acceleration-for-ai-model-distribution-with-dragonfly/)).

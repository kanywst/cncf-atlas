# Getting Started

> Verified against `v0.43.0`. Commands assume a running Kubernetes cluster, `kubectl` configured for it, and Helm 3.

## Prerequisites

- A Kubernetes cluster you can reach, with `kubectl` pointed at it.
- Helm 3 for the in-cluster install shown here.
- Permission to create a service account and a cluster role binding in `kube-system` (for the first token).

## Install

Add the Headlamp Helm repository and install the chart into `kube-system`:

```bash
helm repo add headlamp https://kubernetes-sigs.github.io/headlamp/
helm install my-headlamp headlamp/headlamp --namespace kube-system
```

For a local machine instead of a cluster, Headlamp also ships as a desktop app (Linux, macOS, Windows) from the [downloads page](https://headlamp.dev/). The desktop app reads your local kubeconfig directly.

## A first working setup

The in-cluster deployment needs two things to be useful: a way to reach it in the browser, and a token to log in with. This is the shortest path to both.

1. Port-forward the Headlamp service to your machine.

   ```bash
   kubectl port-forward -n kube-system service/headlamp 8080:80
   ```

1. Create a service account and give it cluster-admin rights (tighten this with RBAC for anything beyond a first look).

   ```bash
   kubectl -n kube-system create serviceaccount headlamp-admin
   kubectl create clusterrolebinding headlamp-admin \
     --serviceaccount=kube-system:headlamp-admin --clusterrole=cluster-admin
   ```

1. Mint a token for that account.

   ```bash
   kubectl create token headlamp-admin -n kube-system
   ```

1. Open `http://localhost:8080` in your browser and paste the token to log in.

## Verify it works

Once logged in, Headlamp lists your cluster's namespaces and workloads. A quick confirmation that the backend proxy is working end to end: open the Pods view under `kube-system`. If Pods load, the frontend reached the backend, the backend attached your token, and the reverse proxy forwarded to the kube-apiserver and returned the list. An empty view with an authorization error instead means the token is valid but the account lacks rights, since the cluster (not Headlamp) enforces access.

## Where to go next

For production concerns such as OIDC login (Dex, Keycloak, Azure Entra ID, EKS), ingress and base-URL setup, plugin management through the sidecar, and Cluster Inventory-based multi-cluster discovery, follow the official documentation at <https://headlamp.dev/docs/latest/installation/>. To build a plugin, start from the `@kinvolk/headlamp-plugin` SDK and its `pluginctl` CLI.

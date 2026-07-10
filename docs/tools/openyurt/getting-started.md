# Getting Started

> Verified against `v1.7.0`. Commands assume an existing cloud Kubernetes cluster, `kubectl`, and `helm`.

## Prerequisites

- A running Kubernetes control plane in the cloud. OpenYurt is certified up to Kubernetes 1.34 (`README.md:53`).
- `kubectl` configured against that cluster.
- `helm` for installing the control-plane components.
- One or more edge machines that can reach the apiserver, to join as edge nodes.

## Install

OpenYurt installs in two parts: the control-plane components in the cloud, then the edge nodes. The control plane is installed with the bundled Helm charts (`charts/yurt-manager`, `charts/yurthub`).

```bash
helm repo add openyurt https://openyurtio.github.io/charts
helm repo update
helm upgrade --install yurt-manager openyurt/yurt-manager --namespace kube-system
```

## A first working setup

1. Install the Yurt-Manager controllers and webhooks into the cloud cluster (the `helm upgrade --install` command above).

1. Join an edge node with `yurtadm`. Run this on the edge machine, pointing at the cloud apiserver:

   ```bash
   yurtadm join <apiserver-host>:<port> \
     --token=<bootstrap-token> \
     --node-type=edge
   ```

1. To detach a node later, run `yurtadm reset` on that node. The join and reset commands live under `pkg/yurtadm/cmd/`.

## Verify it works

Confirm the edge node registered with the cloud control plane:

```bash
kubectl get nodes -o wide
```

The joined node should appear with edge labels. Check that YurtHub is running on the node as a static pod and that Yurt-Manager pods are healthy in `kube-system`:

```bash
kubectl -n kube-system get pods | grep -E 'yurt-manager|yurt-hub'
```

## Where to go next

The official two-part installation guide covers control-plane components and node joining in detail: [OpenYurt installation summary](https://openyurt.io/docs/installation/summary). For how YurtHub serves cache during disconnection, see the [YurtHub core concept](https://openyurt.io/docs/next/core-concepts/yurthub). Production concerns such as HA control planes, certificate management, and cross-region networking with Raven are documented upstream.

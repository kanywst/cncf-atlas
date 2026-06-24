# Getting Started

> Verified against `v1.23.0`. Commands assume an existing Kubernetes cluster on the cloud side and a separate edge node with root access.

## Prerequisites

- A running Kubernetes cluster reachable from the cloud host, with a working kubeconfig.
- A separate edge machine that can reach the cloud host's port 10000.
- The `keadm` CLI on both the cloud host and the edge node.

## Install

Download `keadm` from the release page, or build it from source:

```bash
git clone https://github.com/kubeedge/kubeedge.git
cd kubeedge
make all WHAT=keadm
```

The installer CLI exposes `init`, `gettoken`, and `join` (`keadm/cmd/keadm/app/cmd/cloud/init.go:51`, `keadm/cmd/keadm/app/cmd/edge/join.go:61`).

## A first working setup

1. On the cloud host, bootstrap `cloudcore` against your cluster. `keadm init` installs it via Helm.

```bash
keadm init --advertise-address="<cloud-host-ip>"
```

1. Read the join token that `cloudcore` generated.

```bash
keadm gettoken
```

1. On the edge node, join the cluster by pointing at the cloud host's CloudHub port (10000) and passing the token from step 2.

```bash
keadm join \
  --cloudcore-ipport="<cloud-host-ip>:10000" \
  --token="<token-from-gettoken>"
```

This installs and starts `edgecore` on the node (`keadm/cmd/keadm/app/cmd/edge/join.go:61`).

## Verify it works

From the cloud host, the edge node should appear as a Kubernetes node:

```bash
kubectl get nodes
```

On the edge node, confirm the agent is running and check its logs for the keepalive ping to the cloud:

```bash
systemctl status edgecore
journalctl -u edgecore
```

A healthy edge node reports `Ready` in `kubectl get nodes` and keeps that status because `edgehub` sends a periodic keepalive over the cloud link (`edge/pkg/edgehub/process.go:106-128`).

## Where to go next

The official [keadm install guide](https://kubeedge.io/docs/setup/install-with-keadm) covers TLS certificates, QUIC versus WebSocket, high availability for `cloudcore`, and device management setup. Use it for production hardening rather than the minimal flow above.

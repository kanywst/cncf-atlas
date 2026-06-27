# Getting Started

> Verified against the v2.6.2 manifest. Commands assume a running Kubernetes cluster and a working `kubectl`.

## Prerequisites

- Kubernetes 1.23 or later.
- The Node IPAM controller enabled so nodes get a pod CIDR. With kubeadm, pass
  `--pod-network-cidr <cidr>` at `kubeadm init`.
- The Open vSwitch (OVS) kernel module available on each node (loaded by the
  Antrea agent's init container on most distributions).

## Install

Apply the released manifest for a pinned tag. This deep-dive uses v2.6.2:

```bash
kubectl apply -f https://github.com/antrea-io/antrea/releases/download/v2.6.2/antrea.yml
```

This matches the released install path documented upstream
(`docs/getting-started.md:79`).

## A first working setup

1. Apply the Antrea manifest (the controller Deployment and the agent
   DaemonSet land in `kube-system`).

    ```bash
    kubectl apply -f https://github.com/antrea-io/antrea/releases/download/v2.6.2/antrea.yml
    ```

2. Wait for the agent DaemonSet to be ready on every node.

    ```bash
    kubectl -n kube-system rollout status ds/antrea-agent
    ```

3. Run a couple of pods to confirm they get IPs and can reach each other.

    ```bash
    kubectl run web --image=nginx
    kubectl run client --image=busybox --command -- sleep 3600
    kubectl get pods -o wide
    ```

To track `main` instead of a release, the project also publishes the checked-in
manifest (`docs/getting-started.md:86`):

```bash
kubectl apply -f https://raw.githubusercontent.com/antrea-io/antrea/main/build/yamls/antrea.yml
```

## Verify it works

Confirm the controller and the per-node agents are running:

```bash
kubectl -n kube-system get pods -l app=antrea
```

Each agent pod should be `Running` with all containers ready, and the
`antrea-controller` Deployment should report one ready replica. A test pod
created above should show an IP from the pod CIDR in `kubectl get pods -o wide`.

## Where to go next

- Antrea Getting started for cluster-specific notes and IPsec/encryption setup
  ([source 7](https://antrea.io/docs/main/docs/getting-started)).
- Antrea Architecture and Design for the data-plane internals
  ([source 9](https://github.com/antrea-io/antrea/blob/main/docs/design/architecture.md)).
- The Antrea NetworkPolicy, Egress, and Flow Aggregator guides in the
  repository `docs/` for production policy, source-IP control, and flow export.

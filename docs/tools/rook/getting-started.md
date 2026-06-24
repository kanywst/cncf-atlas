# Getting Started

> Verified against the `master` example manifests at commit `63eed4e`. Commands assume a running Kubernetes cluster and `kubectl` configured against it.

## Prerequisites

- A Kubernetes cluster with nodes that have raw block devices or unformatted partitions available for Ceph OSDs.
- `kubectl` with cluster-admin access.
- Optionally `helm` if you prefer the chart-based install.

## Install

Apply the three operator manifests from `deploy/examples` in order:

```bash
git clone https://github.com/rook/rook.git
kubectl apply -f rook/deploy/examples/crds.yaml
kubectl apply -f rook/deploy/examples/common.yaml
kubectl apply -f rook/deploy/examples/operator.yaml
```

The Helm path is equivalent: install the `rook-ceph` chart for the operator, then the `rook-ceph-cluster` chart for the cluster ([Getting Started](https://rook.github.io/docs/rook/latest-release/Getting-Started/intro/)).

## A first working setup

1. Confirm the operator pod is running.

   ```bash
   kubectl -n rook-ceph get pod -l app=rook-ceph-operator
   ```

2. Create the cluster. Use `cluster.yaml` for a real multi-node cluster, or `cluster-test.yaml` for a single-node test setup.

   ```bash
   kubectl apply -f rook/deploy/examples/cluster.yaml
   ```

3. Deploy the toolbox pod so you can run Ceph commands.

   ```bash
   kubectl apply -f rook/deploy/examples/toolbox.yaml
   ```

## Verify it works

Watch the CephCluster resource until its health reports `HEALTH_OK`:

```bash
kubectl -n rook-ceph get cephcluster
```

Then exec into the toolbox and ask Ceph directly:

```bash
kubectl -n rook-ceph exec -it deploy/rook-ceph-tools -- ceph status
```

Rook drives the cluster through `status.conditions`, moving the resource to `Progressing` while it configures mons, mgr, and OSDs (`pkg/operator/ceph/cluster/cluster.go:116`), so the CephCluster status is the authoritative signal that orchestration finished.

## Where to go next

For production concerns such as high availability, storage class configuration, object and file storage, monitoring, and upgrades, see the official [Rook Ceph documentation](https://rook.github.io/docs/rook/latest-release/Getting-Started/intro/).

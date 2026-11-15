# Getting Started

> Written against the v1.30.1 release manifest `cnpg-1.30.1.yaml` (released 2026-09-23). Commands assume a running Kubernetes cluster and a configured `kubectl`.

## Prerequisites

- A Kubernetes cluster (a local one such as kind or minikube is fine for this walkthrough).
- `kubectl` configured to reach that cluster, with permission to apply cluster-scoped resources.
- A default StorageClass, so the `Cluster` can allocate a PersistentVolume.

## Install

Apply the operator manifest. This is the URL the installation guide gives for v1.30.1, the latest stable release as of November 2026. For another minor line, use the YAML in that line's `release-1.x` branch.

```bash
kubectl apply --server-side -f \
  https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.30/releases/cnpg-1.30.1.yaml
```

Wait for the operator Deployment to roll out:

```bash
kubectl rollout status deployment \
  -n cnpg-system cnpg-controller-manager
```

## A first working setup

1. Write a three-instance `Cluster` definition to `cluster-example.yaml`:

    ```yaml
    apiVersion: postgresql.cnpg.io/v1
    kind: Cluster
    metadata:
      name: cluster-example
    spec:
      instances: 3
      storage:
        size: 1Gi
    ```

2. Apply it:

    ```bash
    kubectl apply -f cluster-example.yaml
    ```

3. Watch the Pods come up. The operator labels every object it manages with `cnpg.io/cluster`:

    ```bash
    kubectl get pods -l cnpg.io/cluster=cluster-example
    ```

   You should see three Pods, one primary and two replicas, reaching `Running`.

## Verify it works

Install the `cnpg` kubectl plugin (the `kubectl-cnpg` binary built from `cmd/kubectl-cnpg`) and ask for cluster status:

```bash
kubectl cnpg status cluster-example
```

A healthy cluster reports a single primary, the replica instances streaming, and a `Cluster in healthy state` summary. You can also confirm directly from the resource:

```bash
kubectl get cluster cluster-example
```

The `STATUS` column should read `Cluster in healthy state` once reconciliation settles.

## Where to go next

- Backup and point-in-time recovery to object storage, configured through the barman-cloud plugin.
- High availability tuning: synchronous replication quorum (`minSyncReplicas` / `maxSyncReplicas`) and the `FailoverQuorum` resource.
- Connection pooling with the `Pooler` CRD (PgBouncer) and monitoring with the generated Prometheus `PodMonitor`.

See the [official documentation](https://cloudnative-pg.io/documentation/) for these production concerns.

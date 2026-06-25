# Getting Started

> Based on the install instructions in the `longhorn/longhorn` `README.md` and the official docs ([source 9](https://longhorn.io/docs/latest/deploy/install/)). The latest release at the time of writing is `v1.12.0`. Commands assume a running Kubernetes cluster and `kubectl` configured against it.

## Prerequisites

Per the manager `README.md` requirements section:

- A Kubernetes cluster with [mount propagation](https://kubernetes-csi.github.io/docs/deploying.html#enabling-mount-propagation) enabled.
- On every host: `iscsiadm`/`open-iscsi` and an NFS client (`nfs-common`/`nfs-utils`/`nfs-client`) installed.
- A filesystem (ext4 or XFS) that supports the `file extents` feature for data storage.

Run the official environment check before installing:

```bash
curl -sSfL https://raw.githubusercontent.com/longhorn/longhorn/master/scripts/environment_check.sh | bash
```

## Install

Apply the bundled deployment manifest. It installs the manager, instance manager, CSI driver, and UI into the `longhorn-system` namespace.

```bash
kubectl create -f https://raw.githubusercontent.com/longhorn/longhorn/master/deploy/longhorn.yaml
```

## A first working setup

1. Wait for the control plane to come up. Every component runs in `longhorn-system`.

```bash
kubectl -n longhorn-system get pods --watch
```

1. Confirm the default `StorageClass` was created. The manifest registers `longhorn`.

```bash
kubectl get storageclass longhorn
```

1. Request a volume with a `PersistentVolumeClaim` that uses the `longhorn` class.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: longhorn-demo
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: longhorn
  resources:
    requests:
      storage: 1Gi
```

1. Apply it and confirm it binds.

```bash
kubectl apply -f longhorn-demo.yaml
kubectl get pvc longhorn-demo
```

## Verify it works

The claim should reach `Bound`, and Longhorn should report a healthy `Volume` CR with its replicas scheduled.

```bash
kubectl get pvc longhorn-demo
kubectl -n longhorn-system get volumes.longhorn.io
```

A healthy volume shows `State: attached` (once a pod mounts it) or `detached` with `Robustness: healthy` before use. You can also open the Longhorn UI service in `longhorn-system` to see the volume, its engine, and its replicas.

## Where to go next

For production concerns Longhorn documents separately, see the official docs ([source 9](https://longhorn.io/docs/latest/deploy/install/)): dedicated disks and node configuration, replica count and data-locality tuning ([source 12](https://cloudcasa.io/blog/longhorn-on-production-clusters-storage-configuration-tuning-and-gotchas)), backups to S3 or NFS, disaster recovery volumes, and the v2 (SPDK) data engine.

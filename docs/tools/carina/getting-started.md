# Getting Started

> Verified against v0.14.0 (commit `aec3a9f`). Commands assume a Linux Kubernetes cluster where you have `kubectl` access and cluster-admin rights.

## Prerequisites

- A Kubernetes cluster whose nodes run Linux (the node agent shells out to `lvcreate`).
- One or more bare disks larger than 10 GiB on each node, since the driver refuses a volume once free space would drop below the 9 GiB reserved margin (`pkg/devicemanager/volume/volume.go:65`).
- A node filesystem of ext4 or xfs.
- If kubelet runs in a container, mount the host `/dev` into it (`/dev:/dev`).
- The bcache kernel module if you want tiering; otherwise edit the node manifest per the project FAQ.

## Install

```bash
git clone https://github.com/carina-io/carina.git
cd carina/deploy/kubernetes
./deploy.sh
```

`deploy.sh` runs the `install` path by default (`deploy/kubernetes/deploy.sh:70`). It applies the configmap, both CRDs (custom resource definitions), the controller and node RBAC and workloads, the scheduler, the three StorageClasses, and the Prometheus ServiceMonitor.

## A first working setup

1. Confirm the Carina pods are running in `kube-system`.

    ```bash
    kubectl get pods -n kube-system | grep carina
    ```

2. Confirm the LVM StorageClass is installed. The manifest names it `csi-carina-sc` with `provisioner: carina.storage.io`, `volumeBindingMode: WaitForFirstConsumer`, and `allowVolumeExpansion: true` (`deploy/kubernetes/storageclass-lvm.yaml`).

    ```bash
    kubectl get storageclass csi-carina-sc
    ```

3. Create a PVC (PersistentVolumeClaim) that references the StorageClass.

    ```bash
    kubectl apply -f - <<'EOF'
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: carina-pvc
    spec:
      accessModes:
        - ReadWriteOnce
      storageClassName: csi-carina-sc
      resources:
        requests:
          storage: 5Gi
    EOF
    ```

4. Create a pod that mounts the PVC. Because the StorageClass uses `WaitForFirstConsumer`, the local logical volume is created only after the pod is scheduled.

    ```bash
    kubectl apply -f - <<'EOF'
    apiVersion: v1
    kind: Pod
    metadata:
      name: carina-test
    spec:
      containers:
        - name: app
          image: busybox
          command: ["sh", "-c", "sleep 3600"]
          volumeMounts:
            - name: data
              mountPath: /data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: carina-pvc
    EOF
    ```

## Verify it works

Once the pod is scheduled, the PVC should bind and a `LogicVolume` resource should appear. The `LogicVolume` CRD is cluster-scoped with the short name `lv` (`api/v1/logicvolume_types.go:60`).

```bash
kubectl get pvc carina-pvc
kubectl get lv
```

A bound PVC and a `LogicVolume` whose status shows a volume id confirm the node agent created the local volume.

## Where to go next

For raw-partition and host-path volumes, see `deploy/kubernetes/storageclass-raw.yaml` and `deploy/kubernetes/storageclass-host.yaml`. For bcache tiering, disk grouping, and scheduling strategy, consult the project README and `docs` directory in the repository at <https://github.com/carina-io/carina>.

# Getting Started

> Based on the Fluid documentation for the `v1.0.x` line. Commands assume a working Kubernetes cluster and Helm 3.

## Prerequisites

- A Kubernetes cluster with at least one schedulable node.
- `kubectl` configured against that cluster.
- Helm 3 installed locally.
- A remote data source to mount (an object store bucket, HDFS, or a public dataset URL).

## Install

Add the chart repository and install Fluid into its own namespace. This deploys the CRDs and the controllers, CSI driver, and webhook.

```bash
helm repo add fluid https://fluid-cloudnative.github.io/charts
helm repo update
helm install fluid fluid/fluid -n fluid-system --create-namespace
```

## A first working setup

The core job is: declare a dataset, give it a runtime, and have an application Pod read it through a cache.

1. Create a `Dataset` pointing at your under-file-system mount.

```yaml
apiVersion: data.fluid.io/v1alpha1
kind: Dataset
metadata:
  name: demo
spec:
  mounts:
    - mountPoint: https://mirrors.bit.edu.cn/apache/spark/
      name: spark
```

1. Create a same-named `AlluxioRuntime`. The matching name is what binds them.

```yaml
apiVersion: data.fluid.io/v1alpha1
kind: AlluxioRuntime
metadata:
  name: demo
spec:
  replicas: 1
  tieredstore:
    levels:
      - mediumtype: MEM
        path: /dev/shm
        quota: 2Gi
```

1. Apply both and wait for the dataset to bind.

```bash
kubectl apply -f dataset.yaml -f runtime.yaml
kubectl get dataset demo
```

When the runtime controller finishes setup, the dataset reaches the `Bound` phase and a PersistentVolumeClaim named `demo` appears. Mount that PVC in an application Pod to read the data through the cache.

## Verify it works

```bash
kubectl get dataset demo -o jsonpath='{.status.phase}'
kubectl get pvc demo
kubectl get pods -n fluid-system
```

A healthy setup shows the dataset phase as `Bound`, a bound `demo` PVC, and the Fluid controllers, CSI driver, and webhook Pods running in `fluid-system`. Optionally create a `DataLoad` resource to prefetch data into the cache before your job runs.

## Where to go next

See the [Fluid documentation](https://fluid-cloudnative.github.io/docs) for tiered store tuning, the other runtimes (JuiceFS, JindoCache, ThinRuntime), data operations (`DataLoad`, `DataMigrate`, `DataBackup`), and production concerns such as HA and metrics. The repository's `samples/` directory has runnable examples per engine.

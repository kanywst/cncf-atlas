# Getting Started

> Verified against the install manifest on `master` (latest release v1.15.0). Commands assume a working Kubernetes cluster and `kubectl` with cluster-admin.

## Prerequisites

- A Kubernetes cluster (the YAML install works on both x86_64 and arm64).
- `kubectl` configured against that cluster.
- For Kubernetes v1.17 and above, the recommended CRDs are used automatically by the manifest below.

## Install

Apply the development manifest to an existing cluster:

```bash
kubectl apply -f https://raw.githubusercontent.com/volcano-sh/volcano/master/installer/volcano-development.yaml
```

Or install the official release with Helm:

```bash
helm repo add volcano-sh https://volcano-sh.github.io/helm-charts
helm install volcano volcano-sh/volcano -n volcano-system --create-namespace
```

## A first working setup

1. Confirm the three control-plane pods are running in `volcano-system`.

```bash
kubectl get pods -n volcano-system
```

Expected output is one running pod each for the scheduler, controllers, and admission webhook:

```text
NAME                                   READY   STATUS    RESTARTS   AGE
volcano-admission-5bd5756f79-dnr4l     1/1     Running   0          96s
volcano-controllers-687948d9c8-nw4b4   1/1     Running   0          96s
volcano-scheduler-94998fc64-4z8kh      1/1     Running   0          96s
```

1. Submit a VolcanoJob. The key fields are `schedulerName: volcano` and `minAvailable`, which is the gang size. This example asks for 6 replicas but will only start once at least 3 pods can be placed together.

```yaml
apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: test-job
spec:
  minAvailable: 3
  schedulerName: volcano
  queue: default
  maxRetry: 5
  tasks:
    - replicas: 6
      name: "default-nginx"
      template:
        spec:
          containers:
            - image: nginx
              imagePullPolicy: IfNotPresent
              name: nginx
              resources:
                requests:
                  cpu: "1"
          restartPolicy: OnFailure
```

1. Apply it.

```bash
kubectl apply -f job.yaml
```

## Verify it works

Check that the job created a PodGroup and that its pods were scheduled by Volcano:

```bash
kubectl get podgroups
kubectl get pods -l volcano.sh/job-name=test-job
```

A healthy job shows its PodGroup reaching the `Running` phase once `minAvailable` pods are placed. If fewer than `minAvailable` pods can fit, the gang stays pending rather than starting partially.

## Where to go next

For queues and fair-share, hierarchical quota, topology- and NUMA-aware scheduling, GPU/NPU device sharing, and enabling preemption or reclaim actions, see the official documentation at <https://volcano.sh/en/>. Production concerns such as high availability of the scheduler, webhook certificates, and tuning the schedule period are covered there.

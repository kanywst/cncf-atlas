# Getting Started

> Aligned with `v2.20.1` ([3]). Commands assume a running Kubernetes cluster and `kubectl` configured against it.

## Prerequisites

- A Kubernetes cluster and `kubectl` with cluster-admin access.
- `helm` v3 if you install with the chart ([7]).
- A workload to scale (a Deployment is used below).

## Install

Install with Helm ([7]):

```bash
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda --namespace keda --create-namespace
```

Or apply the released manifests directly ([7]):

```bash
kubectl apply --server-side -f https://github.com/kedacore/keda/releases/download/v2.20.1/keda-2.20.1.yaml
```

## A first working setup

The shortest path to scaling something. This uses the built-in `cron` scaler so it needs no external dependency.

1. Create a Deployment to scale.

```bash
kubectl create deployment nginx --image=nginx --replicas=0
```

1. Create a `ScaledObject` that scales the Deployment to 5 replicas during a daily window and back to 0 outside it.

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: nginx-cron
spec:
  scaleTargetRef:
    name: nginx
  minReplicaCount: 0
  maxReplicaCount: 5
  triggers:
    - type: cron
      metadata:
        timezone: Etc/UTC
        start: 0 6 * * *
        end: 0 20 * * *
        desiredReplicas: "5"
```

1. Apply it.

```bash
kubectl apply -f scaledobject.yaml
```

## Verify it works

Confirm KEDA created the resources and is managing the workload.

```bash
kubectl get scaledobject nginx-cron
kubectl get hpa
```

A `ScaledObject` with a `READY` and `ACTIVE` status, plus an HPA named `keda-hpa-nginx-cron`, means KEDA is wired up. The operator drives the 0-to-1 transition itself; the HPA handles scaling above one replica.

## Where to go next

For high availability, the full scaler catalogue, `TriggerAuthentication`, and `ScaledJob`, see the official deploy and concepts docs ([7]) and the project repository ([1]). For HTTP request-based scaling, see the HTTP add-on ([8]).

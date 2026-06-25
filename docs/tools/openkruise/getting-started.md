# Getting Started

> Verified against `v1.9.0`. Commands assume a running Kubernetes cluster and Helm v3.5+.

## Prerequisites

- A Kubernetes cluster (a recent version; older docs cite 1.13+ as the floor due to CRD conversion).
- Helm v3.5 or newer.
- `kubectl` configured against the cluster.

## Install

```bash
helm repo add openkruise https://openkruise.github.io/charts/
helm repo update
helm install kruise openkruise/kruise --version 1.9.0 \
  --namespace kruise-system --create-namespace
```

## A first working setup

The shortest path that exercises the core feature is a CloneSet rolled with `InPlaceIfPossible`, watching the Pod stay alive through an image change.

1. Create a CloneSet.

```bash
cat <<'EOF' | kubectl apply -f -
apiVersion: apps.kruise.io/v1alpha1
kind: CloneSet
metadata:
  name: sample
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sample
  template:
    metadata:
      labels:
        app: sample
    spec:
      containers:
        - name: main
          image: nginx:1.25.0
  updateStrategy:
    type: InPlaceIfPossible
EOF
```

1. Watch the Pods in one terminal.

```bash
kubectl get pod -l app=sample -w
```

1. Change only the image, in another terminal.

```bash
kubectl patch cloneset sample --type='merge' \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"main","image":"nginx:1.25.3"}]}}}}'
```

The Pods keep their names and IPs; the `RESTARTS` count rises while `AGE` does not reset, because the container restarts in place rather than the Pod being recreated.

## Verify it works

Confirm both components are running:

```bash
kubectl -n kruise-system get deploy kruise-controller-manager
kubectl -n kruise-system get daemonset kruise-daemon
```

After the patch, inspect the in-place state annotation on a Pod:

```bash
kubectl get pod -l app=sample \
  -o jsonpath='{.items[0].metadata.annotations.apps\.kruise\.io/inplace-update-state}'
```

It records the revision and the per-container update state used to judge completion.

## Where to go next

For production concerns such as HA, webhook hardening, feature gates, and per-CRD configuration, see the official [Installation](https://openkruise.io/docs/installation) and [CloneSet](https://openkruise.io/docs/user-manuals/cloneset) docs, and the [InPlace Update](https://openkruise.io/docs/core-concepts/inplace-update) concept page.

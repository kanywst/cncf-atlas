# Getting Started

> Based on the [Get started docs](https://docs.crossplane.io/latest/get-started/) and the Helm chart under `cluster/`. Commands assume a running Kubernetes cluster and a working `kubectl` and `helm`.

## Prerequisites

- A Kubernetes cluster (a local `kind` cluster works).
- `kubectl` configured against that cluster.
- `helm` v3.

## Install

```bash
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update
helm install crossplane crossplane-stable/crossplane \
  --namespace crossplane-system --create-namespace
```

## A first working setup

The minimal working setup is a cluster with Crossplane core, a provider or function, an XRD, a Composition, and an XR. The shortest loop to confirm the engine works is to render a pipeline locally with the CLI, which needs no cloud credentials.

1. Confirm the Crossplane pods are running.

    ```bash
    kubectl get pods -n crossplane-system
    ```

2. Apply an XRD and a Composition that defines your API and maps it to a function pipeline, then create an XR of that type. The Composition's `spec.pipeline` is a list of `PipelineStep` entries, each referencing a function.

3. Preview the pipeline locally before applying, using the CLI. This runs the same function pipeline the reconciler runs and prints the resources it would produce.

    ```bash
    crossplane render xr.yaml composition.yaml functions.yaml
    ```

In v2 a composition can produce any Kubernetes resource, not only Crossplane managed resources, so the composed output can include objects like a `Deployment` or a database operator's `Cluster`.

## Verify it works

Check that the Crossplane deployment is available and that any installed packages are healthy.

```bash
kubectl get pods -n crossplane-system
kubectl get providers,functions,configurations
```

A healthy package reports `INSTALLED` and `HEALTHY` as `True`. After applying an XR, inspect it with `kubectl get` on its type and check its status conditions for `Synced` and `Ready`.

## Where to go next

For production concerns such as provider configuration, RBAC, package signing through `xpkg.crossplane.io`, and operations, see the [official documentation](https://docs.crossplane.io/latest/) and [What's New in v2](https://docs.crossplane.io/latest/whats-new/).

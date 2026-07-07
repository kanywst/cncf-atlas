# Getting Started

> Verified against the chart commands in `src/hack/local-running.sh` at commit `e8b5a0c`. Commands assume a parent cluster and at least one child cluster, plus `kubectl` and `helm` on your path.

## Prerequisites

- Two Kubernetes clusters, one parent and one child, on a version the release supports. Clusternet `v0.18.x` requires Kubernetes `>=v1.30` ([README](https://github.com/clusternet/clusternet)). [kind](https://kind.sigs.k8s.io/) clusters work for a local trial.
- `kubectl` configured with a context for each cluster.
- `helm` (v3) for installing the charts.
- The parent API server address must be reachable from the child, since the child dials out to register.

## Install

Add the official Helm chart repository (`src/hack/local-running.sh:116`).

```bash
helm repo add clusternet https://clusternet.github.io/charts
helm repo update
```

## A first working setup

These steps mirror `src/hack/local-running.sh`. Run the parent steps against your parent context and the agent step against your child context.

1. Install the three parent-side components into the `clusternet-system` namespace (`src/hack/local-running.sh:122`, `src/hack/local-running.sh:129`, `src/hack/local-running.sh:134`).

    ```bash
    helm install clusternet-hub -n clusternet-system --create-namespace clusternet/clusternet-hub
    helm install clusternet-scheduler -n clusternet-system --create-namespace clusternet/clusternet-scheduler
    helm install clusternet-controller-manager -n clusternet-system --create-namespace clusternet/clusternet-controller-manager
    ```

2. Create the bootstrap token the child will use to register (`src/hack/local-running.sh:124`). This applies a sample token to the parent.

    ```bash
    kubectl apply -f https://raw.githubusercontent.com/clusternet/clusternet/main/manifests/samples/cluster_bootstrap_token.yaml
    ```

3. Find your parent API server address, which the agent needs as `parentURL`.

    ```bash
    kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}'
    ```

4. Install `clusternet-agent` into the child cluster, pointing it at the parent and the bootstrap token from step 2 (`src/hack/local-running.sh:138`). Replace the URL with the value from step 3.

    ```bash
    helm install clusternet-agent -n clusternet-system --create-namespace \
      --set parentURL=https://PARENT-APISERVER:PORT \
      --set registrationToken=07401b.f395accd246ae52d \
      clusternet/clusternet-agent
    ```

## Verify it works

On the parent cluster, list the registered child clusters. The ManagedCluster CRD has the short name `mcls`.

```bash
kubectl get mcls -A
```

A successfully registered child appears as a ManagedCluster in its own dedicated namespace. You can then create a Subscription on the parent to distribute a workload; the example manifests under `src/examples/replication-scheduling` and `src/examples/static-dividing-scheduling` show both scheduling strategies.

## Where to go next

- The [quick start tutorial](https://clusternet.io/docs/quick-start/) sets up Clusternet locally with `kind` and three child clusters; the script behind it is `src/hack/local-running.sh`.
- For installation options, sync modes, and the `extraArgs.cluster-sync-mode` value (`Push`, `Pull`, or `Dual`), see the official docs ([Introduction](https://clusternet.io/docs/introduction/)).
- If the parent API server does not support bootstrap-token authentication (for example k3s), use a ServiceAccount token instead, per the official Helm installation docs.

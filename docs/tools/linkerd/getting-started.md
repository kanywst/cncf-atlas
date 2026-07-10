# Getting Started

> Verified against the `edge-26.6.3` release line (commit `7977d50`). Commands assume a running Kubernetes cluster and a working `kubectl`.

## Prerequisites

- A Kubernetes cluster you can reach with `kubectl`.
- Permission to install CRDs and cluster-scoped resources.
- The `linkerd` CLI on your PATH (installed below).

## Install

Install the CLI with the official script, then add it to your PATH:

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://run.linkerd.io/install | sh
export PATH=$HOME/.linkerd2/bin:$PATH
linkerd version --client
```

## A first working setup

The shortest path to a meshed workload. Each step prints manifests through the CLI and applies them with `kubectl`.

1. Check that the cluster can host Linkerd.

   ```bash
   linkerd check --pre
   ```

1. Install the CRDs, then the control plane.

   ```bash
   linkerd install --crds | kubectl apply -f -
   linkerd install | kubectl apply -f -
   ```

1. Wait for the control plane to be healthy.

   ```bash
   linkerd check
   ```

1. Mesh an existing workload by injecting the sidecar into its pod spec.

   ```bash
   kubectl get deploy <app> -o yaml | linkerd inject - | kubectl apply -f -
   ```

The `linkerd inject` step is the proxy-injector contract from the client side: it adds the inject annotation so the mutating webhook patches the pod with the `linkerd-proxy` sidecar at admission time.

## Verify it works

Run `linkerd check` and confirm every check returns a green status. To confirm a workload is actually meshed, list its pods and verify each one reports two ready containers (the app plus `linkerd-proxy`):

```bash
kubectl get pods -l app=<app>
```

Installing the `viz` extension (`linkerd viz install | kubectl apply -f -`) then `linkerd viz dashboard` surfaces live success rate, request rate, and latency for meshed workloads.

## Where to go next

Helm is the production install path: the `linkerd-crds` and `linkerd-control-plane` charts replace the CLI `install` steps and fit GitOps delivery with Flux or Argo. For high availability, certificate rotation, and multi-cluster mirroring, follow the official Linkerd documentation rather than this quick start.

## Sources

- Source 5: [linkerd/linkerd2 (control plane and CLI)](https://github.com/linkerd/linkerd2)
- Source 12: [Linkerd vs Istio (Buoyant)](https://www.buoyant.io/linkerd-vs-istio)

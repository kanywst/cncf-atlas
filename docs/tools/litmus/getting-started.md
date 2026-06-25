# Getting Started

> Verified against the install docs for Litmus 3.x. Commands assume a working Kubernetes cluster and Helm.

## Prerequisites

- Kubernetes 1.17 or newer.
- Helm 3 or newer.
- A persistent volume of about 20GB (1GB is enough for a test install).

The requirements come from the [Litmus installation docs](https://docs.litmuschaos.io/docs/getting-started/installation).

## Install

```bash
helm repo add litmuschaos https://litmuschaos.github.io/litmus-helm/
kubectl create ns litmus
helm install chaos litmuschaos/litmus --namespace=litmus --set portal.frontend.service.type=NodePort
```

The Helm chart depends on MongoDB. On ARM hosts you may need to swap in a compatible bitnami image.

## A first working setup

This brings ChaosCenter up and opens its UI.

1. Install the chart as shown above, into the `litmus` namespace.

2. Wait for the control-plane pods to become ready.

   ```bash
   kubectl get pods -n litmus
   ```

3. Reach the UI. On a remote cluster, drop the NodePort and port-forward the frontend service instead.

   ```bash
   kubectl port-forward svc/chaos-litmus-frontend-service 9091:9091 -n litmus
   ```

4. Open `http://localhost:9091` and sign in. On a local cluster (minikube or kind) the UI endpoint needs extra setup; see the installation docs.

## Verify it works

Confirm every control-plane pod in the `litmus` namespace is Running:

```bash
kubectl get pods -n litmus
```

A healthy install shows the GraphQL server, authentication, frontend, and MongoDB pods Running. After signing in, the ChaosCenter dashboard loads and you can connect a Chaos Infrastructure (an agent) to a target cluster.

## Where to go next

For production concerns such as HA, scaling, and authentication backends, follow the official [Litmus docs](https://docs.litmuschaos.io/docs/getting-started/installation). The fault library is documented in [litmuschaos/litmus-go](https://github.com/litmuschaos/litmus-go), and shareable experiments live in [litmuschaos/chaos-charts](https://github.com/litmuschaos/chaos-charts).

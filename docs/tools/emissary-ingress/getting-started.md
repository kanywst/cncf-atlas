# Getting Started

> Based on the Helm install for the 3.10 chart series. Commands assume a running Kubernetes cluster, `kubectl`, and `helm` 3.

## Prerequisites

- A Kubernetes cluster you can reach with `kubectl`.
- Helm 3, which can pull OCI charts.

## Install

Install the CRDs first, then the main chart. The official docs recommend Helm ([Install with Helm](https://www.getambassador.io/docs/emissary/latest/topics/install/helm)).

```bash
helm install emissary-crds \
  --namespace emissary --create-namespace \
  oci://ghcr.io/emissary-ingress/emissary-crds-chart --version=3.10.0 \
  --set enableLegacyVersions=false --wait

helm install emissary \
  --namespace emissary \
  oci://ghcr.io/emissary-ingress/emissary-ingress --version=3.10.0 \
  --set waitForApiext.enabled=false --wait
```

## A first working setup

Minimal routing needs three resources in `getambassador.io/v3alpha1`: a `Listener` for the listening port, a `Host`, and a `Mapping` from a path to a service ([Quick Start](https://emissary-ingress.dev/docs/3.10/quick-start/)).

1. Apply a `Listener`, `Host`, and `Mapping`.

   ```yaml
   apiVersion: getambassador.io/v3alpha1
   kind: Listener
   metadata:
     name: emissary-listener
     namespace: emissary
   spec:
     port: 8080
     protocol: HTTP
     securityModel: INSECURE
     hostBinding:
       namespace:
         from: ALL
   ---
   apiVersion: getambassador.io/v3alpha1
   kind: Host
   metadata:
     name: wildcard-host
     namespace: emissary
   spec:
     hostname: "*"
     requestPolicy:
       insecure:
         action: Route
   ---
   apiVersion: getambassador.io/v3alpha1
   kind: Mapping
   metadata:
     name: quote-backend
     namespace: emissary
   spec:
     hostname: "*"
     prefix: /backend/
     service: quote
   ```

1. Apply the manifest.

   ```bash
   kubectl apply -f routing.yaml
   ```

## Verify it works

Confirm the pods are running and the service has an external address, then send a request through the gateway.

```bash
kubectl get pods -n emissary
kubectl get svc -n emissary emissary-ingress
curl http://<external-ip>/backend/
```

## Where to go next

For the manual YAML install path, including waiting on the `emissary-apiext` conversion webhook, see [yaml-install](https://www.getambassador.io/docs/emissary/latest/topics/install/yaml-install). For production concerns such as TLS, authentication, rate limiting, and scaling, see the official docs at [emissary-ingress.dev](https://emissary-ingress.dev/docs/3.10/quick-start/).

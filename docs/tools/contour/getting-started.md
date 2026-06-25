# Getting Started

> Based on the official quickstart. Commands assume a running Kubernetes cluster with a `LoadBalancer` provider and a working `kubectl`.

## Prerequisites

- A Kubernetes cluster (kind, minikube, or a managed cluster).
- `kubectl` configured against that cluster.
- A `LoadBalancer` Service implementation so Envoy gets an external address (cloud LB, or MetalLB / `cloud-provider-kind` locally).

## Install

The official quickstart applies Contour, Envoy, the CRDs, and a `LoadBalancer` Service into the `projectcontour` namespace in one manifest:

```bash
kubectl apply -f https://projectcontour.io/quickstart/contour.yaml
```

This creates the Contour Deployment, the Envoy DaemonSet, a `LoadBalancer` Service, and the `HTTPProxy` CRDs. Helm charts (for example `bitnami/contour`) are an alternative install path.

## A first working setup

1. Deploy a sample workload and expose it as a Service.

    ```bash
    kubectl create deployment hello --image=nginxdemos/hello:plain-text --port=80
    kubectl expose deployment hello --port=80
    ```

2. Create an `HTTPProxy` that routes a host to that Service.

    ```yaml
    apiVersion: projectcontour.io/v1
    kind: HTTPProxy
    metadata:
      name: hello
    spec:
      virtualhost:
        fqdn: hello.local
      routes:
        - conditions:
            - prefix: /
          services:
            - name: hello
              port: 80
    ```

3. Apply it.

    ```bash
    kubectl apply -f hello-httpproxy.yaml
    ```

## Verify it works

Find the external address of the Envoy Service and send a request with the configured host header:

```bash
kubectl -n projectcontour get service envoy -o wide
curl -H 'Host: hello.local' http://<envoy-external-ip>/
```

A healthy setup returns HTTP 200 with the sample app's response. You can also confirm the `HTTPProxy` is valid:

```bash
kubectl get httpproxy hello -o wide
```

The `STATUS` column should read `valid`.

## Where to go next

For TLS, TLS delegation, multi-team route inclusion, Gateway API support, external authorization, and rate limiting, see the documentation at <https://projectcontour.io/docs/main/>. Production concerns such as high availability, scaling Envoy, and hardening are covered there rather than re-documented here.

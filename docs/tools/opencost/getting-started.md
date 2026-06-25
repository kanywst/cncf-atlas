# Getting Started

> Verified against the documented commit `4d117aa`. Commands assume a Kubernetes 1.20+ cluster with Prometheus, per `README.md:33-46`.

## Prerequisites

- A Kubernetes cluster, version 1.20 or newer.
- Prometheus running in the cluster (OpenCost queries it for usage metrics).
- Helm, the only supported install method. The standalone manifests have been removed (`README.md:33`).

## Install

```bash
helm repo add opencost https://opencost.github.io/opencost-helm-chart
helm repo update
helm install opencost opencost/opencost
```

## A first working setup

The shortest path that actually computes cost. The Helm install above is the recommended route. To run the engine locally without deploying it, port-forward to Prometheus and start the binary against it.

1. Forward the in-cluster Prometheus service to your workstation.

```bash
kubectl port-forward svc/prometheus-server 9080:80
```

1. Point OpenCost at that endpoint and run the cost model from source.

```bash
PROMETHEUS_SERVER_ENDPOINT="http://127.0.0.1:9080" go run ./cmd/costmodel/main.go
```

The API listens on port `9003` by default.

## Verify it works

Query the allocation API for a window. The `window` parameter is required (`pkg/costmodel/aggregation.go:337`).

```bash
curl "http://127.0.0.1:9003/allocation?window=1d&aggregate=namespace"
```

A healthy setup returns a JSON allocation set keyed by namespace. Other endpoints are `/allocation/summary`, `/assets`, `/cloudCost`, and `/metrics`.

## Where to go next

- For sharded or HA Prometheus, set `PROMETHEUS_SERVER_ENDPOINT` to a global query endpoint such as Thanos Query, Cortex, or Mimir; pointing at a single Prometheus pod gives incomplete results (`README.md:46`).
- The [OpenCost documentation](https://www.opencost.io/docs/) covers Helm configuration, the Prometheus integration, and the UI for production concerns not repeated here.

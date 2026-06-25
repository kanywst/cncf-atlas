# Getting Started

> Follows the official [Strimzi Quickstarts](https://strimzi.io/quickstarts/). Commands assume a running Kubernetes cluster and `kubectl`.

## Prerequisites

- A Kubernetes cluster (minikube, kind, or OKD all work for a local trial)
- `kubectl` configured to talk to that cluster

## Install

Create a namespace and install the Cluster Operator into it. The install bundle is the RBAC, Deployment, and CRD YAML under `install/cluster-operator/` in the repository.

```bash
kubectl create namespace kafka
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
```

## A first working setup

The shortest path to a running Kafka cluster: install the operator, deploy a `Kafka` custom resource, and let the operator reconcile it.

1. Wait for the Cluster Operator deployment to be ready.

```bash
kubectl wait deployment/strimzi-cluster-operator --for=condition=Available --timeout=300s -n kafka
```

1. Deploy a single-node KRaft Kafka cluster using the examples bundled in the repository.

```bash
kubectl apply -f examples/kafka/ -n kafka
```

1. Wait for the cluster to become ready. The operator runs the full reconcile chain and reports readiness on the `Kafka` resource status.

```bash
kubectl wait kafka/my-cluster --for=condition=Ready --timeout=300s -n kafka
```

## Verify it works

Check that the operator pods and the Kafka pods are running, and that the `Kafka` resource reports `Ready`.

```bash
kubectl get pods -n kafka
kubectl get kafka my-cluster -n kafka -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}'
```

A healthy cluster shows the broker and controller pods `Running` and the condition status `True`. The operator also exposes `/healthy`, `/ready`, and `/metrics` on port 8080.

## Where to go next

For production concerns such as high availability, TLS and authentication, scaling with `KafkaNodePool`, and rebalancing with Cruise Control, see the official [Strimzi documentation](https://strimzi.io/) and the [Quickstarts](https://strimzi.io/quickstarts/).

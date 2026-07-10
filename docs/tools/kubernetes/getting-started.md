# Getting Started

> Aimed at a local cluster for learning, matching the `v1.36` line current at the pinned commit. Commands assume macOS or Linux with Docker running.

## Prerequisites

- Docker (or another container runtime that `kind` supports)
- `kubectl`, the Kubernetes CLI
- `kind`, which runs a cluster inside Docker containers

## Install

```bash
# kubectl (Linux amd64; see the docs for other platforms)
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# kind
go install sigs.k8s.io/kind@latest
```

## A first working setup

The shortest path to a running cluster with a workload on it.

1. Create a local cluster.

   ```bash
   kind create cluster --name demo
   ```

1. Run a Deployment and expose it.

   ```bash
   kubectl create deployment hello --image=registry.k8s.io/echoserver:1.4
   kubectl expose deployment hello --port=8080
   ```

1. Watch the scheduler place the Pod and the kubelet start it.

   ```bash
   kubectl get pods -o wide
   ```

Expected output shows the Pod moving to `Running` with a node assigned in the `NODE` column.

## Verify it works

Confirm the control plane is reachable and the node is ready.

```bash
kubectl get nodes
kubectl get deployment hello
```

A healthy cluster reports the control-plane node as `Ready` and the `hello` Deployment with `1/1` ready replicas. Port-forwarding the Service to a local port and curling it confirms the workload serves traffic.

```bash
kubectl port-forward service/hello 8080:8080 &
curl http://localhost:8080
```

## Where to go next

For production concerns such as high availability of the control plane, RBAC and admission hardening, and scaling, follow the official documentation at <https://kubernetes.io/docs/>. `kubeadm` (under `cmd/kubeadm`) is the supported path for bootstrapping real clusters rather than `kind`.

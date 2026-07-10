# Getting Started

> Verified against the README at commit `2487a24` (near tag `v2.9.0`). Commands assume a Kubernetes cluster with NVIDIA GPU nodes and Helm.

## Prerequisites

For the NVIDIA device-plugin path, the README lists (`README.md:94-102`):

- NVIDIA driver >= 440
- `nvidia-docker` version > 2.0
- NVIDIA configured as the default runtime for containerd, Docker, or CRI-O
- Kubernetes >= 1.23
- glibc >= 2.17 and < 2.30
- Linux kernel >= 3.10
- Helm > 3.0

## Install

Label the GPU nodes so HAMi manages only those, then install the chart into `kube-system` (`README.md:104-134`):

```bash
kubectl label nodes <node-name> gpu=on

helm repo add hami-charts https://project-hami.github.io/HAMi/
helm repo update

helm install hami hami-charts/hami -n kube-system
```

## A first working setup

The shortest path to a shared GPU is one labelled node, the chart, and the bundled example pod.

1. Confirm the scheduler and device plugin are running.

```bash
kubectl get pods -n kube-system
```

Wait until both `hami-scheduler` and `hami-device-plugin` show `Running`.

1. Submit the example workload, which asks for one GPU with a memory and core budget.

```bash
kubectl apply -f examples/nvidia/default_use.yaml
```

The example pod requests `nvidia.com/gpu: 1`, `nvidia.com/gpumem: 3000`, and `nvidia.com/gpucores: 30`, so it takes one physical GPU limited to 3000 MB and 30 percent of the cores (`examples/nvidia/default_use.yaml`).

## Verify it works

Check that the pod scheduled and is running:

```bash
kubectl get pod gpu-pod
```

Inside the container, a tool like `nvidia-smi` reports the capped memory rather than the card's full amount, because HAMi-core enforces the injected `CUDA_DEVICE_MEMORY_LIMIT`. Cluster-wide GPU usage is exposed by the scheduler monitor, whose default port is `31993` (`README.md:152-158`):

```text
http://<scheduler-ip>:31993/metrics
```

## Where to go next

For scheduling policies (binpack, spread, topology-aware, dynamic MIG), Volcano and Koordinator integration, WebUI, and production configuration such as high availability and per-vendor setup, follow the official documentation at <https://project-hami.io/docs/>. The complete Helm install guide is at <https://project-hami.io/docs/get-started/deploy-with-helm/>.

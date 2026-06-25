# Getting Started

> Follows the official [getting started](https://istio.io/latest/docs/setup/getting-started/) guide. Commands assume a running Kubernetes cluster and a configured `kubectl`.

## Prerequisites

- A Kubernetes cluster (a local one such as kind or minikube is fine).
- `kubectl` pointed at that cluster.
- `istioctl` on your PATH (the download script below installs it).

## Install

Download Istio and add `istioctl` to your PATH.

```bash
curl -L https://istio.io/downloadIstio | sh -
cd istio-*
export PATH=$PWD/bin:$PATH
```

Install the control plane with the `demo` profile, which turns on enough features to follow the examples.

```bash
istioctl install --set profile=demo -y
```

## A first working setup

1. Label a namespace so new pods get an Envoy sidecar injected automatically.

```bash
kubectl label namespace default istio-injection=enabled
```

1. Deploy a workload into that namespace. Any pod created from now on in `default` gets a sidecar.

```bash
kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml
```

1. Confirm each pod has two containers, the app and the injected `istio-proxy`.

```bash
kubectl get pods
```

Each pod should report `2/2` in the READY column once started.

## Verify it works

Check that the control plane and proxies agree on config.

```bash
istioctl proxy-status
```

Every listed proxy should show `SYNCED` for CDS (Cluster Discovery Service), LDS (Listener Discovery Service), EDS (Endpoint Discovery Service), and RDS (Route Discovery Service), the xDS sub-protocols. A `STALE` entry means a push has not been acknowledged. You can also run `istioctl analyze` to surface configuration problems before they bite.

## Where to go next

For production, see the official docs on the [ambient data plane](https://istio.io/latest/docs/), control-plane high availability, certificate management and external CA integration, and scaling guidance. Use a production install profile rather than `demo`, which is tuned for trying features rather than running them.

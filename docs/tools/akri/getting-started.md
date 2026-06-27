# Getting Started

> Verified against the Helm chart for Akri (close to tag v0.13.8). Commands assume a running Kubernetes cluster and a configured `kubectl`.

## Prerequisites

- A Kubernetes cluster, v1.33 or newer (source 6).
- `kubectl` pointed at that cluster.
- `helm` (v3).

## Install

Add the Akri Helm repository and install the core components (Controller and Agent only):

```bash
helm repo add akri-helm-charts https://project-akri.github.io/akri/
helm install akri akri-helm-charts/akri
```

## A first working setup

This enables the udev Discovery Handler and a Configuration that discovers USB video devices, scheduling an nginx broker per device.

1. Install (or upgrade) the release with the udev handler and Configuration enabled.

    ```bash
    helm install akri akri-helm-charts/akri \
        --set udev.discovery.enabled=true \
        --set udev.configuration.enabled=true \
        --set udev.configuration.discoveryDetails.udevRules[0]='KERNEL=="video[0-9]*"' \
        --set udev.configuration.brokerPod.image.repository=nginx
    ```

2. Confirm the Configuration CRD was created.

    ```bash
    kubectl get akric
    ```

3. Watch for Instances, one per discovered device (the short name is `akrii`).

    ```bash
    kubectl get akrii
    ```

## Verify it works

Check that the Controller and Agent pods are running and that brokers were scheduled for any discovered device:

```bash
kubectl get pods -o wide
```

If a USB video device was found, an Instance appears under `kubectl get akrii` and a broker Pod is scheduled on the node that sees the device. With no matching device present, the Configuration exists but no Instances are created, which is expected.

## Where to go next

The official docs at <https://docs.akri.sh/> cover the other Discovery Handlers (ONVIF, OPC UA), writing a custom handler against the gRPC protocol, broker and Service configuration, and production concerns such as capacity tuning and metrics.

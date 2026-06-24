# Getting Started

> The documented commit `fe36ad62` carries `VERSION` `1.20.0-dev`; for a local trial use the latest stable release. Commands assume a Linux host with Docker, `kubectl`, and `kind` installed. Confirm version alignment against the [Cilium Getting Started](https://docs.cilium.io/en/stable/gettingstarted/) docs.

## Prerequisites

- A Kubernetes cluster you can install a CNI into. `kind` is the quickest for a trial.
- `kubectl` configured to reach that cluster.
- The `cilium` CLI (`cilium-cli`) on your `PATH`.
- A Linux kernel new enough for the eBPF features Cilium uses; the official docs list the requirements.

## Install

Install the `cilium` CLI, then install Cilium into the cluster with it. On a `kind` cluster, create the cluster without a default CNI so Cilium can own networking:

```bash
kind create cluster --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
networking:
  disableDefaultCNI: true
EOF

cilium install
```

Helm is also supported as an install path; see the official docs for chart values.

## A first working setup

1. Install Cilium into the current cluster context.

```bash
cilium install
```

1. Wait for the control plane and datapath to come up.

```bash
cilium status --wait
```

1. Run the built-in connectivity test, which deploys test workloads and exercises pod-to-pod and service traffic.

```bash
cilium connectivity test
```

## Verify it works

`cilium status` reports the health of the agent DaemonSet, the operator, and Hubble. A healthy install shows the agent and operator as `OK`:

```bash
cilium status
```

`cilium connectivity test` ends with a passing summary when the datapath is routing and enforcing correctly. You can also confirm the agent pods are running with `kubectl -n kube-system get pods -l k8s-app=cilium`.

## Where to go next

For production concerns such as kube-proxy replacement, transparent encryption (WireGuard/IPsec), ClusterMesh, BGP, and Hubble observability, follow the official [Cilium documentation](https://docs.cilium.io/en/stable/gettingstarted/). It covers kernel requirements, datapath modes, and hardening that are out of scope here.

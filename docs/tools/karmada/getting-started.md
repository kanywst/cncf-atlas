# Getting Started

> Verified against the README quick start at commit `658499d`. Commands assume a local machine with Docker available for `kind`.

## Prerequisites

- [Go](https://golang.org/) at the version pinned in `go.mod` (go 1.26 at this commit).
- [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) v1.19 or newer.
- [kind](https://kind.sigs.k8s.io/) v0.14.0 or newer.

## Install

The repository ships a script that brings up a full local Karmada plus member clusters.

```bash
git clone https://github.com/karmada-io/karmada
cd karmada
hack/local-up-karmada.sh
```

This script starts a host cluster, builds the control plane from the current code, deploys it, and creates and joins member clusters. On success it prints how to reach the environment:

```text
Local Karmada is running.

To start using your Karmada environment, run:
  export KUBECONFIG="$HOME/.kube/karmada.config"
```

## A first working setup

Propagate an nginx Deployment to member clusters. Use the `karmada-apiserver` context, which is the main kubeconfig for the control plane.

1. Point kubectl at the Karmada control plane.

```bash
export KUBECONFIG="$HOME/.kube/karmada.config"
kubectl config use-context karmada-apiserver
```

1. Create the Deployment template and a PropagationPolicy.

```bash
kubectl create -f samples/nginx/deployment.yaml
kubectl create -f samples/nginx/propagationpolicy.yaml
```

The sample policy selects the `nginx` Deployment and divides replicas across `member1` and `member2` by static weight (`samples/nginx/propagationpolicy.yaml`).

## Verify it works

Check the Deployment status from the Karmada control plane; you do not need to log into member clusters.

```bash
kubectl get deployment
```

Expected output:

```text
NAME    READY   UP-TO-DATE   AVAILABLE   AGE
nginx   2/2     2            2           20s
```

## Where to go next

- For production install options (instead of the local script), see the `karmadactl init` command (`pkg/karmadactl/cmdinit/cmdinit.go:121`) and the [Karmada website](https://karmada.io/).
- For Kubernetes version compatibility, HA, security hardening, and scaling, follow the official docs linked from the [project site](https://karmada.io/).

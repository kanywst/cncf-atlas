# Getting Started

> Steps follow the official Knative Quickstart. Commands assume a local Kubernetes cluster and a working `kubectl`.

## Prerequisites

- A local Kubernetes cluster via `kind` or `minikube`.
- `kubectl` configured for that cluster.
- The `kn` CLI and its `quickstart` plugin from the [Knative documentation](https://knative.dev/docs/).
- Container runtime (Docker or Podman) for the local cluster.

## Install

The quickstart plugin provisions a local cluster with Serving, a networking layer, and DNS already wired up.

```bash
kn quickstart kind
```

For a manual install on an existing cluster, apply the Serving CRDs, then the core, then one networking layer, following the order in the [Knative install docs](https://knative.dev/docs/). The sequence is CRDs, then core, then a networking layer such as Kourier, then DNS.

## A first working setup

1. Confirm the Serving pods are running.

```bash
kubectl get pods -n knative-serving
```

1. Deploy a service from a container image.

```bash
kn service create hello \
  --image ghcr.io/knative/helloworld-go:latest \
  --port 8080 \
  --env TARGET=World
```

1. Knative creates a Configuration, an immutable Revision, and a Route, then prints the service URL once the Revision is Ready.

## Verify it works

Curl the URL that `kn service create` printed. The first request after idle goes through the activator and incurs a cold start; the value should match the `TARGET` you set.

```bash
curl http://hello.default.<your-domain>
```

Replace `<your-domain>` with the host shown in the command output. After the `ScaleToZeroGracePeriod` of 30 seconds with no traffic (`pkg/autoscaler/config/config.go:58`), the Revision scales to zero, which you can watch with `kubectl get pods`. The next request triggers a cold start back up.

## Where to go next

The [Knative documentation](https://knative.dev/docs/) covers production concerns this page does not: choosing and hardening a networking layer, configuring autoscaling targets and concurrency, traffic splitting across Revisions, TLS with cert-manager, and high-availability control-plane settings.

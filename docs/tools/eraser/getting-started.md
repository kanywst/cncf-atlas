# Getting Started

> Verified against the source at commit `20576a24` (near tag `v1.5.0-beta.0`; latest stable is `v1.4.1`). Commands assume a running Kubernetes cluster with a CRI runtime (containerd or CRI-O) and Helm.

## Prerequisites

- A Kubernetes cluster whose nodes use a CRI runtime such as containerd or CRI-O, since Eraser deletes images through the CRI API.
- `kubectl` with cluster-admin, because the CRDs are cluster-scoped.
- Helm, for the chart install below.

## Install

Add the chart repository and install Eraser into its own namespace (`src/charts/eraser/README.md:10-23`):

```bash
helm repo add eraser https://eraser-dev.github.io/eraser/charts
helm repo update
helm install -n eraser-system eraser eraser/eraser --create-namespace
```

This deploys the `eraser-controller-manager` and registers the `ImageList` and `ImageJob` CRDs.

## A first working setup

This is the manual mode: name the images to delete and watch Eraser remove them from every node where no container is using them.

1. Confirm the controller is running.

   ```bash
   kubectl get pods -n eraser-system
   ```

1. Apply an `ImageList`. The resource must be named `imagelist`; any other name is ignored (`src/controllers/imagelist/imagelist_controller.go:139-144`). Use `docker.io/library/alpine:3.7.3` or another image you know is present and not running.

   ```bash
   kubectl apply -f - <<'EOF'
   apiVersion: eraser.sh/v1
   kind: ImageList
   metadata:
     name: imagelist
   spec:
     images:
       - docker.io/library/alpine:3.7.3
   EOF
   ```

1. Eraser creates an `ImageJob` that fans out one worker Pod per node. Watch them appear and complete.

   ```bash
   kubectl get imagejob
   kubectl get pods -n eraser-system -w
   ```

To delete every non-running image instead of a specific list, use `*` as the only entry in `spec.images`; that triggers the prune path (`src/pkg/remover/helpers.go:99-126`).

## Verify it works

Check the `ImageList` status, which aggregates per-node results into success, failed, and skipped counts (`src/api/v1/imagelist_types.go:26-39`):

```bash
kubectl get imagelist imagelist -o jsonpath='{.status}'
```

For detail, read a remover Pod's logs. A deleted image logs `removed image`; an image held by a running container logs `image is running` and is left in place; an image not present logs `image is not on node` (`src/pkg/remover/helpers.go:84-96`).

```bash
kubectl logs -n eraser-system -l imagejob-owner=imagelist-controller
```

## Where to go next

For scan mode, where Eraser periodically scans all node images with Trivy and deletes those over a vulnerability threshold, plus node filtering, exclusion lists, custom scanners via the `ImageProvider` interface, and OTLP metrics, see the official documentation at <https://eraser-dev.github.io/eraser/docs/>. The [quick start](https://eraser-dev.github.io/eraser/docs/quick-start) covers the same first run, and the chart parameters in `src/charts/eraser/README.md` cover tuning the deployment.

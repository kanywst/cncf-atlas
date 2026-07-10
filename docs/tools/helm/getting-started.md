# Getting Started

> Verified against the Helm v4 line (pinned commit `74fa4fce`, near tag v4.2.2). Commands assume a reachable Kubernetes cluster.

## Prerequisites

- A Kubernetes cluster reachable through your kubeconfig. The install path calls `IsReachable()` and fails fast if the cluster cannot be reached (`pkg/action/install.go:296`).
- The `helm` binary on your PATH.

## Install

On macOS with Homebrew:

```bash
brew install helm
```

On Linux, use the official install script or a binary release. See the [installation guide](https://helm.sh/docs/intro/install/) for the script and checksums.

## A first working setup

The shortest path is to add a chart repository, install a chart as a named release, and confirm it.

1. Add a chart repository.

   ```bash
   helm repo add <name> <repo-url>
   helm repo update
   ```

1. Install a chart as a release.

   ```bash
   helm install <release> <name>/<chart>
   ```

For an OCI-hosted chart, install by reference instead of a repo:

```bash
helm install <release> oci://<registry>/<chart> --version <version>
```

1. List the releases in the namespace.

   ```bash
   helm list
   ```

1. Remove the release when done.

   ```bash
   helm uninstall <release>
   ```

## Verify it works

`helm list` shows the release with a `deployed` status. You can also see the release record Helm stores in the namespace, a Secret of type `helm.sh/release.v1` (`pkg/storage/driver/secrets.go:284`):

```bash
kubectl get secret -l owner=helm
```

## Where to go next

For production concerns such as chart provenance and signing, OCI registry distribution, the storage driver choice through `HELM_DRIVER`, and chart authoring, see the [official Helm docs](https://helm.sh/docs/). GitOps users typically drive Helm through Argo CD or Flux rather than running `helm install` by hand.

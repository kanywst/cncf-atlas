# Getting Started

> Install commands come from the project's installation docs, verified against the `v6.4.x` line. Commands assume a working `kubectl` context pointing at a cluster you can deploy to.

## Prerequisites

- A Kubernetes cluster and a `kubectl` context with permission to create and modify workloads in a namespace. A local cluster (KIND, minikube, Docker Desktop) is fine.
- `kubectl` installed and pointed at that cluster; DevSpace reads the same kube-context.
- A container image builder if you want DevSpace to build images (Docker or BuildKit locally, or kaniko in-cluster).

DevSpace installs nothing in the cluster. It is a single client-side binary (installation docs).

## Install

Pick one. Homebrew on macOS or Linux:

```bash
brew install devspace
```

Direct binary download on Linux (AMD64):

```bash
curl -L -o devspace "https://github.com/loft-sh/devspace/releases/latest/download/devspace-linux-amd64" && sudo install -c -m 0755 devspace /usr/local/bin
```

On Windows, `scoop install devspace` or the PowerShell download in the installation docs. Confirm the binary is on your PATH:

```bash
devspace version
```

## A first working setup

The core job is developing an app against the cluster with live sync. The shortest real path is to initialize a `devspace.yaml` for an existing project and start a dev session.

1. From your project directory, generate a `devspace.yaml`. The interactive `init` inspects the project and writes the config, wiring up how to build the image and deploy it.

```bash
devspace init
```

1. Select a namespace to work in (DevSpace uses your current kube-context):

```bash
devspace use namespace my-dev-namespace
```

1. Start the dev session. This runs the `dev` pipeline: build the image, deploy, replace the target pod with a dev pod, inject the helper, and open the two-way file sync.

```bash
devspace dev
```

Leave `devspace dev` running. It streams the pipeline's progress and then holds the session open with the file sync active. Edit a file locally and the change is synced into the running container without a rebuild.

## Verify it works

While `devspace dev` runs, confirm the dev pod is up in your namespace:

```bash
kubectl get pods -n my-dev-namespace
```

You should see the replaced development pod running. To confirm the sync path end to end, open a terminal inside the container and look for a file you just edited locally:

```bash
devspace enter
```

A healthy session shows the sync log reporting uploaded and downloaded changes as you edit files, and the injected `devspacehelper` binary present at `/tmp/devspacehelper` inside the container. When you stop the session, DevSpace reverts the pod replacement and restores the original workload.

## Where to go next

For the full `devspace.yaml` reference (pipelines, imports, dev config, build and deploy backends), production and CI usage, and configuring SSH or port-forwarding, follow the official documentation at <https://www.devspace.sh/docs/>. The Pipelines reference (<https://www.devspace.sh/docs/configuration/pipelines/>) covers overriding the default workflows described in the [Architecture](./architecture) page.

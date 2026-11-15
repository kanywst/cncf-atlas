# Getting Started

> Based on the [Quick Start Guide](https://docs.meshery.io/installation/quick-start) and the `mesheryctl` source at commit `68d542af` (after `v1.0.79`). The commands were not run for this page. They assume macOS or Linux, Docker, and a Kubernetes cluster in your current kubeconfig context (kind or minikube is enough).

## Prerequisites

- A Kubernetes cluster that `kubectl` can reach with your current context.
- Docker, if you want to run Meshery Server on your machine instead of inside the cluster.
- A web browser. Signing in goes through a browser flow, even from the CLI.

## Install

The install script downloads `mesheryctl` and starts Meshery. `PLATFORM` chooses where Meshery Server runs: `kubernetes` deploys it into the cluster in your current context, `docker` runs it on your local Docker host ([Quick Start](https://docs.meshery.io/installation/quick-start)).

```bash
curl -L https://meshery.io/install | PLATFORM=docker bash -
```

On Windows, the Quick Start uses Scoop instead: `scoop bucket add mesheryctl https://github.com/meshery/scoop-bucket.git`, then `scoop install mesheryctl` and `mesheryctl system start`.

## A first working setup

The goal is to turn an ordinary Kubernetes manifest into a Meshery design and deploy it.

1. Start Meshery Server if the install script did not leave it running. `--platform` overrides the platform in your `mesheryctl` context (`mesheryctl/internal/cli/root/system/start.go:542`).

    ```bash
    mesheryctl system start --platform docker
    ```

2. Sign in. `mesheryctl` opens a browser where you choose a Provider, the Local one or a remote one (`mesheryctl/internal/cli/root/system/login.go:37-49`).

    ```bash
    mesheryctl system login
    ```

3. Check the connection to your cluster. Running out of cluster, the server connects to the contexts in `$HOME/.kube/config`. By default MeshSync runs embedded in the server, so nothing is installed in the cluster ([Quick Start](https://docs.meshery.io/installation/quick-start)).

    ```bash
    mesheryctl system check
    ```

4. Write a small manifest to `nginx.yaml`.

    ```yaml
    apiVersion: v1
    kind: Namespace
    metadata:
      name: meshery-demo
    ---
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: nginx
      namespace: meshery-demo
    spec:
      replicas: 1
      selector:
        matchLabels:
          app: nginx
      template:
        metadata:
          labels:
            app: nginx
        spec:
          containers:
            - name: nginx
              image: nginx:1.27
    ```

5. Import it as a design. `-s "Kubernetes Manifest"` tells Meshery what kind of file it is (`mesheryctl/internal/cli/root/design/import.go:50-57`).

    ```bash
    mesheryctl design import -f nginx.yaml -s "Kubernetes Manifest" -n nginx-demo
    ```

6. Deploy the saved design. This sends the design to `/api/pattern/deploy`, the request traced in [Architecture](./architecture) (`mesheryctl/internal/cli/root/design/apply.go:52-58`, `:82`).

    ```bash
    mesheryctl design apply nginx-demo
    ```

## Verify it works

Check from the cluster side that the resources exist:

```bash
kubectl get deployment -n meshery-demo nginx
```

In Meshery UI, the same Deployment should appear in the cluster inventory once MeshSync reports it. If the browser does not open, forward the UI to `http://localhost:9081` (`mesheryctl/internal/cli/root/system/dashboard.go:76-77`):

```bash
mesheryctl system dashboard --port-forward
```

To remove the demo, undeploy the design with `mesheryctl design undeploy nginx-demo`, then stop Meshery with `mesheryctl system stop`.

## Where to go next

- [Installation](https://docs.meshery.io/installation) for in-cluster deploys with Helm and for each supported platform.
- [Kubernetes connection lifecycle](https://docs.meshery.io/guides/infrastructure-management/kubernetes-connection-lifecycle) for switching a connection between embedded and operator MeshSync.
- [Architecture](https://docs.meshery.io/concepts/architecture) and [Logical Concepts](https://docs.meshery.io/concepts/logical) in the official docs for the full list of components and concepts.

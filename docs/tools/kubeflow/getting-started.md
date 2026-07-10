# Getting Started

> Verified against KFP `2.16.1`. Commands assume a running Kubernetes cluster, `kubectl`, and Python with `pip`.

## Prerequisites

- A Kubernetes cluster and `kubectl` configured against it.
- Python 3 with `pip` for the `kfp` SDK.
- This is the standalone deployment with no authentication, intended for trying KFP, not production.

## Install

Deploy KFP standalone with Kustomize:

```bash
export PIPELINE_VERSION=2.16.1
kubectl apply -k "github.com/kubeflow/pipelines/manifests/kustomize/cluster-scoped-resources?ref=$PIPELINE_VERSION"
kubectl wait --for condition=established --timeout=60s crd/applications.app.k8s.io
kubectl apply -k "github.com/kubeflow/pipelines/manifests/kustomize/env/dev?ref=$PIPELINE_VERSION"
```

Install the SDK:

```bash
pip install kfp==2.16.1
```

## A first working setup

1. Port-forward the UI and API so the SDK can reach the API server.

   ```bash
   kubectl -n kubeflow port-forward svc/ml-pipeline-ui 8080:80
   ```

The UI is then reachable at `http://localhost:8080`.

1. Author, compile, and submit a minimal pipeline.

   ```python
   from kfp import dsl, compiler, Client


   @dsl.component
   def say(msg: str):
       print(msg)


   @dsl.pipeline(name="hello")
   def hello_pipeline(text: str = "hi"):
       say(msg=text)


   compiler.Compiler().compile(hello_pipeline, "hello.yaml")
   Client(host="http://localhost:8080").create_run_from_pipeline_package("hello.yaml")
   ```

## Verify it works

Open `http://localhost:8080` and confirm the run appears and reaches a succeeded state, or check that the KFP pods are ready:

```bash
kubectl -n kubeflow get pods
```

## Where to go next

For authenticated, multi-user, and production deployments, follow the official [KFP standalone installation guide](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/) and the [Kubeflow Pipelines overview](https://www.kubeflow.org/docs/components/pipelines/overview/). For local backend development, the repository's `CLAUDE.md` documents a Kind-based deployment with `make -C backend kind-cluster-agnostic`.

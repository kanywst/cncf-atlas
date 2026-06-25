# Getting Started

> Verified against `v0.19.0`. Commands assume a local `kind` cluster and that you serve a predictive model in `Standard` mode.

## Prerequisites

- A Kubernetes cluster. For local testing, [`kind`](https://kind.sigs.k8s.io) plus Docker.
- `kubectl` configured against that cluster.
- Outbound network access so the storage-initializer can pull the sample model from public object storage.

## Install

The exact install asset name changes per release, so follow the official [KServe Quickstart Guide](https://kserve.github.io/website/docs/getting-started/quickstart-guide) for the version you run. The high-level flow is the same across releases.

```bash
kind create cluster
```

The repo ships an install script with explicit mode flags (`hack/kserve-install.sh`). Standard mode is the lightweight, Knative-free option:

```bash
./hack/kserve-install.sh --standard
```

The script also accepts `--knative` for serverless mode and `--keda` for KEDA-based autoscaling. The quickstart guide wraps the same steps in a single `curl ... | bash` install for your chosen release.

## A first working setup

Serve the scikit-learn iris model. The manifest below matches the in-repo sample at `hack/release/smoke-test-data/sklearn-iris.yaml`.

1. Create the `InferenceService`.

```yaml
apiVersion: "serving.kserve.io/v1beta1"
kind: "InferenceService"
metadata:
  name: "sklearn-iris"
spec:
  predictor:
    sklearn:
      storageUri: "gs://kfserving-examples/models/sklearn/1.0/model"
```

1. Apply it.

```bash
kubectl apply -f sklearn-iris.yaml
```

KServe picks the scikit-learn `ServingRuntime` by model format, injects a storage-initializer init container that downloads the model from `storageUri` into `/mnt/models`, and creates the Deployment, Service, and HPA.

## Verify it works

Wait for the resource to report `Ready`, then read its URL:

```bash
kubectl get inferenceservice sklearn-iris
```

The `READY` column should turn `True` and the `URL` column should be populated. The printer columns come from the CRD definition (`pkg/apis/serving/v1beta1/inference_service.go:140-147`). From there, send a prediction request to that URL following the protocol example in the quickstart guide.

## Where to go next

- The [KServe Quickstart Guide](https://kserve.github.io/website/docs/getting-started/quickstart-guide) for the version-pinned install command and a full prediction request.
- The KServe Admin Guide for production install of Standard, Knative, or ModelMesh modes (linked from the repo `README.md`).
- The [v0.15 generative AI announcement](https://www.cncf.io/blog/2025/06/18/announcing-kserve-v0-15-advancing-generative-ai-model-serving/) for the `LLMInferenceService` path.

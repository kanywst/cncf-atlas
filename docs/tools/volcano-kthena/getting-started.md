# Getting Started

> Verified against the pinned commit `affd5be`. Commands assume Go 1.26 and a working Docker or Kubernetes setup.

## Prerequisites

- Go 1.26 (the `go.mod` declares `go 1.26.0`) to build from source.
- A container runtime for the local one-click path, which provisions a cluster for you.
- For a real deployment: a Kubernetes cluster with the Volcano scheduler installed, since the default `ModelServingSpec.SchedulerName` is `volcano` (`pkg/apis/workload/v1alpha1/model_serving_types.go:47`).

## Install

The fastest path, no cluster required, is the one-click script (`README.md:77`):

```bash
./hack/local-up-kthena.sh
```

Run it with `--help` for options. To build the binaries from source instead:

```bash
make build
```

Container images are built with `make docker-build-all`, which produces the router, controller, downloader, and runtime images.

## A first working setup

The core job is to serve one model and reach it through the router over the OpenAI-compatible API.

1. Bring up Kthena locally.

   ```bash
   ./hack/local-up-kthena.sh
   ```

2. Apply a `ModelBooster` (or a `ModelServing`) so the controller stands the model up as a `ServingGroup`. Set `ModelBackend.ModelURI` to a supported scheme such as `hf://` (only `hf://`, `s3://`, `pvc://`, and `ms://` are allowed, per `pkg/apis/workload/v1alpha1/model_booster_types.go:59`). Follow the manifests in the [quick-start guide](https://github.com/volcano-sh/kthena/blob/main/docs/kthena/docs/getting-started/quick-start.md).

3. Send an OpenAI-compatible request through the router once the pods are ready.

   ```bash
   curl http://<router-address>/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model": "<your-model>", "messages": [{"role": "user", "content": "hello"}]}'
   ```

## Verify it works

- List served models, which the router answers directly (`pkg/kthena-router/router/router.go:216-220`):

```bash
curl http://<router-address>/v1/models
```

- Confirm the `ServingGroup` pods are scheduled. With Volcano installed they are placed as a gang through a Volcano PodGroup (`pkg/model-serving-controller/controller/model_serving_controller.go:194`). A `/v1/chat/completions` call returning a completion confirms the end-to-end path.

## Where to go next

- The official [quick-start guide](https://github.com/volcano-sh/kthena/blob/main/docs/kthena/docs/getting-started/quick-start.md) for full manifests.
- The [vLLM Kthena integration](https://docs.vllm.ai/en/stable/deployment/integrations/kthena/) and the [Ascend NPU guide](https://docs.vllm.ai/projects/ascend/en/main/user_guide/deployment_guide/using_volcano_kthena.html) for engine-specific deployment.
- The repo's `examples/keda-autoscaling` and `examples/prometheus-autoscaler` for scaling, and the Volcano scheduler docs for gang and network-topology-aware placement.

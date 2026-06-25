# KServe

> Kubernetes-native, multi-framework inference platform that turns a model into an autoscaling InferenceService for both predictive and generative AI.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Incubating
- **Language**: Go (control plane), Python (data plane)
- **License**: Apache-2.0
- **Repository**: [kserve/kserve](https://github.com/kserve/kserve)
- **Documented at commit**: `58d137d` (master, after the `v0.19.0` release, 2026-06-23)

## What it is

KServe runs machine learning models as a service on Kubernetes. You hand it a model artifact in object storage and a model format, and it provisions the serving pod, the network route, and the autoscaler for you. The unit of work is the `InferenceService` custom resource (`isvc`), defined at `pkg/apis/serving/v1beta1/inference_service.go:147`.

The project splits cleanly into two planes. A Go control plane, the `kserve-controller-manager`, reconciles CRDs into plain Kubernetes objects: a Deployment, a Service, an HPA, or a Knative Service. A Python data plane provides the model servers that speak the Open Inference Protocol. The two are coupled only by container images and a wire protocol, so each side evolves on its own.

KServe started as KFServing inside Kubeflow and now serves both predictive models (scikit-learn, XGBoost, PyTorch, Triton) and generative models through a newer `LLMInferenceService` CRD (`pkg/apis/serving/v1alpha1/llm_inference_service_types.go:60`). It became a CNCF Incubating project in 2025.

## When to use it

- You run models on Kubernetes and want a model artifact in S3, GCS, PVC, or Hugging Face turned into a running endpoint without building a serving image per model.
- You need request-driven autoscaling, including scale-to-zero, for inference workloads.
- You want one API for predictive and generative serving, with optional canary rollout and traffic splitting.
- It is a poor fit if you do not run Kubernetes, or if a single model on one VM is all you need; the CRD and controller overhead would not pay for itself.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [kserve/kserve (GitHub)](https://github.com/kserve/kserve)
2. [GitHub API repos/kserve/kserve](https://api.github.com/repos/kserve/kserve)
3. [KServe becomes a CNCF incubating project (CNCF)](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)
4. [KServe (CNCF projects)](https://www.cncf.io/projects/kserve/)
5. [KServe: The next generation of KFServing (Kubeflow)](https://blog.kubeflow.org/release/official/2021/09/27/kfserving-transition.html)
6. [Announcing KServe v0.15 (CNCF)](https://www.cncf.io/blog/2025/06/18/announcing-kserve-v0-15-advancing-generative-ai-model-serving/)
7. [KServe joins CNCF as an incubating project (Red Hat)](https://www.redhat.com/en/blog/kserve-joins-cncf-incubating-project)
8. [The journey to build Bloomberg's ML Inference Platform Using KServe (Bloomberg)](https://www.bloomberg.com/company/stories/the-journey-to-build-bloombergs-ml-inference-platform-using-kserve-formerly-kfserving/)
9. [ML model serving tools comparison: KServe, Seldon Core, BentoML (GetInData/Xebia)](https://medium.com/@getindatatechteam/machine-learning-model-serving-tools-comparison-kserve-seldon-core-bentoml-2c6b87837b1f)
10. [BentoML vs Seldon Core vs KServe (Reintech)](https://reintech.io/blog/bentoml-vs-seldon-core-vs-kserve-model-serving-framework-comparison)
11. [KServe Quickstart Guide](https://kserve.github.io/website/docs/getting-started/quickstart-guide)
12. [KServe Joins CNCF To Standardize AI Model Serving on Kubernetes (The New Stack)](https://thenewstack.io/kserve-joins-cncf-to-standardize-ai-model-serving-on-kubernetes/)

# Adoption & Ecosystem

## Who uses it

The repo has no `ADOPTERS.md`. The named organizations below come from the CNCF Incubating announcement and a Bloomberg engineering story; only cited adopters are listed.

| Organisation | Use case | Source |
| --- | --- | --- |
| Bloomberg | Built its ML inference platform on KServe; also an original co-creator | [Bloomberg story](https://www.bloomberg.com/company/stories/the-journey-to-build-bloombergs-ml-inference-platform-using-kserve-formerly-kfserving/) |
| Red Hat | Listed adopter; ships KServe in its AI platform | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |
| Cloudera | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |
| CyberAgent | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |
| Nutanix | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |
| SAP | Listed adopter | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |
| NVIDIA | Listed adopter; also an original co-creator | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |

## Adoption signals

From the GitHub API for `kserve/kserve`, observed 2026-06-24: 5,611 stars, 1,542 forks, 70 watchers (subscribers), and 636 open issues plus PRs; the repo was created 2019-03-27 ([GitHub API](https://api.github.com/repos/kserve/kserve)). The contributors API paginates to roughly 360 entries including anonymous authors, so the contributor base is on that order.

The CNCF Incubating announcement reported its own figures at announcement time: 4,600+ stars, 2,400+ PRs, 300+ contributors, 19 maintainers, and 30+ company adopters ([CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)). KServe entered CNCF Incubation on 2025-09-29 with TOC sponsors Faseela K and Kevin Wang.

## Ecosystem

KServe sits on top of and alongside several projects:

- Knative for the serverless (`Knative`) deployment mode.
- Istio for ingress and `VirtualService`-based routing.
- KEDA and the Kubernetes HPA for autoscaling.
- Kubeflow, the original parent, which still bundles KServe in its distribution.
- ModelMesh for high-density multi-model serving.
- Runtime backends: vLLM (generative AI), Hugging Face, NVIDIA Triton, and TorchServe, wired in as `ServingRuntime` resources.

## Alternatives

KServe is the right pick when you want a Kubernetes-native CRD API, the Open Inference Protocol, and automatic provisioning of routing, autoscaling, and storage download. The others trade differently.

| Alternative | Differs by |
| --- | --- |
| [Seldon Core](https://medium.com/@getindatatechteam/machine-learning-model-serving-tools-comparison-kserve-seldon-core-bentoml-2c6b87837b1f) | Inference graphs with ROUTER/COMBINER for multi-armed-bandit and ensembles; KServe centers on the isvc CRD and V2 protocol with auto-provisioned infrastructure |
| [BentoML](https://reintech.io/blog/bentoml-vs-seldon-core-vs-kserve-model-serving-framework-comparison) | Code-first packaging of any Python framework; often paired with KServe (package in BentoML, deploy on KServe) |
| [NVIDIA Triton](https://medium.com/@getindatatechteam/machine-learning-model-serving-tools-comparison-kserve-seldon-core-bentoml-2c6b87837b1f) | A GPU-optimized server, not a competitor; KServe runs it as a `ServingRuntime` |
| Ray Serve / vLLM / MLflow / SageMaker / Vertex AI | Distributed serving, LLM engines, or cloud-managed platforms that KServe either integrates with or replaces on self-managed Kubernetes |

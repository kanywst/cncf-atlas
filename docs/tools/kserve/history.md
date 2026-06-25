# History

## Origin

KServe began as KFServing in 2018. IBM proposed serverless ML model serving on Knative at KubeCon + CloudNativeCon NA 2018, and Bloomberg was experimenting with inference on Knative around the same time. The two efforts met at the Kubeflow Contributor Summit 2019 in Sunnyvale. Kubeflow had no model serving component at the time, so they started a sub-project for standard, simple serving of any ML framework ([CNCF blog, 2025-11-11](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)).

KFServing itself was built in 2019 as a collaboration between Google, IBM, Bloomberg, NVIDIA, and Seldon, and was released as open source. It debuted at KubeCon NA 2019 and drew end-user interest ([CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/); [Kubeflow blog, 2021-09-27](https://blog.kubeflow.org/release/official/2021/09/27/kfserving-transition.html)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2018 | IBM proposes serverless ML serving on Knative at KubeCon NA; Bloomberg experimenting in parallel ([source](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |
| 2019 | KFServing built by Google, IBM, Bloomberg, NVIDIA, Seldon; debuts at KubeCon NA ([source](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |
| 2021-09 | Repo moves from `kubeflow/kfserving` to the independent `kserve` org; renamed KServe, led by Bloomberg ([source](https://blog.kubeflow.org/release/official/2021/09/27/kfserving-transition.html)) |
| 2022-02 | Donated to the LF AI & Data Foundation ([source](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |
| 2022-09 | Rebranded to standalone KServe, graduating from Kubeflow ([source](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |
| 2025-06 | v0.15 advances generative AI serving (vLLM backend, `LLMInferenceService`) ([source](https://www.cncf.io/blog/2025/06/18/announcing-kserve-v0-15-advancing-generative-ai-model-serving/)) |
| 2025-09-29 | CNCF TOC accepts KServe as Incubating ([source](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |
| 2025-11-11 | Public Incubating announcement at KubeCon NA ([source](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)) |

## How it evolved

The first major shift was governance. In September 2021 the Kubeflow Serving WG moved the `kubeflow/kfserving` repo into a standalone `kserve` org to broaden the contributor base, renaming KFServing to KServe; Bloomberg drove the migration ([Kubeflow blog](https://blog.kubeflow.org/release/official/2021/09/27/kfserving-transition.html)). The project was then donated to LF AI & Data in February 2022 and fully separated from Kubeflow by September 2022 ([CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)).

The second shift was scope. KServe started as predictive model serving and, with v0.15 in 2025, expanded into generative AI: a strengthened vLLM backend and a new `LLMInferenceService` resource for disaggregated serving and prefix caching ([CNCF blog, v0.15](https://www.cncf.io/blog/2025/06/18/announcing-kserve-v0-15-advancing-generative-ai-model-serving/)). In the codebase this surfaces as the `v1alpha1`/`v1alpha2` LLM CRDs (`pkg/apis/serving/v1alpha1/llm_inference_service_types.go:60`).

A quieter shift sits in the deployment defaults. The legacy mode names `Serverless` and `RawDeployment` were renamed to `Knative` and `Standard`, and the default flipped to `Standard` (`pkg/constants/constants.go:550-554`). KServe no longer assumes Knative is present.

## Where it stands now

The latest release tag is `v0.19.0`; the Python package version is `0.19.0` (`python/kserve/pyproject.toml`). This deep-dive reads `master` at `58d137d`, the development line after that release. KServe entered CNCF Incubation on 2025-09-29 with TOC sponsors Faseela K and Kevin Wang, placing it under neutral governance; maintainers are listed in the repo `MAINTAINERS.md` ([CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)).

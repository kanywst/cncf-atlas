# History

## Origin

Kubeflow started inside Google in 2017 as a project to make running TensorFlow on Kubernetes easier. It was presented publicly at KubeCon NA 2017 by David Aronchick, Jeremy Lewi, and Vishnu Kannan ([Wikipedia](https://en.wikipedia.org/wiki/Kubeflow)). The first broad release, Kubeflow 0.1, was announced at KubeCon EU 2018 ([Kubernetes blog, 2018-05-04](https://kubernetes.io/blog/2018/05/04/announcing-kubeflow-0.1/)).

Kubeflow Pipelines, the orchestration subproject this deep-dive covers, lives in [kubeflow/pipelines](https://github.com/kubeflow/pipelines). The repository was created on 2018-05-12 ([GitHub API](https://api.github.com/repos/kubeflow/pipelines)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | Kubeflow announced at KubeCon NA 2017 ([Wikipedia](https://en.wikipedia.org/wiki/Kubeflow)) |
| 2018 | Kubeflow 0.1 announced at KubeCon EU; `kubeflow/pipelines` repo created ([Kubernetes blog](https://kubernetes.io/blog/2018/05/04/announcing-kubeflow-0.1/)) |
| 2019 | Pipelines established as a standalone DAG-based MLOps orchestration component ([Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/)) |
| 2020 | Kubeflow 1.0 released, signalling production readiness |
| 2022 | KServe (serving) spun out as an independent project under LF AI & Data |
| 2023 | Accepted into CNCF as an Incubating project on 2023-07-25 ([CNCF](https://www.cncf.io/projects/kubeflow/)) |
| 2026 | KFP 2.16.1 released 2026-05-05 ([GitHub API](https://api.github.com/repos/kubeflow/pipelines)) |

## How it evolved

The largest shift in Pipelines was the move from v1 to v2. KFP v2 compiles a pipeline into a protobuf intermediate representation (PipelineSpec) and injects a driver and a launcher container into each Argo Workflow task, rather than relying on a central controller to interpret the DAG ([Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/)). v2 is the current default engine. The same SDK DSL is consumed by managed backends; GCP Vertex AI Pipelines adopted the KFP DSL.

Kubeflow also narrowed in scope as subprojects matured into independent projects. Serving left as KServe in 2022. The result is the umbrella structure visible today: the CNCF-tracked `kubeflow/kubeflow` repository is a gateway, and the working code lives in subproject repositories like Pipelines.

Governance changed in 2023, when Google, with Project Steering Group support, applied for CNCF incubation ([Kubeflow blog](https://blog.kubeflow.org/kubeflow-applied-cncf-incubating/)). CNCF accepted Kubeflow as Incubating on 2023-07-25 ([CNCF](https://www.cncf.io/projects/kubeflow/)).

## Where it stands now

Kubeflow is a CNCF Incubating project with health metrics tracked through LFX Insights ([CNCF](https://www.cncf.io/projects/kubeflow/)). Pipelines ships regular releases; the latest at the time of writing is 2.16.1, released 2026-05-05 ([GitHub API](https://api.github.com/repos/kubeflow/pipelines)). v2 is the default execution engine, and the project's stated direction is end-to-end ML pipeline orchestration on Kubernetes with the Python SDK as the primary authoring surface.

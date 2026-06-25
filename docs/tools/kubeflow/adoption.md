# Adoption & Ecosystem

## Who uses it

The adopters below are the organisations listed in the project's [ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md). Only cited adopters are included.

| Organisation | Use case | Source |
| --- | --- | --- |
| [Capital One](https://www.capitalone.com/) | ML/AI workflow orchestration | [ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md) |
| [IBM Research Foundation Model Data Engineering Team](https://www.research.ibm.com/) | Foundation model data engineering | [ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md) |
| [Red Hat](https://www.redhat.com/) | ML/AI and data orchestration (OpenShift AI pipelines are KFP-based) | [ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md) |
| [Sophotech](https://sopho.tech/) | ML/AI and workflow orchestration | [ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md) |

Separately, GCP Vertex AI Pipelines adopted the KFP DSL ([Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/)). That is a product built on the KFP authoring surface rather than an ADOPTERS entry.

## Adoption signals

Observed 2026-06-24 via the [GitHub REST API](https://api.github.com/repos/kubeflow/pipelines):

- `kubeflow/pipelines`: 4,157 stars, 2,009 forks, 457 open issues, roughly 554 contributors.
- The umbrella `kubeflow/kubeflow`: 15,742 stars.
- The latest release is 2.16.1, published 2026-05-05.

CNCF tracks Kubeflow health metrics through LFX Insights ([CNCF project page](https://www.cncf.io/projects/kubeflow/)).

## Ecosystem

KFP v2 compiles to and runs on Argo Workflows as its execution engine, uses ML Metadata (MLMD) for lineage, an object store such as MinIO or S3 for artifacts, and MySQL for metadata (`README.md` compatibility matrix). Within Kubeflow, sibling subprojects include Katib (hyperparameter tuning and AutoML), Trainer / Training Operator (distributed training), KServe (inference, now independent), and Spark Operator. Managed offerings that consume the KFP DSL include GCP Vertex AI Pipelines.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| [Flyte](https://flyte.org/) | The closest competitor; Kubernetes-native with strong typing and reproducibility. KFP differs by depending on Argo, using MLMD for lineage, and sharing its SDK with Vertex |
| [Apache Airflow](https://airflow.apache.org/) | General workflow and data orchestration; tasks are not container-first, and ML-native artifact, lineage, and metadata tracking are weaker |
| [Metaflow](https://metaflow.org/) | Data-scientist experience focus, originally AWS-leaning |
| [Prefect](https://www.prefect.io/) / [Dagster](https://dagster.io/) | General data orchestration; KFP differs by per-step container execution on Kubernetes plus MLMD lineage |
| [Tekton](https://tekton.dev/) | CI/CD pipelines; KFP once had a Tekton backend but Argo is now primary (`kfp-tekton` is archived) |

Pick KFP when you are on Kubernetes and want ML pipelines with artifact lineage, step caching, and a DSL that also runs on managed backends. Pick a general orchestrator when the workload is data engineering rather than ML and the metadata model adds no value.

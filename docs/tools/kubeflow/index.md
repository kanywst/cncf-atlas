# Kubeflow

> Kubeflow Pipelines orchestrates end-to-end machine learning workflows on Kubernetes by compiling pipeline definitions into Argo Workflows and tracking every run in ML Metadata.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Incubating
- **Language**: Go (backend), Python (SDK), TypeScript (frontend)
- **License**: Apache-2.0
- **Repository**: [kubeflow/pipelines](https://github.com/kubeflow/pipelines)
- **Documented at commit**: `5beeae1` (2026-06-24, near tag 2.16.1)

## What it is

Kubeflow is a CNCF Incubating project for running machine learning workloads on Kubernetes. It is an umbrella: the repository the CNCF tracks, [kubeflow/kubeflow](https://github.com/kubeflow/kubeflow), is now a gateway whose README states that development happens in the individual subproject repositories. The implementation lives in subprojects such as Pipelines, Katib, Trainer, and Spark Operator.

This deep-dive covers Kubeflow Pipelines (KFP), the orchestration core. Its README leads with "End to end orchestration: enabling and simplifying the orchestration of end to end machine learning pipelines" (`README.md:17`). KFP takes a pipeline authored in the Python `kfp` SDK, compiles it to a protobuf intermediate representation, and turns that into an Argo Workflow custom resource that Kubernetes executes. An API server manages runs, experiments, and recurring runs. A persistence agent watches Workflow status and writes it back to a database. ML Metadata (MLMD) records every execution and artifact for lineage and caching.

It is for teams that already run Kubernetes and want ML pipelines as a first-class, reproducible, cached, and tracked workload rather than ad hoc scripts.

## When to use it

- You run on Kubernetes and want ML pipelines expressed as DAGs of containerized steps with artifact lineage and step caching.
- You want a Python SDK whose compiled output also runs on managed backends such as GCP Vertex AI Pipelines.
- You need scheduled, recurring ML runs with idempotent triggering.
- Avoid it if you are not on Kubernetes, or if your workflows are general data orchestration where ML-native artifact and metadata tracking add no value; a general orchestrator may fit better.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a run flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [kubeflow/pipelines repository](https://github.com/kubeflow/pipelines), pinned at commit `5beeae1`, accessed 2026-06-24.
2. [kubeflow/kubeflow repository](https://github.com/kubeflow/kubeflow), umbrella gateway, accessed 2026-06-24.
3. [CNCF project page: Kubeflow](https://www.cncf.io/projects/kubeflow/), accessed 2026-06-24.
4. [Kubeflow blog: applied to become a CNCF incubating project](https://blog.kubeflow.org/kubeflow-applied-cncf-incubating/), accessed 2026-06-24.
5. [Kubernetes blog: Announcing Kubeflow 0.1](https://kubernetes.io/blog/2018/05/04/announcing-kubeflow-0.1/), accessed 2026-06-24.
6. [Google Cloud: What's new in Kubeflow Pipelines v2](https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/), accessed 2026-06-24.
7. [Wikipedia: Kubeflow](https://en.wikipedia.org/wiki/Kubeflow), accessed 2026-06-24.
8. [kubeflow/pipelines ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md), accessed 2026-06-24.
9. [KFP standalone installation guide](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/), accessed 2026-06-24.
10. [Kubeflow Pipelines overview](https://www.kubeflow.org/docs/components/pipelines/overview/), accessed 2026-06-24.
11. [GitHub REST API: repos/kubeflow/pipelines](https://api.github.com/repos/kubeflow/pipelines), accessed 2026-06-24.

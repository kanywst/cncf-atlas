# Tekton

> A Kubernetes-native CI/CD framework: pipelines, tasks, and their runs are custom resources, and every step is a container in a pod.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Incubating (accepted 2026-03-13, announced 2026-03-24)
- **Language**: Go 1.26.4
- **License**: Apache-2.0
- **Repository**: `tektoncd/pipeline`
- **Documented at commit**: `9dec5e4b` (2026-09-04, four commits past `v1.16.0`)

## What it is

Tekton gives Kubernetes a vocabulary for continuous delivery. You describe a unit of work as a `Task`, which is an ordered list of steps, and each step is a container image with a command. You describe a workflow as a `Pipeline`, which is a set of tasks with dependencies between them. Running either one means creating a `TaskRun` or a `PipelineRun`, and a controller in the cluster turns that into pods.

There is no build server. The scheduler is the Kubernetes scheduler, the isolation boundary is the container, and the state lives in etcd like any other Kubernetes object. A `TaskRun` maps to exactly one pod, so a task's steps share a filesystem and a network namespace, and passing data between tasks needs an explicit workspace such as a persistent volume.

Confusingly, "Tekton" names both a family and a component. The family includes Triggers (turn incoming events into runs), Chains (sign build artifacts and emit provenance), Results (long-term run history), the `tkn` CLI, a Dashboard, an Operator, and Hub. This deep-dive covers Tekton Pipelines, the core component that defines the CRDs and runs the workloads.

## When to use it

- You already run Kubernetes and want CI/CD to be an object in the same cluster, subject to the same RBAC, admission control, and audit log.
- You want the same pipeline definition to run unmodified on any conformant cluster, on any cloud or on-premises.
- You are building a delivery platform for other teams rather than using one. Tekton is deliberately a framework, shipping primitives and leaving the product experience to whoever builds on it. Red Hat OpenShift Pipelines and IBM Cloud Continuous Delivery are products built on top of it.
- You care about supply chain provenance and want signing and SLSA attestation wired into the runner itself, which is what Tekton Chains adds.

Where it is the wrong choice:

- You want a hosted experience with a web UI, a marketplace, and no cluster to operate. GitHub Actions and GitLab CI win on that ground.
- Your workloads are not containers, or you have no Kubernetes cluster and do not want one. Tekton has no other execution model.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [Tekton Becomes a CNCF Incubating Project](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/), CNCF, 2026-03-24.
2. [A Year of Tekton](https://cd.foundation/blog/2019/11/15/a-year-of-tekton/), CD Foundation, 2019-11-15.
3. [Introducing the Continuous Delivery Foundation](https://opensource.googleblog.com/2019/03/introducing-continuous-delivery-foundation.html), Google Open Source Blog, 2019-03.
4. [The Tekton Pipelines Beta release](https://opensource.googleblog.com/2020/05/the-tekton-pipelines-beta-release.html), Google Open Source Blog, 2020-05.
5. [Tekton Graduation](https://tekton.dev/blog/2022/10/26/tekton-graduation/), tekton.dev, 2022-10-26.
6. [Tekton Incubation Application (cncf/toc#1310)](https://github.com/cncf/toc/issues/1310), CNCF TOC.
7. [Tekton Moves to the CNCF](https://cd.foundation/announcement/2026/03/24/tekton-moves-to-the-cncf/), CD Foundation, 2026-03-24.
8. [Tekton documentation](https://tekton.dev/docs/), tekton.dev.
9. [Tekton DevStats](https://tekton.devstats.cncf.io/), CNCF.

# Armada

> A high-throughput batch job scheduler that queues and schedules work across many Kubernetes clusters from outside the clusters themselves.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [armadaproject/armada](https://github.com/armadaproject/armada)
- **Documented at commit**: `85b582d` (near tag v0.21.5, commit date 2026-06-25)

## What it is

Armada is a batch workload system built on top of Kubernetes. It is designed to run millions of jobs per day across tens of thousands of nodes spread over many Kubernetes clusters (README:16). An Armada job is a Kubernetes pod plus optional auxiliary objects (services, ingresses) and Armada-specific metadata such as the queue the job belongs to (`docs/system_overview.md:7-11`).

Armada exists to push past three limits of plain Kubernetes: a single cluster does not scale past a certain node count, the in-cluster etcd store does not sustain very high job throughput, and the default kube-scheduler is not built for batch (README:20-22). Armada keeps queues and scheduling out of the cluster in a dedicated storage layer so it can hold queues made of millions of jobs (README:21).

The control plane accepts jobs, schedules them, and tracks their state. One executor runs per worker cluster and bridges the control plane to that cluster's Kubernetes API (`docs/system_overview.md:21`). G-Research started the project and donated it to the CNCF, where it is a Sandbox project.

## When to use it

- You run batch workloads (machine learning, simulation, data analysis) that need to span more nodes than a single Kubernetes cluster can hold.
- You need fair queuing across many users or teams, gang-scheduling of related jobs, preemption, and per-queue rate limits (README:23-26).
- You want job queues that hold millions of pending jobs without overloading etcd (README:21).
- It is not the right fit when a single cluster covers your scale; an in-cluster batch scheduler such as Volcano or Kueue is simpler then.
- It is not a general service-workload orchestrator; it targets finite-duration batch jobs (`docs/system_overview.md:7`).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. armadaproject/armada repository and README: <https://github.com/armadaproject/armada>
2. Armada CNCF project page (Sandbox, accepted 2022-07-25): <https://www.cncf.io/projects/armada/>
3. CNCF blog, "Armada - how to run millions of batch jobs over thousands of compute nodes using Kubernetes" (2021-01-25): <https://www.cncf.io/blog/2021/01/25/armada-how-to-run-millions-of-batch-jobs-over-thousands-of-compute-nodes-using-kubernetes/>
4. ADOPTERS.md: <https://github.com/armadaproject/armada/blob/master/ADOPTERS.md>
5. GitHub REST API repository metadata: <https://api.github.com/repos/armadaproject/armada>
6. Source at the documented commit: <https://github.com/armadaproject/armada/tree/85b582dedbf1e4a0c049ff3255bf23fda83fd3b4>

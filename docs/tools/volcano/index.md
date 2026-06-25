# Volcano

> A Kubernetes-native batch scheduler that adds gang scheduling, queues, and fair-share to clusters running AI, ML, and big-data workloads.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [volcano-sh/volcano](https://github.com/volcano-sh/volcano)
- **Documented at commit**: `7110813` (master, 2026-06-24)

## What it is

Volcano is a batch scheduling system for Kubernetes. It runs as a separate scheduler process alongside the default `kube-scheduler` and claims pods through their `schedulerName`, then makes its own placement and bind decisions. The scheduler is built on top of the Kubernetes SIG-Scheduling `kube-batch` project.

The core problem it solves is that the default scheduler places one pod at a time. That is wrong for distributed training and big-data jobs, where a group of pods must all start together or none should start at all. Volcano adds gang scheduling (all-or-nothing placement), queues with fair-share and capacity policies, and a pluggable set of scheduling algorithms. It ships a `Job` CRD that manages the full lifecycle of a multi-task batch workload.

Beyond the scheduler, Volcano runs a controller manager that reconciles its CRDs, an admission webhook manager, and an optional node agent for colocation and QoS of mixed online and offline workloads.

## When to use it

- You run distributed training (PyTorch, TensorFlow, MPI/Horovod) or Spark/Flink jobs where partial pod placement wastes resources or deadlocks the job.
- You need queues with fair-share, capacity, or hierarchical quota across teams sharing one cluster.
- You want topology-aware or NUMA-aware placement, or scheduling for GPU/NPU and other scalar devices.
- It is a poor fit when you only run long-lived services and Deployments. The default `kube-scheduler` already covers that, and Volcano adds operational overhead.

## In this deep-dive

- [History](./history): origin at Huawei, the kube-batch lineage, and the path through CNCF.
- [Architecture](./architecture): the four processes and how one scheduling cycle flows.
- [Adoption & Ecosystem](./adoption): who runs it and the alternatives.
- [Internals](./internals): the session and statement transaction model, read from source.
- [Getting Started](./getting-started): install and run a first VolcanoJob.

## Sources

1. volcano-sh/volcano (README, LICENSE, source): <https://github.com/volcano-sh/volcano>
2. Pinned commit `7110813`: <https://github.com/volcano-sh/volcano/commit/7110813b198e99d0282170ef022f51ceb43d9403>
3. Cloud Native Batch System Volcano moves to the CNCF Incubator: <https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/>
4. Volcano project page (CNCF): <https://www.cncf.io/projects/volcano/>
5. Why Spark chooses Volcano as built-in batch scheduler on Kubernetes: <https://www.cncf.io/blog/2022/06/30/why-spark-chooses-volcano-as-built-in-batch-scheduler-on-kubernetes/>
6. Volcano adopters list: <https://github.com/volcano-sh/community/blob/master/adopters.md>

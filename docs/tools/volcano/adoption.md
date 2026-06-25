# Adoption & Ecosystem

## Who uses it

The organisations below are listed as production users in the Volcano community [adopters file](https://github.com/volcano-sh/community/blob/master/adopters.md). Use cases are not individually detailed there beyond the production designation.

| Organisation | Use case | Source |
| --- | --- | --- |
| Huawei Cloud | Production batch scheduling | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| Tencent | Production batch scheduling | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| Baidu | Production batch scheduling | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| IQIYI | Production batch scheduling | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| Xiaohongshu | Production batch scheduling | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| DiDi | Production batch scheduling | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| iFlytek | Production batch scheduling | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| Kingsoft Cloud | Production batch scheduling | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| Zoom | Production batch scheduling | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |

The list also names Bosszhipin, Ruitian Capital, and Momenta among production users.

## Adoption signals

Measured from the GitHub API on 2026-06-25:

- Stars: 5,699; forks: 1,415; open issues: 657.
- Contributors: the GitHub contributors API runs to roughly 447 (anonymous included).
- The [CNCF incubation blog](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/) reports growth from 70+ to 350+ contributors and 5 to 50+ organisations between Sandbox acceptance and Incubation.

## Ecosystem

Volcano integrates with batch and AI frameworks including Spark, Flink, Ray, PyTorch, TensorFlow, MindSpore, PaddlePaddle, Kubeflow, MPI/Horovod, Argo, and KubeGene, per the [README](https://github.com/volcano-sh/volcano). Apache Spark adopted Volcano as a built-in batch scheduler on Kubernetes ([CNCF Spark blog](https://www.cncf.io/blog/2022/06/30/why-spark-chooses-volcano-as-built-in-batch-scheduler-on-kubernetes/)). It supports heterogeneous devices such as GPU and NPU. For multi-cluster scheduling there is a separate `volcano-sh/volcano-global` federation scheduler.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| `kube-scheduler` (default) | Schedules one pod at a time with no gang, queue, or fair-share. Volcano replaces or complements it for batch workloads. |
| `kube-batch` | The predecessor that Volcano's scheduler is built on; now largely inactive, with Volcano as its successor. |
| Apache YuniKorn (CNCF) | Also a batch/queue scheduler for Kubernetes, centred on hierarchical queues. Volcano differentiates with the VolcanoJob CRD lifecycle and a wider plugin set (NUMA, device, topology). |
| Kueue (Kubernetes SIG) | Focuses on job queueing and quota and defers placement to a scheduler. Volcano reaches down into the scheduling algorithm itself. |
| YARN and traditional HPC schedulers | Not Kubernetes-native; require a separate resource manager. |

Pick Volcano when the workload is gang-shaped and Kubernetes-native; pick Kueue when you only need queueing on top of an existing scheduler.

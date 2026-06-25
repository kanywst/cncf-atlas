# History

## Origin

Volcano started at Huawei as a batch scheduler for Kubernetes and was open-sourced at KubeCon Shanghai in June 2019, recounted in the [CNCF incubation blog](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/). The GitHub repository was created on 2019-03-14 (GitHub API). Its scheduler core is built on the Kubernetes SIG-Scheduling project `kube-batch` (`kubernetes-sigs/kube-batch`), which the [README](https://github.com/volcano-sh/volcano) states explicitly. Volcano picked up where `kube-batch` left off and grew into a full batch system with job lifecycle CRDs, controllers, and admission webhooks layered on top of the scheduler.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Open-sourced at KubeCon Shanghai; repository created 2019-03-14 |
| 2020 | Accepted into the CNCF Sandbox on 2020-04-09, the first cloud-native batch computing project in CNCF |
| 2022 | Promoted to CNCF Incubating by TOC vote on 2022-03-21, announced 2022-04-07 |
| 2026 | v1.15.0 released 2026-06-01 |

## How it evolved

The [CNCF blog](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/) records the growth between Sandbox acceptance and Incubation: contributors went from 70+ to 350+, and participating organisations from 5 to 50+, including Amazon, HP, Huawei, Google, and Oracle. A turning point for adoption was Apache Spark choosing Volcano as a built-in batch scheduler on Kubernetes, which gave a large existing user base a direct integration ([CNCF Spark blog](https://www.cncf.io/blog/2022/06/30/why-spark-chooses-volcano-as-built-in-batch-scheduler-on-kubernetes/)).

The codebase has expanded well past the original scheduler. Recent additions include network-topology-aware and NUMA-aware scheduling plugins, dynamic resource allocation support, sub-job scheduling, and a node agent for colocating online and offline workloads. The scheduler still keeps the action-and-plugin separation it inherited from `kube-batch`.

## Where it stands now

Volcano is a CNCF Incubating project with active releases; the latest tagged release is v1.15.0 (2026-06-01), with development continuing on `master` past that tag. The build produces six binaries (`vc-scheduler`, `vc-controller-manager`, `vc-webhook-manager`, `vc-agent`, `vc-agent-scheduler`, `vcctl`) and targets Go 1.25. CRDs live in a separate `volcano.sh/apis` module wired in through a `go.mod` replace directive.

## Sources

1. [volcano-sh/volcano repository (README, source, git metadata)](https://github.com/volcano-sh/volcano)
2. [Cloud Native Batch System Volcano moves to the CNCF Incubator](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/)
3. [Volcano project page (CNCF)](https://www.cncf.io/projects/volcano/)
4. [Why Spark chooses Volcano as built-in batch scheduler on Kubernetes](https://www.cncf.io/blog/2022/06/30/why-spark-chooses-volcano-as-built-in-batch-scheduler-on-kubernetes/)

# History

## Origin

KubeEdge was built by Huawei Cloud and open-sourced under Apache 2.0 in November 2018. The CNCF describes it as the first cloud native edge computing project. The GitHub repository was created on 2018-09-28. The goal was to take Kubernetes orchestration to edge hardware and IoT devices that sit far from the data center and behind flaky links, without forcing each node to run a full Kubernetes node stack. See the [CNCF graduation announcement](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/) and the [KubeEdge graduation blog](https://kubeedge.io/blog/cncf-graduation-announcement/).

## Timeline

| Year | Milestone |
| --- | --- |
| 2018 | Huawei Cloud open-sources KubeEdge under Apache 2.0; repository created 2018-09-28. |
| 2019 | Accepted into the CNCF Sandbox, the first edge project to join. |
| 2020 | Promoted to CNCF Incubating in September 2020. |
| 2024 | Graduated within the CNCF on 2024-10-15. |
| 2026 | v1.23.0 released on 2026-03-11. |

## How it evolved

The project kept its two-plane shape (cloud `cloudcore`, edge `edgecore`) and grew capabilities around it. Recent releases focused on reliability and device modeling. v1.22.0, shipped 2025-11-04, added a hold/release mechanism for edge resource updates, per-submodule restart policies in Beehive, and Thing Model based device model updates. See the [v1.22 release blog](https://kubeedge.io/blog/release-v1.22/). The Beehive restart policy work is visible in the code as `ModuleRestartPolicy` with growth-rate backoff (`staging/src/github.com/kubeedge/beehive/pkg/core/module.go:27-44`).

## Where it stands now

KubeEdge releases on a roughly quarterly minor cadence; v1.23.0 is the latest tag, published 2026-03-11, and the documented commit sits 89 commits past it on master. At graduation the CNCF reported maintainers from 15 organisations and over 1,600 contributors from more than 110 organisations across 35+ countries ([CNCF announcement](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/)). The project is governed under the CNCF and continues to develop along its stated direction of reliable edge orchestration plus device management.

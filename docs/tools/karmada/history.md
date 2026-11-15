# History

## Origin

Karmada grew out of the multi-cluster work led by Huawei Cloud, co-initiated with a group of large-scale users: First Automobile Works, ICBC, SPD Bank, Qutoutiao, VIPKid, and xiaohongshu. The project positions itself as the successor to the deprecated Kubernetes KubeFed (federation v2) effort, keeping Kubernetes-native APIs while adding independent propagation and override policies plus cross-cluster scheduling ([CNCF blog](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | Project launched, co-initiated by Huawei Cloud and several large users. |
| 2021 | Accepted as a CNCF Sandbox project (2021-09-14). |
| 2023 | Promoted to CNCF Incubating (2023-12-12). |
| 2025 | Formal Adopter Group program launched (2025-03). |
| 2026 | `v1.18.0` released (2026-05-30). |
| 2026 | `v1.19.0` released (2026-08-31): multi-component scheduling for distributed AI training jobs advances, and priority-based scheduling moves to Beta, on by default ([CNCF announcement](https://www.cncf.io/announcements/2026/09/07/cloud-native-computing-foundation-announces-karmada-graduation/)). |
| 2026 | Graduated in the CNCF: the TOC vote closed 2026-09-03 ([cncf/toc#1572](https://github.com/cncf/toc/issues/1572)), the level change closed 2026-09-04 ([cncf/toc#2289](https://github.com/cncf/toc/issues/2289)), and CNCF announced it on 2026-09-08 at KubeCon + CloudNativeCon China in Shanghai. |

## How it evolved

Karmada moved from a basic federation tool toward an automation-heavy control plane. The scheduler gained the ability to divide replicas across clusters by static weight or by real available capacity, backed by the `karmada-scheduler-estimator` and `karmada-descheduler` for dynamic rebalancing. The Lua-based Resource Interpreter Framework was added so arbitrary CRDs can be taught to Karmada without recompiling, and the repo now ships third-party interpreters for Flux, Argo, Ray, Kubeflow, and Flink. An `operator/` was introduced to manage Karmada instances declaratively through a `Karmada` CRD. These shifts are visible in the codebase under `pkg/scheduler`, `pkg/resourceinterpreter`, and `operator/` ([karmada-io/karmada](https://github.com/karmada-io/karmada)).

## Where it stands now

Karmada graduated in the CNCF in September 2026. To get there it completed a third-party security audit, set up a formal steering committee, and adopted the CNCF Code of Conduct. The announcement counts more than 1,214 contributors across 292 organizations, with maintainers from six organizations ([CNCF announcement](https://www.cncf.io/announcements/2026/09/07/cloud-native-computing-foundation-announces-karmada-graduation/)).

At the documented commit (`aad59e1`, 2026-11-13) the latest stable release is `v1.19.1` (2026-10-31). Patch releases `v1.18.4` and `v1.17.7` shipped the same day, so three minor lines receive fixes in parallel, and `v1.20.0-beta.0` is the current pre-release. The gates behind those `v1.19.0` features read as follows at this commit: `PriorityBasedScheduling` is Beta and on by default, while `PriorityBasedPreemptiveScheduling` and `MultiplePodTemplatesScheduling` are still Alpha and off (`pkg/features/features.go:186,187,192`). As of 2026-11-16 the GitHub repo shows 5,765 stars and 1,252 forks ([GitHub releases](https://github.com/karmada-io/karmada/releases), [GitHub API](https://api.github.com/repos/karmada-io/karmada)).

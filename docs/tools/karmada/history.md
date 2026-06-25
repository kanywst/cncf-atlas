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
| 2026 | `v1.18.0` released as the recent stable line; `v1.19.0-alpha.0` cut on master. |

## How it evolved

Karmada moved from a basic federation tool toward an automation-heavy control plane. The scheduler gained the ability to divide replicas across clusters by static weight or by real available capacity, backed by the `karmada-scheduler-estimator` and `karmada-descheduler` for dynamic rebalancing. The Lua-based Resource Interpreter Framework was added so arbitrary CRDs can be taught to Karmada without recompiling, and the repo now ships third-party interpreters for Flux, Argo, Ray, Kubeflow, and Flink. An `operator/` was introduced to manage Karmada instances declaratively through a `Karmada` CRD. These shifts are visible in the codebase under `pkg/scheduler`, `pkg/resourceinterpreter`, and `operator/` ([karmada-io/karmada](https://github.com/karmada-io/karmada)).

## Where it stands now

At the documented commit (`658499d`, 2026-06-22), Karmada is a CNCF Incubating project with active release cadence: `v1.18.0` is the recent stable release (2026-05-30) and `v1.19.0-alpha.0` is in progress. At the time of incubation CNCF reported more than 500 contributors from 60+ organizations across 20+ countries, with 7 maintainers. As of 2026-06-24 the GitHub repo shows 5,503 stars and 1,149 forks ([CNCF blog](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/), [GitHub API](https://api.github.com/repos/karmada-io/karmada)).

# History

## Origin

Kthena grew out of [Volcano](https://www.cncf.io/projects/volcano/), the CNCF batch scheduler. Volcano traces back to kube-batch, which added gang scheduling to Kubernetes, was open-sourced at KubeCon Shanghai in 2019, entered the CNCF Sandbox in April 2020, and was promoted to Incubating on 2022-03-21 ([CNCF blog](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/)).

Volcano's scheduling was built for AI training. Kthena extends it to inference so the project covers the full AI lifecycle rather than training alone. The Kthena repository was created on 2025-05-08, and the Volcano community formally announced Kthena on 2026-01-28, with Huawei Cloud (Volcano's originator) leading the effort ([CNCF blog](https://www.cncf.io/blog/2026/01/28/introducing-kthena-llm-inference-for-the-cloud-native-era/)).

Kthena is not a standalone CNCF project. It is a subproject under Volcano, so its maturity follows Volcano's Incubating status.

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | kube-batch open-sourced at KubeCon Shanghai, later renamed Volcano |
| 2020 | Volcano accepted into the CNCF Sandbox (April) |
| 2022 | Volcano promoted to CNCF Incubating (2022-03-21) |
| 2025 | Kthena repository created (2025-05-08); v0.1.0 released 2025-10-31; v0.2.0 released 2025-12-10 |
| 2026 | Kthena announced by the Volcano community (2026-01-28); v0.3.0 (2026-01-31); v0.4.0 (2026-04-21) |

## How it evolved

Kthena shipped four releases in roughly six months. v0.1.0 landed on 2025-10-31, v0.2.0 on 2025-12-10, v0.3.0 on 2026-01-31 alongside the public announcement, and v0.4.0 on 2026-04-21. The pinned commit `affd5be` is the `main` HEAD from 2026-06-24, about two months past v0.4.0, and carries no tag of its own.

By March 2026 the Volcano community described an AI-native unified scheduling platform bundling Volcano v1.14, Kthena v0.3.0, and AgentCube, positioning Kthena as the inference-serving member of that platform ([Beyond Batch](https://www.cncf.io/blog/2026/03/23/beyond-batch-volcano-evolves-into-the-ai-native-unified-scheduling-platform/)).

## Where it stands now

Releases have been frequent, roughly every one to two months from v0.1.0 to v0.4.0. The project is young and pre-1.0. Development is led by Huawei Cloud under the Volcano community ([CNCF blog](https://www.cncf.io/blog/2026/01/28/introducing-kthena-llm-inference-for-the-cloud-native-era/)). The stated direction is to make Volcano's gang scheduling and Kthena's inference orchestration parts of one AI-native scheduling platform ([Beyond Batch](https://www.cncf.io/blog/2026/03/23/beyond-batch-volcano-evolves-into-the-ai-native-unified-scheduling-platform/)).

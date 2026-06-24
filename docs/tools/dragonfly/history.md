# History

## Origin

Dragonfly started inside Alibaba Cloud in 2015. The trigger was scale: daily distributions reached tens of thousands and the application count passed ten thousand, and the failure rate of pulling large files from central sources climbed with it. The first version was an image and file acceleration system that inserted peer sharing between the origin and the consumers ([source 7](https://www.alibabacloud.com/blog/p2p-based-intelligent-image-acceleration-system-of-dragonfly_599645)).

The project was open-sourced at the end of 2017 and repurposed for Kubernetes and container-image distribution. By then Alibaba was reportedly distributing about 3.4 PB per month internally ([source 6](https://thenewstack.io/dragonfly-brings-peer-to-peer-image-sharing-to-kubernetes/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | Created inside Alibaba Cloud to cut large-file distribution failures ([source 7](https://www.alibabacloud.com/blog/p2p-based-intelligent-image-acceleration-system-of-dragonfly_599645)) |
| 2017 | Open-sourced and applied to Kubernetes image sharing ([source 6](https://thenewstack.io/dragonfly-brings-peer-to-peer-image-sharing-to-kubernetes/)) |
| 2018 | Accepted into the CNCF Sandbox on 2018-11-13 ([source 3](https://www.cncf.io/projects/dragonfly/)) |
| 2020 | Rewritten in Go for 1.0; promoted to CNCF Incubating on 2020-04-09 ([source 4](https://www.cncf.io/blog/2020/04/09/toc-votes-to-move-dragonfly-into-cncf-incubator/)) |
| 2025 | Graduated from the CNCF on 2025-10-28 ([source 5](https://thenewstack.io/cncf-dragonfly-speeds-container-model-sharing-with-p2p/)) |
| 2026 | Extended to AI model distribution with native `hf://` and `modelscope://` support ([source 8](https://www.cncf.io/blog/2026/04/06/peer-to-peer-acceleration-for-ai-model-distribution-with-dragonfly/)) |

## How it evolved

The first large shift was the 1.0 rewrite in Go, which the CNCF cited when it voted Dragonfly into the incubator in April 2020 ([source 4](https://www.cncf.io/blog/2020/04/09/toc-votes-to-move-dragonfly-into-cncf-incubator/)).

The second shift was the 2.0 architecture. The original 1.x design centered on a supernode that centrally controlled fixed-size chunks. Version 2.0 split the work into four roles, Manager, Scheduler, Seed Peer, and Peer, and moved peer-graph construction into the scheduler. The old `alibaba/Dragonfly` repository was archived and the work moved to `Dragonfly2`, now `dragonflyoss/dragonfly` ([source 7](https://www.alibabacloud.com/blog/p2p-based-intelligent-image-acceleration-system-of-dragonfly_599645)).

The most recent shift is toward AI/ML. Dragonfly added native handling for Hugging Face and ModelScope sources and a Rust transfer protocol called Vortex that uses a TLV wire format, aimed at distributing model weights at scale ([source 8](https://www.cncf.io/blog/2026/04/06/peer-to-peer-acceleration-for-ai-model-distribution-with-dragonfly/)).

## Where it stands now

Dragonfly graduated from the CNCF on 2025-10-28. At graduation the project reported contributions from 130 companies and 271 people across roughly 26,000 commits ([source 5](https://thenewstack.io/cncf-dragonfly-speeds-container-model-sharing-with-p2p/)). The most recent stable tag at the documented commit is `v2.4.3` (2026-03-11), with `v2.4.4-rc.3` (2026-06-09) in the release-candidate line. A third-party security audit by Trail of Bits was completed in 2023 and is published in the repository under `docs/security/` ([source 1](https://github.com/dragonflyoss/dragonfly)).

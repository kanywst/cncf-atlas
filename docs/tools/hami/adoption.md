# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS.md` file. The named production users below come from CNCF end-user case studies, which are the strongest citable evidence available. Each is a large Chinese company running GPU workloads on Kubernetes.

| Organisation | Use case | Source |
| --- | --- | --- |
| SF Technology (SF Express) | GPU sharing for AI workloads on Kubernetes | [CNCF case study](https://www.cncf.io/case-studies/sf-technology/) |
| KE Holdings Inc. (Beike) | GPU sharing for AI workloads on Kubernetes | [CNCF case study](https://www.cncf.io/case-studies/ke-holdings-inc/) |
| NIO | GPU sharing for AI workloads on Kubernetes | [CNCF case study](https://www.cncf.io/case-studies/nio/) |

The project's own technical review notes that formal user surveys are limited, so this list is the set that can be named with a source rather than a complete adopter count.

## Adoption signals

As of 2026-07-08, the GitHub repository has 3,720 stars, 611 forks, and 129 contributors (GitHub API). The release line is active, with `v2.9.0` cut on 2026-05-19. HAMi reached CNCF Incubating on 2026-07-02, a promotion that requires the TOC to see evidence of production use and a healthy contributor base (CNCF project page; Dynamia AI blog). The README also carries an OpenSSF Best Practices badge and a Docker Hub pull badge for `projecthami/hami`. The measurable signals point to a project with real traction and a contributor base past any single company, which is what the Incubating move reflects.

## Ecosystem

HAMi is designed to plug into existing schedulers rather than stand alone. Volcano uses HAMi-core-based isolation for its NVIDIA vGPU device plugin, which is the common pairing for batch AI (HAMi documentation). Koordinator documents an end-to-end GPU-share setup built on HAMi (Koordinator docs). The isolation library HAMi-core is itself a reusable component: it is a separate repository that other schedulers pull in for the in-container enforcement piece. On the hardware side, the `pkg/device` tree spans NVIDIA plus Ascend, Cambricon, Hygon, Metax, Mthreads, Iluvatar, and more, so the ecosystem story is as much about accelerator vendors as about surrounding schedulers.

## Alternatives

HAMi's position is software GPU sharing with per-pod memory and compute limits, no application changes, arbitrary MB-level granularity, and one model across many vendors. The alternatives each cover part of that span with a different trade-off.

| Alternative | Differs by |
| --- | --- |
| NVIDIA GPU Operator time-slicing | Shows the GPU to kubelet as N duplicate resources with no memory or compute isolation, so pods can read each other's memory; HAMi enforces a per-pod ceiling through HAMi-core |
| NVIDIA MIG | Hardware partitioning with strong isolation, but limited to specific cards (A100/H100 class) and fixed profile sizes; HAMi does arbitrary MB-level soft partitioning and can also drive MIG |
| NVIDIA MPS | Shares SM compute but has weak memory isolation and a looser fault boundary; HAMi can select MPS through the device plugin while adding its own memory limits |
| run:ai and commercial GPU orchestrators | Provide comparable fractional sharing and scheduling as a commercial product; HAMi is CNCF open source and spans multiple accelerator vendors |

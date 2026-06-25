# History

## Origin

Fluid started in 2020 as a joint effort between Nanjing University, Alibaba Cloud, and the Alluxio community, aimed at the gap between cloud-native compute on Kubernetes and the data that lives in remote object stores and distributed filesystems. The first release, `v0.1.0`, was published on 2020-08-30 ([releases](https://github.com/fluid-cloudnative/fluid/releases), [CNCF blog](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/)).

The problem it set out to solve: AI and analytics jobs read the same large datasets over and over, but Kubernetes treats storage as a static mount. Fluid's answer was to make a dataset a managed Kubernetes object with its own cache, lifecycle, and scheduling hints.

## Timeline

| Year | Milestone |
| --- | --- |
| 2020 | Project founded; first release `v0.1.0` (2020-08-30). |
| 2021 | Accepted into the CNCF Sandbox (CNCF project page records acceptance on 2021-04-28). |
| 2024 | Listed as "Adopt" in the CNCF 2024 Technology Landscape Radar. |
| 2025 | Release `v1.0.8` (2025-10-31) adds 3FS and Curvine storage support via ThinRuntime. |
| 2026 | Moved to CNCF Incubating (CNCF project page: 2026-01-08; announced 2026-03-24). |

## How it evolved

Fluid grew from a single Alluxio-centric operator into a multi-engine framework. The `Runtime` abstraction now covers Alluxio, JuiceFS, JindoCache, Vineyard, EFC, and a generic `ThinRuntime` that lets third parties plug in their own cache or storage system. The `v1.0.8` release used ThinRuntime to add 3FS and Curvine, which shows the extension model working as intended rather than requiring a new built-in engine each time ([CNCF blog](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/)).

Beyond caching, the scope widened to data operations: dedicated CRDs for `DataLoad` (prefetch), `DataBackup`, `DataMigrate`, and `DataProcess` (`api/v1alpha1/`) turned Fluid from "mount a cache" into a small platform for moving and preparing datasets.

## Where it stands now

Fluid is a CNCF Incubating project as of January 2026 ([CNCF project page](https://www.cncf.io/projects/fluid/)). The CNCF announcement cites 28 releases and roughly 1.9k GitHub stars at the time of promotion ([CNCF blog](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/)). The latest tagged release is `v1.0.8` (2025-10-31). Governance roles (committers, maintainers) are documented in the repository's `GOVERNANCE.md`.

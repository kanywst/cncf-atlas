# History

## Origin

Clusternet started as an open-source project under the `clusternet` GitHub organisation. The repository was created on 2021-06-07 and the first release, `v0.1.0`, followed on 2021-06-08 ([GitHub Releases](https://api.github.com/repos/clusternet/clusternet/releases), [repo metadata](https://api.github.com/repos/clusternet/clusternet)). The maintainers come from Tencent, Intel, and Purple Mountain Laboratory ([MAINTAINERS.md](https://github.com/clusternet/clusternet/blob/main/MAINTAINERS.md)).

The problem it targets is stated in its name. "Clusternet" is short for "Cluster Internet": the project wants you to manage and visit many Kubernetes clusters from one place, the way you reach any site on the internet, even when those clusters sit behind NAT or a firewall ([README](https://github.com/clusternet/clusternet)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | Repository created (2021-06-07) and first release `v0.1.0` published (2021-06-08). |
| 2023 | Accepted to CNCF at the Sandbox maturity level on 2023-03-07 (submission [cncf/sandbox#10](https://github.com/cncf/sandbox/issues/10)). |
| 2025 | Latest tagged release `v0.18.1` published 2025-08-13; 28 releases total. |

## How it evolved

The control plane grew from three components to four. From `v0.15.0` onward the `clusternet-controller-manager` was split out as its own component, giving the current set of `clusternet-agent`, `clusternet-scheduler`, `clusternet-controller-manager`, and `clusternet-hub` ([Introduction](https://clusternet.io/docs/introduction/)). The scheduler reuses the Kubernetes scheduler framework, ported to schedule clusters instead of nodes, which is visible in `pkg/scheduler`.

Kubernetes version support has moved forward with each minor line. The README compatibility matrix shows `v0.18.x` requires Kubernetes `>=v1.30`, `v0.17.x` supports `>=v1.28,<v1.30`, and `v0.16.x` supports `<v1.28` ([README](https://github.com/clusternet/clusternet)).

## Where it stands now

Clusternet remains a CNCF Sandbox project ([CNCF Projects](https://www.cncf.io/projects/clusternet/)). The latest tagged release is `v0.18.1` (2025-08-13), and the pinned commit for this deep-dive (`e8b5a0c`, 2026-05-10) is `main` ahead of that tag. As of 2026-06-28 the repository reports about 1,440 stars, 208 forks, and roughly 48 contributors ([repo metadata](https://api.github.com/repos/clusternet/clusternet), [contributors](https://api.github.com/repos/clusternet/clusternet/contributors)). The CRDs and APIs are also published as a separate `github.com/clusternet/apis` module for consumers ([README](https://github.com/clusternet/clusternet)).

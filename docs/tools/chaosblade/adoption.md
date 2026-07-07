# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS` file; the README asks companies to register adoption through a GitHub issue instead. The only named production adopters with a citable source come from Alibaba's own platform write-up, which states that more than 40 companies had registered and that the following used it in production.

| Organisation | Use case | Source |
| --- | --- | --- |
| ICBC (Industrial and Commercial Bank of China) | Production chaos engineering | [Alibaba Cloud blog](https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663) |
| China Mobile | Production chaos engineering | [Alibaba Cloud blog](https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663) |
| Xiaomi | Production chaos engineering | [Alibaba Cloud blog](https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663) |
| JD.com | Production chaos engineering | [Alibaba Cloud blog](https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663) |

Beyond these four named companies, no further citable adopters were found. Treat the "40+ companies" figure as the vendor's own count.

## Adoption signals

Measured on 2026-06-27 from the GitHub API (`gh api repos/chaosblade-io/chaosblade`): 6,358 stars, 1,001 forks, 348 open issues, and roughly 52 contributors. CNCF lists the project at Sandbox maturity, accepted on 2021-04-28. LFX Insights reports a concentration risk: in a recent quarter around 15 contributors were active and one contributor accounted for more than half of the activity, a single-maintainer dependency. The 2025 survey paper (arXiv 2505.13654) describes ChaosBlade as a Sandbox project under continued development across its release history.

## Ecosystem

Chaosblade is the CLI at the centre of a family of repositories:

- `chaosblade-exec-os`, `chaosblade-exec-jvm`, `chaosblade-exec-cplus`, and the other `chaosblade-exec-*` repos: per-domain executor binaries and their YAML specs, which the CLI build clones and packages.
- `chaosblade-spec-go`: the experiment-model SDK that defines `spec.ExpModel`, `spec.Executor`, and the YAML parsing used by the CLI.
- `chaosblade-operator`: the Kubernetes operator that exposes chaos experiments as a Custom Resource Definition (CRD).
- `chaosblade-box`: the platform UI, deployed via Helm, with Prometheus integration and the ability to host LitmusChaos experiments as well.
- `blade-ai`: a newer Python agent layer that drives experiments from a plain-language failure description.

## Alternatives

Chaosblade's distinguishing trait is breadth: one CLI and one experiment model span host, JVM, C++, Docker, CRI, Kubernetes, and cloud, with strong application-layer injection (JVM via a Java agent, C++ via GDB). The Kubernetes-native alternatives concentrate on cluster-level chaos driven by custom resources.

| Alternative | Differs by |
| --- | --- |
| Chaos Mesh (CNCF Incubating) | Kubernetes-native, CRD-driven; originated at PingCAP; centred on cluster chaos rather than multi-platform CLI |
| LitmusChaos (CNCF Incubating) | Kubernetes chaos workflows and an experiment hub; declarative pipelines over a single CLI |
| Gremlin | Commercial SaaS with a hosted control plane; not open source |
| AWS Fault Injection Service (FIS) | Managed fault injection scoped to AWS resources |
| Chaos Toolkit | Open, extensible JSON/YAML experiment format with a plugin ecosystem; provider-agnostic but lighter on built-in injectors |

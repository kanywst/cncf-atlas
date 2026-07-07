# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS.md` file, and no verifiable production-adopter source was found, so this deep-dive does not list named production adopters. Inventing them would be worse than saying so.

The README does name companies, but as the affiliations of contributors, not as production references: it credits "30+ contributors from Tencent, intel, ByteDance, Ant Group, Kanzhun, Purple Mountain Laboratories, Dmall, KuGou, Futu, WeBank, QQ Music, 37Games" ([README](https://github.com/clusternet/clusternet)). The maintainers are affiliated with Tencent, Intel, and Purple Mountain Laboratory ([MAINTAINERS.md](https://github.com/clusternet/clusternet/blob/main/MAINTAINERS.md)). Treat these as where the engineering effort comes from, not as evidence of production use.

## Adoption signals

As of 2026-06-28, GitHub reports roughly:

| Signal | Value | Source |
| --- | --- | --- |
| Stars | 1,440 | [repo metadata](https://api.github.com/repos/clusternet/clusternet) |
| Forks | 208 | [repo metadata](https://api.github.com/repos/clusternet/clusternet) |
| Open issues | 70 | [repo metadata](https://api.github.com/repos/clusternet/clusternet) |
| Contributors | ~48 | [contributors](https://api.github.com/repos/clusternet/clusternet/contributors) |
| Releases | 28 total, latest `v0.18.1` (2025-08-13) | [releases](https://api.github.com/repos/clusternet/clusternet/releases) |

Clusternet was accepted to CNCF at the Sandbox maturity level on 2023-03-07 ([CNCF Projects](https://www.cncf.io/projects/clusternet/), submission [cncf/sandbox#10](https://github.com/cncf/sandbox/issues/10)).

## Ecosystem

Clusternet integrates with several surrounding tools, per its README core features ([README](https://github.com/clusternet/clusternet)):

- Helm, including OCI (Open Container Initiative) charts, is built in through the HelmChart and HelmRelease CRDs.
- Clusters created by Cluster API can be auto-registered.
- Multi-cluster services use the `mcs-api` (the Kubernetes multi-cluster Services API).
- Monitoring works with Prometheus and Grafana.
- Cross-cluster networking can use Submariner, Istio, or Linkerd.
- A `client-go` wrapper (`src/examples/clientgo`) and a `kubectl` plugin installable with `kubectl krew install clusternet` (`src/README.md:79`) cover programmatic and CLI access.

## Alternatives

Clusternet sits in the same space as several other CNCF multi-cluster projects. Its differentiators are network-oriented: the reverse WebSocket tunnel that makes a child reachable from the parent even behind NAT, and the shadow API that lets existing manifests flow through unchanged ([Palark blog](https://palark.com/blog/cncf-sandbox-2023-h1/)).

| Alternative | Differs by |
| --- | --- |
| [Karmada](https://github.com/karmada-io/karmada) | Centered on distribution and scheduling; Clusternet also treats cross-cluster `kubectl` proxying as a first-class feature. |
| [Open Cluster Management](https://github.com/open-cluster-management-io) | Hub-and-agent model with a placement and policy focus; Clusternet leans on the Kubernetes scheduler framework and the shadow API. |
| [KubeVela](https://github.com/kubevela/kubevela) | Application delivery built on the Open Application Model; Clusternet stays closer to raw Kubernetes objects and `kubectl`. |
| [KubeStellar](https://github.com/kubestellar/kubestellar) | Another multi-cluster configuration management project; differs in its binding and transport model. |

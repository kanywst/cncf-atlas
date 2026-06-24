# Adoption & Ecosystem

## Who uses it

The following organisations are listed with a description in the project's `ADOPTERS.md` (source 8). The graduation announcement additionally named Cisco, Shopify, Skyscanner, and Vinted as adopters (source 1, 4).

| Organisation | Use case | Source |
| --- | --- | --- |
| Booz Allen Hamilton | Behaviour validation in a CD DevSecOps pipeline on Kubernetes; presented at KubeCon NA 2019 | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |
| GitLab | Falco integrated into GitLab Ultimate for container application runtime defense | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |
| Coveo | Falco alerts aggregated into a SIEM for in-container visibility | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |
| Secureworks | Protects Kubernetes deployments of the Taegis XDR platform and customer Linux/container environments | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |
| gVisor | Uses Falco's threat detection engine over gVisor runtime execution data for anomaly detection | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |
| MathWorks | Kubernetes threat detection; presented at KubeCon NA 2020 | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |

`ADOPTERS.md` also lists Fairwinds, Giant Swarm, Logz.io, Qonto, Replicated, and Deckhouse with descriptions (source 8).

## Adoption signals

Observed 2026-06-22 from the GitHub API (source 2):

- Stars: 9,071; forks: 1,032; watchers: 125.
- Contributors: roughly 266 (last page of the contributors API at `per_page=1`).
- Latest release: `0.44.1`, 2026-06-11 (source 3).

The CNCF and Sysdig graduation materials reported more than 100 million downloads, over 30 self-declared adopters, and, after the move to Incubation, a 400% rise in active contributors and a 526% rise in total downloads (source 1, 4).

## Ecosystem

These projects live under the same `falcosecurity` org and surround the core engine (source 6, 7):

- `falcosidekick`: fans Falco output out to 60+ external tools (Slack, Loki, Elasticsearch, CloudWatch, and more) and ships a web UI.
- `falcoctl`: a CLI that manages rules and plugins as artifacts and indexes. In the Helm chart it runs as the `falcoctl-artifact-install` init container and the `falcoctl-artifact-follow` sidecar.
- `falco-operator`: a Kubernetes Operator managing the lifecycle of Falco instances and surrounding components.
- Plugin framework: adds non-syscall sources (Kubernetes audit, CloudTrail, GitHub, Okta) through shared libraries. Plugins are executable objects, so auto-install is discouraged.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Tetragon (Cilium) | eBPF based with in-kernel enforcement (kill process, drop connection) and minimal CPU overhead; Falco focuses on detection and alerting and generally does not enforce (source 9, 10) |
| Tracee (Aqua) | eBPF based runtime security and forensics with strong MITRE ATT&CK aligned detection, at higher resource consumption (source 9, 10) |

Falco's differentiators per these comparisons (source 9, 10): the most mature option as a CNCF Graduated project, a maintained rule library, modular ingestion of non-syscall sources through plugins, and a kernel-module fallback for older kernels where Tetragon and Tracee tend to require newer ones. One comparison also reports Falco's memory use as the lowest of the three.

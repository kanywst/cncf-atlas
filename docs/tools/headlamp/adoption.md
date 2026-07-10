# Adoption & Ecosystem

## Who uses it

The repository keeps an in-tree `ADOPTERS.md`, which is the primary source for the organizations below. Each entry describes how that organization uses Headlamp; none are inferred.

| Organisation | Use case | Source |
| --- | --- | --- |
| Microsoft | Contributes to and uses Headlamp internally; it is the basis of the AKS desktop experience (`Azure/aks-desktop`) | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| Oracle | Builds the Oracle Cloud Native Environment (OCNE) UI on Headlamp and plugins | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| EPAM Systems | Integrates Headlamp as `edp-headlamp` in KubeRocketCI | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| Virginia Tech | Manages six clusters through Headlamp for its IT Common Platform, with in-house plugins | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| Swisscom | Uses Headlamp as a management UI for Cloud Native Network Functions (CNF) | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| Orange | Developer-facing UI for managed data services | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| KA-NABELL | Operations hub for microservice DevOps; develops and contributes plugins such as a Knative one | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| Millennium bcp, WhizUs GmbH | Listed as adopters | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |

## Adoption signals

As of 2026-07-08 (GitHub REST API): 6,835 stars, 922 forks, and roughly 281 contributors on a repository created 2019-11-08. The latest release is `v0.43.0` (2026-06-16), one commit before the tree documented here. The project carries an OpenSSF Best Practices badge (project 7551) and publishes an OpenSSF Scorecard (README). The named-adopter list is unusually broad for a Sandbox project and spans cloud vendors, telecoms, a university, and a Japanese e-commerce company, which is a stronger adoption signal than the star count alone.

## Ecosystem

Headlamp is extended through plugins rather than forks, and a supporting ecosystem has formed around that. The official plugin collection lives in `headlamp-k8s/plugins`, there is a plugin marketplace, and the `@kinvolk/headlamp-plugin` SDK with its `pluginctl` CLI is how third parties build and package plugins. Beyond plugins, the backend integrates Helm, port-forwarding, Prometheus metrics display, and OpenTelemetry instrumentation, and it ships as an Electron desktop app in addition to the in-cluster web deployment. As a Kubernetes SIG UI subproject, it now sits inside the Kubernetes project's own governance.

## Alternatives

Headlamp's distinction is a plugin-extensible, multi-cluster UI that runs both in a browser and on the desktop, always proxying through its own backend. The main alternatives each cover part of that.

| Alternative | Differs by |
| --- | --- |
| Kubernetes Dashboard | The official in-cluster web UI, focused on viewing with limited extensibility; Headlamp adds write operations, plugins, multi-cluster, and desktop delivery |
| Lens / OpenLens | Desktop-centric, IDE-like Kubernetes UI; Lens itself is commercially steered (Mirantis), while Headlamp is Apache-2.0, runs on web and desktop, and extends through plugins |
| k9s | A terminal (TUI) navigator built for fast keyboard-driven operations; Headlamp is a browser GUI that also reaches non-terminal users |
| Octant (archived) | An earlier plugin-based dashboard from VMware, now discontinued; Headlamp occupies a similar niche and is still maintained |

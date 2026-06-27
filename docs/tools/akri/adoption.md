# Adoption & Ecosystem

## Who uses it

No named adopters can be confirmed from the project at the documented commit. The repository ships an `ADOPTERS.md`, but its "Adopters List" section is empty: the file contains only the template and the requirements for adding an organization, with no organizations listed. This deep-dive does not invent adopters.

What can be stated honestly is the project's lineage and a public talk. Akri began at Microsoft DeisLabs and was one of the projects Microsoft donated toward the CNCF, alongside Helm, SMI, and Virtual Kubelet (source 3). Its design rationale is discussed by maintainer Kate Goldenring on the Kubernetes Podcast (source 5).

## Adoption signals

GitHub signals observed on 2026-06-26 via `gh api` (source 1):

| Signal | Value |
| --- | --- |
| Stars | 1250 |
| Forks | 165 |
| Contributors | 46 |
| Open issues | 88 |

The project is in the CNCF Sandbox (accepted 2021-09-14) and all releases remain pre-1.0 (sources 1, 2). Releases are tagged irregularly; the most recent at the documented commit is v0.13.8 from November 2024.

## Ecosystem

Akri plugs into the Kubernetes device plugin framework and is deployed with Helm. It ships Discovery Handlers for ONVIF, udev, OPC UA, and a debug-echo handler for testing, and any process speaking the discovery gRPC protocol can be added as a custom handler (sources 1, 6). The Controller exposes Prometheus metrics such as `akri_broker_pod_count`, defined at `controller/src/main.rs:16`.

## Alternatives

Akri is narrow: it discovers and advertises leaf devices to nodes that already run Kubernetes. The adjacent projects solve different layers of the edge problem.

| Alternative | Differs by |
| --- | --- |
| KubeEdge | Runs EdgeCore on edge nodes and controls devices via mappers and MQTT, rather than assuming existing Kubernetes nodes; can be complementary to Akri (source 7) |
| OpenYurt / SuperEdge | Extend the Kubernetes control plane out to edge nodes; device discovery is not their primary goal (source 7) |
| k3s / MicroK8s | Lightweight Kubernetes distributions for the nodes themselves; Akri instead targets devices too small to run Kubernetes at all (source 7) |

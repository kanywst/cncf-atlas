# Adoption & Ecosystem

## Who uses it

Adoption evidence for Easegress is thin. The repository has no `ADOPTERS.md`, and this deep-dive found no citable third-party organization running Easegress in production. The one documented user is the origin vendor, MegaEase, which built Easegress and presented it as its own product (MegaEase product page). That is vendor self-use, not independent adoption. The table below records the documented relationships rather than claiming outside adopters.

| Organisation | Relationship | Source |
| --- | --- | --- |
| MegaEase | Created Easegress and presented it as a product | [MegaEase product page](https://megaease.com/easegress/) |
| CNCF | Hosts Easegress as a Sandbox project since 2023-12-19 | [CNCF project page](https://www.cncf.io/projects/easegress/) |

## Adoption signals

Because named external adopters are not citable, the measurable signals carry the weight here. As of 2026-07-08 (GitHub API): 5,873 stars, 495 forks, and roughly 69 contributors. The repository was created on 2021-05-28, and the latest push in the documented window was 2026-07-01. The release line is active, with tag `v2.11.0` cut on 2026-03-17. A Docker Hub image `megaease/easegress` is published with a pulls badge (README). These are healthy repository signals, but they are project-activity metrics, not proof of production use at named organizations, which is the gap this page is honest about.

## Ecosystem

Easegress is built to integrate rather than stand alone. It ships a Kubernetes Ingress controller (`pkg/object/ingresscontroller`), a service mesh mode via the `MeshController` (EaseMesh sidecar), Knative FaaS support, and service registries for Eureka, Consul, Nacos, Zookeeper, and etcd (the `*serviceregistry` objects). It bridges MQTT to Kafka, supports WebAssembly extensions through the `wasmhost` filter, and recently added an LLM gateway via `pkg/object/aigatewaycontroller`. The web UI, Easegress Portal, lives in a separate repository. On the policy side, Easegress carries an OPA filter and has an entry in the Open Policy Agent Ecosystem (OPA Ecosystem).

## Alternatives

Easegress competes in a crowded gateway and proxy space. Its distinguishing traits are the result-driven filter pipeline and the embedded etcd cluster; the alternatives each differ on one of those axes.

| Alternative | Differs by |
| --- | --- |
| Envoy (CNCF Graduated) | C++ data plane configured over xDS by an external control plane such as Istio; Easegress is self-configuring with embedded etcd rather than xDS-driven |
| Kong | Nginx plus Lua (OpenResty) with a broad plugin marketplace; Easegress extends through Go filters and WebAssembly and avoids the C plus Lua stack by design |
| Apache APISIX | Also Nginx plus Lua and also etcd-backed, but uses an external etcd; Easegress embeds etcd inside its own binary |
| Traefik | Go proxy focused on automatic Kubernetes and Docker service discovery; Easegress covers a wider span including mesh, MQTT, and an LLM gateway |

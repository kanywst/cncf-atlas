# Adoption & Ecosystem

## Who uses it

No named adopters can be cited. The main repository has no `ADOPTERS.md` at its root, and the CNCF Incubating blog describes "adoption from startups to major carriers" without listing companies. Rather than invent adopters, this page reports the verifiable signals below. The maintainer affiliations recorded at Incubation are a public data point: Microsoft, Alibaba, VMware, Intel, Inspur, Sangfor, and Tongji University contribute maintainers (CNCF blog, 2025-07-02).

## Adoption signals

- GitHub, observed 2026-06-25: 1968 stars, 427 forks, primary language Go (`gh repo view openyurtio/openyurt`).
- Maintainers grew from 3 to 9, with around 170 contributors at the time of CNCF Incubation (CNCF blog, 2025-07-02).
- CNCF maturity: Sandbox in September 2020, Incubating on 2 July 2025 (CNCF blog).
- Release cadence reaches `v1.7.0` on 6 May 2026, certified up to Kubernetes 1.34 (`README.md:53`).

## Ecosystem

- EdgeX Foundry device management through YurtIoTDock (`pkg/apis/iot/`).
- Raven for layer-3 mesh connectivity across regions (`pkg/apis/raven/`).
- Helm charts bundled in the repo: `charts/yurt-manager`, `charts/yurthub`, `charts/yurt-iot-dock`.
- `yurtadm` for node join, reset, token, and renew operations (`pkg/yurtadm/cmd/`).
- CNI plugins such as flannel are allowed through the `HostNetwork` NodePool option (`pkg/apis/apps/v1beta2/nodepool_types.go:47-51`).

## Alternatives

OpenYurt's distinguishing trait is that it leaves the upstream Kubernetes control plane intact and adds edge behaviour as a node sidecar plus controllers (`README.md:24-25`). Pick it when you want stock Kubernetes plus edge autonomy. The main alternatives reimplement or replace more of the stack.

| Alternative | Differs by |
| --- | --- |
| [KubeEdge](https://kubeedge.io) | CNCF Incubating; reimplements parts of the control plane with CloudCore/EdgeCore over its own protocol plus an MQTT device layer, rather than keeping the stock apiserver path |
| [SuperEdge](https://superedge.io) | Another edge-autonomy add-on to Kubernetes; OpenYurt differs mainly in its component layout and project governance |
| [k3s](https://k3s.io) | A lightweight single-binary Kubernetes distribution; solves small-footprint clusters, not cloud-managed edge autonomy |

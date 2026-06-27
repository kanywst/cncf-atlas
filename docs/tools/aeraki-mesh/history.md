# History

## Origin

Aeraki Mesh was started by Huabing (Robin) Zhao (GitHub `zhaohuabing`), a CNCF Ambassador who works at Tetrate. He is the first maintainer listed in `MAINTAINERS.md`, with Tetrate.io as his company. The repository was created on 2020-11-05.

The problem it set out to solve is stated in the README. Istio and other popular meshes have limited support for L7 protocols beyond HTTP and gRPC, and Envoy's RDS is designed only for HTTP. Protocols such as Dubbo and Thrift can only use listener inline routes, which break existing connections when routes change. Introducing a proprietary protocol means writing both an Envoy filter for the data plane and a control plane to manage it (`README.md:49-51`). Aeraki's answer is a non-intrusive control plane plus the MetaProtocol Proxy abstraction, so adding a protocol becomes a codec implementation rather than a full mesh integration (`README.md:71-72`).

## Timeline

| Year | Milestone |
| --- | --- |
| 2020 | Repository created on 2020-11-05. |
| 2021 | Author publishes the introductory blog post on 2021-09-27. |
| 2022 | Tencent Music presents Istio + Aeraki at IstioCon 2022; accepted as a CNCF Sandbox project on 2022-06-17. |
| 2023 | Tag `1.4.1` released on 2023-08-20. |
| 2025 | Active development continues on master; this deep-dive pins commit `56e4de0` (2025-05-12). |

## How it evolved

Aeraki's scope is two control-plane roles, and both are present in the code at the pinned commit. The first is generating Istio `EnvoyFilter` resources from declarative config (`internal/envoyfilter/controller.go:128`). The second is acting as an RDS server for the MetaProtocol data plane (`internal/xds/server.go:52`). The MetaProtocol abstraction is what let the project grow protocol coverage without per-protocol control-plane code: protocols such as bRPC (open-sourced by Baidu), tRPC (used at Tencent), and qza (used at Tencent Music) are listed as supported on top of MetaProtocol (`README.md:91-95`).

Acceptance into the CNCF Sandbox in 2022 came with contributions acknowledged from Baidu, Zhihu, Alauda, Tencent Music, and DiDi, per the author's blog. The companion data plane `meta-protocol-proxy` and the shared API and client modules (`github.com/aeraki-mesh/api`, `github.com/aeraki-mesh/client-go`) live in separate repositories that the main control plane depends on (`go.mod`).

## Where it stands now

The project is a CNCF Sandbox project and remains active: the repository is not archived and was last pushed on 2025-12-05. Development happens on master ahead of the `1.4.1` tag. Version compatibility with Istio is tracked closely; Aeraki 1.4.x targets Istio 1.18.x and MetaProtocol Proxy 1.4.x per the install docs. Maintainership is led by the original author with co-maintainers from Tencent (`MAINTAINERS.md`).

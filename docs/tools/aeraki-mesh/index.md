# Aeraki Mesh

> A control plane that extends Istio to manage non-HTTP layer-7 (L7) protocols such as Dubbo, Thrift, and Kafka in a service mesh.

- **Category**: Service Mesh & Networking
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [aeraki-mesh/aeraki](https://github.com/aeraki-mesh/aeraki)
- **Documented at commit**: `56e4de0` (master, 2025-05-12)

## What it is

Aeraki Mesh is a control plane that adds layer-7 (L7, the OSI application layer where protocols like Dubbo, Thrift, and Kafka live) traffic management to an existing Istio mesh. Istio and most other meshes support HTTP and gRPC well but have very limited support for L7 protocols other than HTTP and gRPC, so a Dubbo or Thrift call is left without protocol-aware routing (`README.md:49`). Aeraki fills that gap without forking Istio or Envoy.

It has no data plane of its own. It runs alongside Istiod, watches Istio configuration over Mesh Configuration Protocol over xDS (MCP over xDS, the xDS-based stream Istiod uses to distribute config resources), and translates declarative rules into Istio `EnvoyFilter` resources that reprogram the Envoy sidecars (`README.md:71`). For protocols built on its companion MetaProtocol Proxy, it also serves as a Route Discovery Service (RDS) server so routes can change at runtime without dropping connections.

The audience is teams already on Istio who run remote procedure call (RPC), messaging, or database protocols that Istio cannot route natively, and who do not want to hand-write `EnvoyFilter` patches per protocol.

## When to use it

- You run Istio and need protocol-aware routing for Dubbo, Thrift, Kafka, Redis, Zookeeper, or a proprietary RPC protocol.
- You want dynamic route updates for a non-HTTP protocol without breaking live connections, which Istio's inline routes cannot do (`README.md:50`).
- You have a proprietary protocol and can implement a MetaProtocol codec instead of writing a full Envoy filter and control plane.
- Skip it if your traffic is only HTTP and gRPC; plain Istio already covers that.
- Skip it if you are not running Istio, since Aeraki depends on Istiod and Envoy.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [aeraki-mesh/aeraki repository and README](https://github.com/aeraki-mesh/aeraki)
2. [CNCF project page: Aeraki Mesh](https://www.cncf.io/projects/aeraki-mesh/)
3. [Aeraki Mesh becomes a CNCF Sandbox project (author blog, 2022-06-17)](https://www.zhaohuabing.com/post/2022-06-17-aeraki-mesh-cncf-sandbox/)
4. [Introducing Aeraki (author blog, 2021-09-27)](https://www.zhaohuabing.com/post/2021-09-27-aeraki/)
5. [IstioCon 2022: Tencent Music's service mesh practice with Istio and Aeraki](https://events.istio.io/istiocon-2022/sessions/tencent-music-aeraki/)
6. [Aeraki and Tencent Music at IstioCon 2022 (author blog, 2022-04-26)](https://www.zhaohuabing.com/post/2022-04-26-aeraki-tencent-music-istiocon2022/)
7. [Aeraki Mesh install guide (v1.x)](https://www.aeraki.net/docs/v1.x/install/)
8. [Aeraki Mesh quickstart (v1.x)](https://www.aeraki.net/docs/v1.x/quickstart/)
9. [Data plane: aeraki-mesh/meta-protocol-proxy](https://github.com/aeraki-mesh/meta-protocol-proxy)
10. [Adopters collection issue #105](https://github.com/aeraki-mesh/aeraki/issues/105)
11. [Aeraki Mesh project site](https://www.aeraki.net/)
12. [CNCF Landscape: Aeraki Mesh](https://landscape.cncf.io/?selected=aeraki-mesh)

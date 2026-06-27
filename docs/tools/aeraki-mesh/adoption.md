# Adoption & Ecosystem

## Who uses it

The repository has no dedicated ADOPTERS file; user collection happens in [issue #105](https://github.com/aeraki-mesh/aeraki/issues/105) (`README.md:169`). The organisations below each have a citable source.

| Organisation | Use case | Source |
| --- | --- | --- |
| Tencent Music | Ran Istio + Aeraki in production, presented at IstioCon 2022 | [IstioCon 2022 session](https://events.istio.io/istiocon-2022/sessions/tencent-music-aeraki/) |
| Tencent | Maintainer `Xunzhuo` from Tencent; tRPC, qza, and videoPacket listed as supported MetaProtocol protocols | `MAINTAINERS.md`, `README.md:92-94` |

The README also names Alauda and bRPC (open-sourced by Baidu) among supported MetaProtocol protocols (`README.md:91,95`), which signals usage but is not a direct adoption statement. No other named adopters have a confirming source, so none are claimed here.

## Adoption signals

Measured from the GitHub API on 2026-06-26:

- Stars: 761
- Forks: 141
- Contributors: about 34 (non-anonymous)
- Open issues: 21
- Last push: 2025-12-05
- Archived: no
- License: Apache-2.0
- Created: 2020-11-05

## Ecosystem

Aeraki is one repository in a set of sibling projects under the same organisation:

- `meta-protocol-proxy`: the C++ Envoy filter data plane that pairs with Aeraki.
- `api` and `client-go`: shared API types and generated client, both Aeraki dependencies (`go.mod`).
- `meta-protocol-control-plane-api`: the control-plane API definitions.
- `aerakictl`: a debugging command-line tool.
- `website`: the project documentation site.

Aeraki integrates with Istio (required, over MCP over xDS via `internal/controller/istio/controller.go`) and Envoy (through the generated `EnvoyFilter` resources). Version compatibility is strict: Aeraki 1.4.x targets Istio 1.18.x and MetaProtocol Proxy 1.4.x per the [install docs](https://www.aeraki.net/docs/v1.x/install/).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Plain Istio with hand-written `EnvoyFilter` | Possible, but you implement the filter and routing per protocol; Aeraki reduces the work to a MetaProtocol codec (`README.md:72`). |
| Istio native Dubbo/Thrift/MySQL/MongoDB/Redis filters | Inline routes only, so connections break on route change; no dynamic RDS (`README.md:50`). Aeraki ships a dynamic RDS for MetaProtocol. |
| Cilium / Linkerd | L7 handling is centred on HTTP and gRPC; declarative routing for Dubbo, Thrift, or proprietary RPC is out of scope. Aeraki's distinction is adding arbitrary request/response L7 protocols by writing a codec. |

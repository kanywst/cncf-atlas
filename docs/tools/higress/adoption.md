# Adoption & Ecosystem

## Who uses it

Two citable sources name production adopters: the repository's `ADOPTERS.md` and the CNCF announcement blog. The table records organizations that appear in at least one of them. The CNCF blog lists additional production users (Alibaba Group, Ant Group, BOSS Zhipin, Cathay Insurance, DJI) for cloud-native traffic routing as well as AI gateway and MCP service use.

| Organisation | Use case | Source |
| --- | --- | --- |
| Ant Digital (antdigital) | Ingress, microservice, LLM, and MCP gateway (production) | [ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md) |
| Kuaishou | LLM gateway (production) | [ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md), [CNCF blog](https://www.cncf.io/blog/2026/03/25/higress-joins-cncf-delivering-an-enterprise-grade-ai-gateway-and-a-seamless-path-from-nginx-ingress/) |
| Trip.com (Ctrip) | LLM and MCP gateway (production) | [ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md), [CNCF blog](https://www.cncf.io/blog/2026/03/25/higress-joins-cncf-delivering-an-enterprise-grade-ai-gateway-and-a-seamless-path-from-nginx-ingress/) |
| Vipshop | LLM, MCP, and inference gateway (production) | [ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md), [CNCF blog](https://www.cncf.io/blog/2026/03/25/higress-joins-cncf-delivering-an-enterprise-grade-ai-gateway-and-a-seamless-path-from-nginx-ingress/) |
| Sealos (labring) | Ingress gateway; migrated from nginx Ingress | [ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md), [Sealos blog](https://sealos.io/blog/sealos-envoy-vs-nginx-2000-tenants) |
| Alibaba | Backs internal AI applications; Alibaba Cloud offers a commercial gateway built on Higress | [Higress README](https://github.com/higress-group/higress/blob/main/README.md), [CNCF blog](https://www.cncf.io/blog/2026/03/25/higress-joins-cncf-delivering-an-enterprise-grade-ai-gateway-and-a-seamless-path-from-nginx-ingress/) |

Sealos documented moving tens of thousands of ingress rules from nginx Ingress to Higress across roughly 2,000 tenants (Sealos blog). Alibaba Cloud builds its commercial API gateway product on Higress and uses it internally behind the Tongyi Bailian model studio and the PAI platform (README).

## Adoption signals

As of 2026-07-09 the repository shows about 8,816 stars, 1,186 forks, and roughly 182 contributors, created 2022-10-27 (repository signals). The release line is active: `v2.2.3` was tagged 2026-06-25, and the documented commit `bd9c4c5` sits a few commits past it on `main`. CNCF Sandbox status was announced 2026-03-25 (CNCF blog). The contributor count is wider than a single-vendor project, though Alibaba remains the primary driver.

## Ecosystem

Higress is built on Envoy (data plane) and a forked Istio Pilot (control plane), so those two projects are its foundation rather than integrations. On input it accepts Kubernetes Ingress, nginx-compatible annotations, and Gateway API. For service discovery it integrates with Nacos, Consul, Eureka, and ZooKeeper (`registry/`), reflecting its Alibaba microservices (Dubbo) heritage. The Wasm Plugin Hub distributes the 59 shipped Go extensions and third-party plugins, written with the higress-group Go SDK. For AI, `openapi-to-mcpserver` (higress-group) turns OpenAPI specs into MCP servers the gateway can host. The CNCF blog notes open-source projects built on Higress, including HiMarket and HiClaw.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Istio ingress gateway | Higress embeds a forked Istio Pilot, so it is close kin; the difference is that Higress treats Ingress plus nginx annotations and Gateway API as first-class and layers Wasm plugins and AI-gateway features on top, hiding Istio's CRDs |
| Envoy Gateway | Also Envoy data plane with Gateway API; Envoy Gateway leads with Gateway API conformance, while Higress leads with nginx-Ingress migration and AI/MCP features |
| Apache APISIX | Built on nginx/OpenResty with Lua plugins; Higress is Envoy/Wasm-based, and ships some compatibility such as an `hmac-auth-apisix` plugin |
| Kong | Built on nginx/OpenResty with Lua plugins and an enterprise focus; Higress differentiates on the AI gateway (many LLM providers behind one API) and MCP server hosting |

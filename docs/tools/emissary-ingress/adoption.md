# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS.md` file, so the named users below come from public reporting rather than a maintained adopter list. The New Stack reported Ticketmaster, Chick-fil-A, and AppDirect as production users, citing figures from Ambassador Labs including a peak of 500,000 requests per second and a user base that jumped from 5 million to 15 million in under ten minutes ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)).

| Organisation | Use case | Source |
| --- | --- | --- |
| Ticketmaster | Production API gateway / ingress | [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/) |
| Chick-fil-A | Production API gateway / ingress | [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/) |
| AppDirect | Production API gateway / ingress | [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/) |

## Adoption signals

From the GitHub REST API on 2026-06-24 (`gh api repos/emissary-ingress/emissary`): 4,509 stars, 707 forks, and 427 open issues. The `contributors` API paginates to 192 non-anonymous logins. The project is a CNCF Incubating project ([CNCF projects](https://www.cncf.io/projects/emissary-ingress/)), with the latest release `v4.1.0` on 2026-05-19 ([GitHub](https://github.com/emissary-ingress/emissary)).

## Ecosystem

- **Envoy Proxy** is the data plane Emissary is built on.
- **Observability** integrates with Prometheus, Grafana, and Datadog; tracing connects to Zipkin/Jaeger-family backends through the `IRTracing` config.
- **Service mesh**: it can sit in front of Linkerd, Istio, or Consul.
- **Knative** serverless and the **Gateway API** are supported; Gateway API objects ride in the snapshot (`pkg/snapshot/v1/types.go:84-87`).
- **Ambassador Edge Stack** is the commercial superset, adding ACME/OIDC and a developer portal on the same core ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Contour | Also Envoy-based and a CNCF project, but uses a single `HTTPProxy` CRD and one Go binary for a simpler design; Emissary adds its own Mapping/Host/Listener CRDs and a Python config engine with heavier API gateway features ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)) |
| Istio ingress gateway | Assumes a full service mesh and is heavier; Emissary stands alone as a mesh-independent edge gateway |
| ingress-nginx | Mature and NGINX-based, but lacks Envoy's dynamic xDS updates and the finer L7 control Emissary exposes |
| Ambassador Edge Stack | The same core plus commercial ACME/OIDC/developer portal features |

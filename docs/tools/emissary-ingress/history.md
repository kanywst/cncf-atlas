# History

## Origin

Emissary-Ingress began in 2014 at Datawire, the company later renamed Ambassador Labs, under the name Ambassador API Gateway. CEO Richard Li has said the project was inspired by an Envoy talk that Envoy author Matt Klein gave at the Microservices Practitioner Summit, and that the team built the first Envoy-based version three to four months after that talk ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)). The 1.0 release shipped in January 2020 ([CNCF blog](https://www.cncf.io/blog/2021/04/13/emissary-ingress-formerly-ambassador-is-now-a-cncf-incubating-project/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2014 | Created at Datawire as Ambassador API Gateway, built on Envoy Proxy |
| 2020 | Version 1.0 released |
| 2021 | Donated to CNCF and renamed Emissary-Ingress; accepted directly as an Incubating project |

## How it evolved

The project was donated to the CNCF on 2021-04-13 and renamed from Ambassador to Emissary-Ingress at the same time. Richard Li explained that the team could not transfer the Ambassador trademark, which was tied to the company name, to the CNCF, so they chose a new name (an "emissary" being a different kind of "ambassador"). It was accepted straight into the Incubating tier rather than passing through Sandbox first, because it was already a well-known project under its prior name. It became the second ingress controller in the CNCF after Contour ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/), [CNCF projects](https://www.cncf.io/projects/emissary-ingress/)).

The open-source Emissary-Ingress remains the core of the commercial Ambassador Edge Stack, which layers ACME/TLS automation, OAuth/OIDC, rate limiting, and a developer portal on top ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)).

## Where it stands now

The latest release at the time of writing is `v4.1.0` (2026-05-19), and this deep-dive is pinned to commit `65b0dd9ae`, near tag `v4.0.1`. According to The New Stack, the parent company Ambassador Labs stepped back from direct involvement, and the project shifted toward community governance ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)). Governance is documented in the project's [GOVERNANCE.md](https://github.com/emissary-ingress/emissary/blob/master/Community/GOVERNANCE.md).

# Adoption & Ecosystem

## Who uses it

The organisations below are listed on Contour's official adopters page and in the repository's `site/content/resources/adopters.md`.

| Organisation | Use case | Source |
| --- | --- | --- |
| SnappCloud | Migrated from the OpenShift Router to Contour (success story) | <https://projectcontour.io/resources/adopters/> |
| Knative | Bridges KIngress to `HTTPProxy` via `net-contour` | <https://projectcontour.io/resources/adopters/> |
| VMware | Ingress for Tanzu | <https://projectcontour.io/resources/adopters/> |
| Gojek | Ingress across all Kubernetes clusters | <https://projectcontour.io/resources/adopters/> |
| Flyte | Default ingress for its sandbox | <https://projectcontour.io/resources/adopters/> |
| DaoCloud | Contour-based next-generation microservice gateway | <https://projectcontour.io/resources/adopters/> |
| Bugfender | Listed adopter | <https://projectcontour.io/resources/adopters/> |

When Contour was accepted as a CNCF Incubating project (2020-07-07), the announcement named these production users: Adobe (multi-tenant platform "Project Ethos"), Kinvolk, Kintone, PhishLabs, and Replicated.

## Adoption signals

Observed 2026-06-24 via `gh api repos/projectcontour/contour`:

- Stars: 3,934
- Forks: 716
- Open issues: 120
- Contributors: roughly 240 (the `contributors` endpoint paginates to a last page of 240, including anonymous contributors)

Governance is documented in the `projectcontour/community` repository (`GOVERNANCE.md`, referenced from `CONTRIBUTING.md:212`). Maintainers are listed in that repository's `MAINTAINERS.md` and tracked on the CNCF side in `cncf/foundation`'s `project-maintainers.csv` as an Incubating project. Triage happens in a weekly community meeting (`CONTRIBUTING.md:238`).

## Ecosystem

- Envoy is the data plane and a required dependency.
- Gateway API (SIG-Network) is supported as a first-class configuration surface.
- Knative integrates via `net-contour`.
- Common combinations include ExternalDNS and cert-manager.
- Contour ships its own Gateway provisioner.
- External authorization via Envoy `ext_authz`, plus global and local rate limiting.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| ingress-nginx | NGINX-based and very widely deployed. Contour is Envoy-based with dynamic config (no reload or restart) and `HTTPProxy` delegation for multi-team separation. |
| Emissary-ingress (formerly Ambassador) | Also an Envoy-based CNCF project. Contour focuses on the `HTTPProxy` CRD and Gateway API with a lighter control plane. |
| Istio ingress / Gateway | Built for a service mesh; broad features but heavier. Contour focuses on ingress. |
| Envoy Gateway | Envoy's own Gateway API implementation. Contour differentiates with the historical `HTTPProxy` CRD and existing operational base. |

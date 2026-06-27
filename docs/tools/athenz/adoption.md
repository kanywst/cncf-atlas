# Adoption & Ecosystem

## Who uses it

The adopters below are the ones with a citable source: the repository `ADOPTERS.md` at the pinned commit, plus testimonials on the project site.

| Organisation | Use case | Source |
| --- | --- | --- |
| Yahoo | RBAC and service authentication for Kubernetes workload security | [athenz.io](https://www.athenz.io/) (source 3) |
| LY Corporation | Security platform for Yahoo! JAPAN services | [lycorp.co.jp](https://www.lycorp.co.jp/en/) (source 4) |
| Vespa.ai | Listed in the project ADOPTERS file | [vespa.ai](https://vespa.ai/) (source 3) |

## Adoption signals

Measured from the GitHub API on 2026-06-24 (source 6):

- Stars: 994
- Forks: 306
- Contributors: about 109 (paged with `anon=true`)
- Open issues: 44
- Latest release: v1.12.43 (2026-06-19), on an active 1.12.x line
- The project carries a CII Best Practices badge (project 4681)

## Ecosystem

Athenz ships SIA identity providers for the major clouds (AWS EC2/ECS/Fargate/EKS, GCP GCE/GKE/Run, Azure VM) and for CI systems (GitHub Actions, Buildkite, Harness, Spacelift). It integrates with Envoy through an SDS implementation in `libs/go/sia/sds`, has Kubernetes-oriented pieces under `kubernetes/`, `provider/aws/sia-eks`, and `provider/gcp/sia-gke`, and exchanges Athenz identity for AWS temporary credentials. Server-side extensions in `server_common` cover DynamoDB, Pulsar, and Slack notifications. The UI is a React application.

## Alternatives

Athenz is unusual in pairing identity issuance (ZTS) with a built-in RBAC model (ZMS) in one system. The alternatives below each cover part of that surface.

| Alternative | Differs by |
| --- | --- |
| SPIFFE/SPIRE | Standardizes workload identity issuance and verification (SVID, X.509/JWT) but carries no authorization/RBAC layer; Athenz bundles identity plus role certificates and access tokens (source 1). |
| Open Policy Agent | A general-purpose policy engine (Rego) with strong authorization logic, but no identity issuance or certificate lifecycle; Athenz is domain-specific and includes both. |
| Keycloak | A user-facing IAM with OIDC/SAML SSO for humans; Athenz targets service-to-service mTLS and workload identity. |
| cert-manager | Automates certificate issuance in Kubernetes, close on CA integration, but has no RBAC authorization layer. |

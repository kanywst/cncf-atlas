# Athenz

> X.509 service identity and fine-grained RBAC for dynamic, hybrid-cloud infrastructure.

- **Category**: Identity & Policy
- **CNCF maturity**: Sandbox
- **Language**: Java (servers), Go (agents and clients), JavaScript/React (UI)
- **License**: Apache-2.0
- **Repository**: [AthenZ/athenz](https://github.com/AthenZ/athenz)
- **Documented at commit**: `3a7ae05` (near v1.12.43, 2026-06-19)

## What it is

Athenz issues identities to services and decides what those services are allowed to do. It splits the job into two servers. ZMS (Athenz Management System) is the source of truth for authorization data: domains, roles, policies, and service identities. ZTS (Athenz Token System) issues short-lived credentials at the edge: X.509 identity certificates, role certificates, OAuth2 access tokens, and role tokens.

The name comes from "AuthNZ", where N is authentication and Z is authorization. A workload proves what it is using attestation from its platform (AWS, GCP, Azure, Kubernetes, GitHub Actions, and others), gets an X.509 identity certificate from ZTS, and then any service it calls can check access against centrally managed policy.

It is built for dynamic infrastructure where long-lived static credentials do not fit: autoscaling VMs, containers, and short-lived CI jobs. Policy is managed centrally in ZMS but can be enforced locally and offline through a client-side policy engine (ZPE), so the authorization decision does not require a round trip on every request.

## When to use it

- You run service-to-service traffic and want mTLS identities tied to a central RBAC model, not just certificates.
- Your workloads are ephemeral and you want platform attestation (cloud metadata, Kubernetes service account tokens, CI OIDC) exchanged for short-lived certificates instead of distributing static secrets.
- You need fine-grained, centrally managed policy with explicit-deny semantics across many domains.
- It is not the right fit if you only need human SSO with an OIDC/SAML IdP; that is Keycloak's territory.
- It is not the right fit if you only need workload identity issuance with no built-in RBAC layer; SPIFFE/SPIRE is narrower and standardized for that.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. Athenz CNCF project page (Sandbox accepted 2021-01-26): <https://www.cncf.io/projects/athenz/>
2. cncf/toc onboarding issue for Athenz: <https://github.com/cncf/toc/issues/595>
3. AthenZ/athenz README and repository: <https://github.com/AthenZ/athenz>
4. athenz.io official site: <https://www.athenz.io/>
5. Dash Open 21: Athenz (open-sourcing the platform): <https://yahoodevelopers.tumblr.com/post/615496922672824320/dash-open-21-athenz-open-source-platform-for>
6. GitHub API for AthenZ/athenz (stars, forks, releases): <https://github.com/AthenZ/athenz>
7. AthenZ/athenz CHANGELOG (open governance, v1.10.4): <https://github.com/AthenZ/athenz/blob/master/CHANGELOG>

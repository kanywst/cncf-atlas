# Adoption & Ecosystem

## Who uses it

The project's `ADOPTERS.md` lists organizations with public references, and the CNCF graduation announcement named several production users. Every entry below comes from one of those two sources.

| Organisation | Use case | Source |
| --- | --- | --- |
| Atlassian | Microservice API authorization across a heterogeneous cloud, embedded in its Slauth (AAA) system, with policy distributed via S3 | [ADOPTERS.md](https://github.com/open-policy-agent/opa/blob/main/ADOPTERS.md) |
| Netflix, Goldman Sachs, Pinterest, T-Mobile | Named as production users in the CNCF graduation announcement | [CNCF graduation announcement](https://www.cncf.io/announcements/2021/02/04/cloud-native-computing-foundation-announces-open-policy-agent-graduation/) |
| Capital One, Chef, Cloudflare, Tripadvisor, SAP | Listed adopters | [ADOPTERS.md](https://github.com/open-policy-agent/opa/blob/main/ADOPTERS.md) |
| Appsflyer | Authorization for hundreds of microservices delegated to a central OPA | [ADOPTERS.md](https://github.com/open-policy-agent/opa/blob/main/ADOPTERS.md) |
| Bisnode (Dun & Bradstreet) | Microservice authorization, Kubernetes authorization and admission control, and CI/CD, with JVM integration tooling published | [ADOPTERS.md](https://github.com/open-policy-agent/opa/blob/main/ADOPTERS.md) |

## Adoption signals

Measured against the GitHub API on 2026-06-23: 11,884 stars, 1,595 forks, 131 watchers, and 366 open issues ([open-policy-agent/opa](https://github.com/open-policy-agent/opa)). At graduation the project reported more than 90 contributors and roughly 30 organizations, with maintainers from Google, Microsoft, VMware, and Styra ([CNCF graduation announcement](https://www.cncf.io/announcements/2021/02/04/cloud-native-computing-foundation-announces-open-policy-agent-graduation/)). By OPA 1.0 the project reported over 5,000 commits and more than 400 contributors ([OPA 1.0 blog](https://blog.openpolicyagent.org/opa-1-0-is-coming-heres-what-you-need-to-know-c8fb0d258368)).

## Ecosystem

- OPA Gatekeeper runs OPA as a Kubernetes admission controller driven by CRDs (originated at Google and Microsoft, donated to CNCF). It is a layer on top of OPA, not a replacement.
- Envoy and Istio use OPA as an external authorization (ext_authz) sidecar PDP for API authorization.
- conftest, Terraform, and CI/CD pipelines use OPA as a policy gate for infrastructure-as-code and pipelines.
- Distribution mechanisms include bundles (policy plus data pulled over HTTP or OCI), decision logging, and the status plugin.

## Alternatives

OPA is a general-purpose policy engine with Rego. The honest trade-off is scope versus learning cost: if you only need Kubernetes admission, a Kubernetes-native engine is lighter; if you want one policy language across the whole stack, OPA's generality pays off ([Nirmata comparison](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/), [policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/)).

| Alternative | Differs by |
| --- | --- |
| Kyverno (CNCF Incubating) | Kubernetes-only; policies are Kubernetes YAML resources with mutation and generation support. Lighter footprint (one controller deployment) and no Rego, but scoped to Kubernetes. OPA/Gatekeeper is validation-centric with a higher Rego learning curve and cross-platform reach ([Nirmata](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/), [policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/)). |
| AWS Cedar / Amazon Verified Permissions | Application-layer authorization language. Overlaps OPA's general authorization but targets application access decisions rather than Kubernetes admission. |

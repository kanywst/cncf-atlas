# Open Policy Agent (OPA)

> A general-purpose policy engine that decouples authorization decisions from application code, evaluated through the Rego query language.

- **Category**: Identity & Policy
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [open-policy-agent/opa](https://github.com/open-policy-agent/opa)
- **Documented at commit**: `f75131f` (between v1.17.1 and v1.18.0-dev, 2026-06-18)

## What it is

OPA is a policy engine. You feed it a policy written in Rego and a JSON document called the input, and it returns a decision: allow or deny, a list of violations, a filtered set of fields, whatever the policy computes. The engine itself knows nothing about Kubernetes, HTTP, or any specific domain. It evaluates Rego over structured data and returns structured data.

It ships as a single Go binary, `opa`. The same binary runs as a command-line tool for evaluating and testing policy (`opa eval`, `opa test`), as a long-running REST server that acts as a policy decision point (`opa run --server`), and the Go packages can be embedded directly in another program through the `rego` API. Policy and the external data it needs are distributed as bundles, which OPA pulls over HTTP or OCI.

OPA sits at the decision boundary of a system. An application or proxy asks "is this request allowed?" and OPA answers from policy, so the enforcement logic lives in one place that is versioned, tested, and shared across services rather than scattered through application code.

## When to use it

- You need authorization decisions that are uniform across many services and want the policy expressed once, separate from each service's code.
- You want to enforce policy across heterogeneous layers (API authorization, Kubernetes admission, CI/CD gates, infrastructure-as-code) with one language and one engine.
- You need decisions externalized into a versioned, testable artifact rather than hard-coded conditionals.
- It is a weaker fit when your scope is only Kubernetes admission, where a Kubernetes-native engine like Kyverno avoids the Rego learning curve.
- It is a weaker fit when you want application-layer authorization only and prefer a purpose-built relationship-based model.

## In this deep-dive

- [History](./history): origin at Styra, CNCF graduation, OPA 1.0, and the 2025 Apple move.
- [Architecture](./architecture): the packages and how a policy query flows.
- [Adoption & Ecosystem](./adoption): cited adopters, GitHub signals, and alternatives.
- [Internals](./internals): the evaluation path and core data structures, read from source.
- [Getting Started](./getting-started): install and a first working policy decision.

## Sources

1. [open-policy-agent/opa on GitHub](https://github.com/open-policy-agent/opa) (2026-06-23)
2. [OPA ADOPTERS.md](https://github.com/open-policy-agent/opa/blob/main/ADOPTERS.md) (2026-06-23)
3. [OPA GOVERNANCE.md](https://github.com/open-policy-agent/opa/blob/main/GOVERNANCE.md) (2026-06-23)
4. [OPA MAINTAINERS.md](https://github.com/open-policy-agent/opa/blob/main/MAINTAINERS.md) (2026-06-23)
5. [OPA v1.0.0 release notes](https://github.com/open-policy-agent/opa/releases/tag/v1.0.0) (2026-06-23)
6. [Open Policy Agent - CNCF project page](https://www.cncf.io/projects/open-policy-agent-opa/) (2026-06-23)
7. [CNCF announces OPA graduation](https://www.cncf.io/announcements/2021/02/04/cloud-native-computing-foundation-announces-open-policy-agent-graduation/) (2026-06-23)
8. [InfoQ: Open Policy Agent Graduates at CNCF](https://www.infoq.com/news/2021/02/opa-cncf-graduation/) (2026-06-23)
9. [Styra: Open Policy Agent 101, a Beginner's Guide](https://www.styra.com/blog/open-policy-agent-101-a-beginners-guide/) (2026-06-23)
10. [openpolicyagent.org docs](https://www.openpolicyagent.org/docs) (2026-06-23)
11. [OPA 1.0 is Coming](https://blog.openpolicyagent.org/opa-1-0-is-coming-heres-what-you-need-to-know-c8fb0d258368) (2026-06-23)
12. [Note from Teemu, Tim and Torin to the OPA community](https://blog.openpolicyagent.org/note-from-teemu-tim-and-torin-to-the-open-policy-agent-community-2dbbfe494371) (2026-06-23)
13. [Cloud Native Now: Apple Buys Styra Brains, OPA Remains Open](https://cloudnativenow.com/features/apple-buys-styra-brains-opa-remains-open/) (2026-06-23)
14. [Open Source For You: Apple Acquires OPA Developers](https://www.opensourceforu.com/2025/08/apple-acquires-open-policy-agent-developers-while-cncf-retains-control-of-open-source-project/) (2026-06-23)
15. [Nirmata: Kubernetes Policy Comparison, Kyverno vs OPA Gatekeeper](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/) (2026-06-23)
16. [policyascode.dev: OPA Gatekeeper vs Kyverno](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/) (2026-06-23)

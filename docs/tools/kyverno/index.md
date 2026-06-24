# Kyverno

> A Kubernetes admission engine where each policy is itself a Kubernetes resource, so teams write and review policy as YAML instead of a separate language.

- **Category**: Security & Compliance
- **CNCF maturity**: Graduated
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [kyverno/kyverno](https://github.com/kyverno/kyverno)
- **Documented at commit**: `989e001` (v1.18.1 line, 2026-06-20)

## What it is

Kyverno is a policy engine for Kubernetes. It runs as admission webhooks that the API server calls when a resource is created, updated, or deleted. Each policy is a Kubernetes custom resource, so the same `kubectl apply` and RBAC that manage workloads also manage the rules that govern them.

A single rule can do one of four things: validate a resource and accept or reject it, mutate it by patching fields, generate companion resources such as a default NetworkPolicy in a new namespace, or verify a container image signature. Validation and mutation run inline during the admission request. Generation and mutation of already-existing resources run asynchronously through a background controller.

Recent releases move toward the Common Expression Language (CEL), the same language Kubernetes uses for its native ValidatingAdmissionPolicy. Kyverno ships CEL-based policy types alongside the older `ClusterPolicy` model and can bind to the Kubernetes-native admission policies rather than replace them. The project runs as several binaries: the admission controller, a background controller, a cleanup controller, a reports controller, and the `kubectl-kyverno` CLI.

## When to use it

- You want to enforce, mutate, or generate Kubernetes resources and prefer policies expressed as Kubernetes YAML over a separate policy language.
- You need image signature verification or auto-generation of companion resources handled by the same engine, not bolted on.
- You want one rule written for Pods to also cover Deployments, DaemonSets, StatefulSets, Jobs, and CronJobs without copying it per controller.
- It is a weaker fit when your policy logic is largely outside Kubernetes admission, or when you have already standardised on a general-purpose policy language across non-Kubernetes systems.

## In this deep-dive

- [History](./history): origin at Nirmata, CNCF donation, and graduation.
- [Architecture](./architecture): the controllers and how one admission request flows through them.
- [Adoption & Ecosystem](./adoption): cited adopters, GitHub signals, and the surrounding tools.
- [Internals](./internals): the rule and response data structures, read from source.
- [Getting Started](./getting-started): install with Helm and block a non-compliant Pod.

## Sources

1. [kyverno/kyverno on GitHub](https://github.com/kyverno/kyverno) (2026-06-22)
2. [CNCF Announces Kyverno's Graduation](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/) (2026-06-22)
3. [Kyverno - CNCF project](https://www.cncf.io/projects/kyverno/) (2026-06-22)
4. [Announcing Kyverno release 1.18](https://www.cncf.io/blog/2026/05/05/announcing-kyverno-release-1-18/) (2026-06-22)
5. [Kubernetes Policy Comparison: Kyverno vs OPA/Gatekeeper, Nirmata](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/) (2026-06-22)
6. [OPA/Gatekeeper vs Kyverno, policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/) (2026-06-22)
7. [Kyverno Introduction / Quick Start](https://kyverno.io/docs/introduction/) (2026-06-22)
8. [Kyverno ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) (2026-06-22)
9. [Kyverno GOVERNANCE.md](https://github.com/kyverno/community/blob/main/GOVERNANCE.md) (2026-06-22)
10. [GitHub REST API repos/kyverno/kyverno](https://api.github.com/repos/kyverno/kyverno) (2026-06-22)

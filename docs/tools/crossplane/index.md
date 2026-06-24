# Crossplane

> A Kubernetes-based control plane framework that lets platform teams define their own APIs and have controllers continuously reconcile cloud and in-cluster resources toward a declared state.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Graduated
- **Language**: Go (`go 1.25.10`, module `github.com/crossplane/crossplane/v2`)
- **License**: Apache-2.0
- **Repository**: [crossplane/crossplane](https://github.com/crossplane/crossplane)
- **Documented at commit**: `56aace77` (2026-06-19, `main`, after `v2.3.2`)

## What it is

Crossplane runs on top of a Kubernetes API server and turns it into a control plane for infrastructure and applications. It does not keep its own state file. Desired and observed state both live as custom resources in etcd, and controllers reconcile them continuously. This differs from the single `apply` model of Terraform or Pulumi, where a CLI run computes a diff against a stored state file (see the [Pulumi comparison](https://www.pulumi.com/docs/iac/comparisons/crossplane/)).

The core abstraction is composition. A platform team defines a `CompositeResourceDefinition` (XRD) to create a new resource type, then writes a `Composition` that maps each instance of that type to a pipeline of functions. The functions produce the actual managed and Kubernetes resources. The result is a self-service API that application teams consume without touching the underlying cloud providers.

Crossplane v2 (August 2025) removed the older patch-and-transform mechanism and made composition entirely function-based. Each function is a separate gRPC service, so compositions can be written in YAML, KCL, Python, Go, or other languages. v2 also lets a composition include any Kubernetes resource, not only Crossplane managed resources.

## When to use it

- You want a platform engineering layer where application teams provision infrastructure through APIs you design, with role-based access and validation enforced by Kubernetes.
- You need continuous drift correction. Because reconciliation never stops, out-of-band changes to managed resources get reverted toward the declared state.
- You already run Kubernetes and want resource state in etcd rather than in separate state files with locks.
- You want to compose cloud resources and in-cluster workloads (for example a database operator's `Cluster` plus a `Deployment`) behind one API.

It is a weaker fit when you do not run Kubernetes, or when your team lacks Kubernetes operational knowledge and only needs occasional one-shot provisioning. In those cases a CLI tool such as Terraform or Pulumi has a lower entry cost (see [platformengineering.org](https://platformengineering.org/blog/terraform-vs-pulumi-vs-crossplane-iac-tool)).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [crossplane/crossplane repository](https://github.com/crossplane/crossplane)
2. [Announcing Crossplane's CNCF Graduation](https://blog.crossplane.io/crossplane-cncf-graduation/)
3. [CNCF announces graduation of Crossplane](https://www.cncf.io/announcements/2025/11/06/cloud-native-computing-foundation-announces-graduation-of-crossplane/)
4. [Crossplane on CNCF projects](https://www.cncf.io/projects/crossplane/)
5. [Crossplane is now a CNCF Incubating project](https://blog.crossplane.io/crossplane-cncf-incubation/)
6. [cncf/toc#1397 Crossplane Graduation Application](https://github.com/cncf/toc/issues/1397)
7. [What's New in v2](https://docs.crossplane.io/latest/whats-new/)
8. [What's Crossplane?](https://docs.crossplane.io/latest/whats-crossplane/)
9. [Functions](https://docs.crossplane.io/latest/packages/functions/)
10. [Compositions](https://docs.crossplane.io/latest/composition/compositions/)
11. [Get started](https://docs.crossplane.io/latest/get-started/)
12. [Pulumi vs. Crossplane](https://www.pulumi.com/docs/iac/comparisons/crossplane/)
13. [Terraform vs Pulumi vs Crossplane](https://platformengineering.org/blog/terraform-vs-pulumi-vs-crossplane-iac-tool)
14. [Introducing function-kro: YAML+CEL Composition](https://blog.crossplane.io/function-kro-yaml-cel/)
15. [crossplane/crossplane ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md)
16. [GitHub API repos/crossplane/crossplane](https://api.github.com/repos/crossplane/crossplane)

# Capsule

> Capsule turns a single Kubernetes cluster into a multi-tenant platform by grouping namespaces under a Tenant custom resource and enforcing isolation with admission webhooks.

- **Category**: Identity & Policy
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [projectcapsule/capsule](https://github.com/projectcapsule/capsule)
- **Documented at commit**: `8d89d68` (near tag v0.13.7, 2026-06-24)

## What it is

Capsule is a Kubernetes operator for soft multi-tenancy. Soft multi-tenancy means many teams share one API server and one control plane, and the boundary between them is drawn with admission control and Role-Based Access Control (RBAC) rather than with separate clusters or virtual control planes. Capsule adds a cluster-scoped `Tenant` Custom Resource Definition (CRD) that bundles a set of namespaces, the users who own them, and the policies that apply to them.

A plain Kubernetes namespace is flat. There is no native object that says "these ten namespaces belong to one team and share a quota." Teams work around this by giving each team its own cluster, which leads to cluster sprawl and its operational cost. Capsule fills that gap inside a single cluster: a tenant owner can self-serve new namespaces, and Capsule keeps each namespace inside the limits, network policies, and role bindings defined on the tenant.

Capsule runs as a single controller binary that does two jobs. It is a set of controller-runtime reconcilers that sync tenant policy onto member namespaces, and it is a set of admission webhooks that intercept namespace, pod, ingress, and other requests before they persist. Both are registered on one manager in `cmd/controller/main.go:115`.

## When to use it

- You run one cluster shared by internal teams that trust each other enough to share an API server, and you want each team to self-serve namespaces within a quota.
- You want to avoid cluster sprawl by consolidating per-team clusters into one cluster with logical tenant boundaries.
- You need namespace-group policy (shared quota, default network policies, role bindings, allowed storage and priority classes) expressed as a single declarative object that fits GitOps.
- It is the wrong tool when tenants are mutually untrusted or need their own cluster-scoped resources and CRDs. A virtual or dedicated control plane such as vCluster or Kamaji fits that case better.

## In this deep-dive

- [History](./history): origin at Clastix, the move to a neutral CNCF org, and milestones.
- [Architecture](./architecture): the controller and webhook halves, and how a namespace creation flows.
- [Adoption & Ecosystem](./adoption): cited adopters, GitHub signals, and alternatives.
- [Internals](./internals): the ownership model, core types, and one traced code path.
- [Getting Started](./getting-started): install with Helm and create a first tenant.

## Sources

1. projectcapsule/capsule (GitHub): <https://github.com/projectcapsule/capsule>
2. Capsule project page (CNCF): <https://www.cncf.io/projects/capsule/>
3. Sandbox Inclusion Results from December 13, 2022: <https://lists.cncf.io/g/cncf-toc/message/7743>
4. CNCF Sandbox project onboarding (umbrella issue #812): <https://github.com/projectcapsule/capsule/issues/812>
5. Project Capsule documentation: <https://projectcapsule.dev/>
6. Capsule installation guide: <https://projectcapsule.dev/docs/operating/setup/installation/>
7. Capsule adopters: <https://projectcapsule.dev/adopters/>
8. Capsule (clastix mirror site): <https://capsule.clastix.io/>
9. Dario Tranchitella's Capsule announcement thread: <https://threadreaderapp.com/thread/1293084561908400128.html>
10. Comparing Multi-tenancy Options in Kubernetes (vCluster): <https://www.vcluster.com/blog/comparing-multi-tenancy-options-in-kubernetes>
11. Building a Multi-Tenancy Platform with Capsule and vCluster (SREKubeCraft): <https://srekubecraft.io/posts/k8s-multi-tenancy/>
12. ADOPTERS.md @ commit 8d89d68: <https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md>
13. MAINTAINERS.md @ commit 8d89d68: <https://github.com/projectcapsule/capsule/blob/main/MAINTAINERS.md>
14. GitHub REST API repos/projectcapsule/capsule: <https://api.github.com/repos/projectcapsule/capsule>

# Operator Framework

> A toolkit to build, package, and ship Kubernetes Operators in Go, Ansible, or Helm, wired into the Operator Lifecycle Manager for install and upgrades.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [operator-framework/operator-sdk](https://github.com/operator-framework/operator-sdk)
- **Documented at commit**: `c7f6cde` (2026-05-26, master, near tag v1.42.2)

## What it is

Operator Framework is a set of projects for building Kubernetes Operators: controllers that encode the operational knowledge of running an application as Kubernetes custom resources. It has two pillars, the Operator SDK for authoring Operators and the Operator Lifecycle Manager (OLM) for installing and upgrading them on a cluster.

This deep-dive pins the developer-facing flagship, `operator-framework/operator-sdk`. The SDK is a command-line tool. It does not ship its own scaffolding engine; it embeds the kubebuilder v4 plugin-based CLI and layers OLM integration plus Ansible and Helm language support on top. Its own contribution is the distribution and lifecycle layer: scorecard validation, bundle packaging, and deploying through OLM.

It is for engineers who package an application as an Operator and want one tool that covers code generation, validation, bundling, and cluster install. OLM itself (`operator-lifecycle-manager` for v0, `operator-controller` for v1) sits underneath as the runtime that reconciles the resources the SDK creates.

## When to use it

- You are building a Kubernetes Operator in Go, Ansible, or Helm and want a single CLI across all three.
- You need to package an Operator as an OLM bundle and ship it through a catalog with managed install and upgrade.
- You want to validate an Operator bundle with scorecard before publishing to a catalog such as OperatorHub.io.
- Skip it if you only need a plain Go controller with no OLM involvement; kubebuilder alone covers that.
- Skip it if your custom resources provision cloud infrastructure through composition; Crossplane targets that problem instead.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. Operator Framework project page, CNCF: <https://www.cncf.io/projects/operator-framework/>
2. TOC approves Operator Framework as Incubating Project: <https://www.cncf.io/blog/2020/07/09/toc-approves-operator-framework-as-incubating-project/>
3. operator-framework/operator-sdk repository: <https://github.com/operator-framework/operator-sdk>
4. Operator SDK documentation site: <https://sdk.operatorframework.io/>
5. Introducing the Operator Framework, Red Hat / CoreOS: <https://www.redhat.com/en/blog/introducing-operator-framework-building-apps-kubernetes>
6. Java Operator SDK is joining Operator Framework: <https://www.cncf.io/blog/2023/04/18/java-operator-sdk-is-joining-operator-framework/>

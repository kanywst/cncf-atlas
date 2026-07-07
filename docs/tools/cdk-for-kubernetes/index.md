# CDK for Kubernetes (CDK8s)

> Define Kubernetes manifests in real programming languages and synthesize them into plain YAML.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Sandbox
- **Language**: TypeScript (distributed to Python, Java, Go, and .NET through jsii)
- **License**: Apache-2.0
- **Repository**: [cdk8s-team/cdk8s-core](https://github.com/cdk8s-team/cdk8s-core)
- **Documented at commit**: `558f788` (2026-06-25)

## What it is

CDK8s (Cloud Development Kit for Kubernetes) is a framework for writing Kubernetes manifests in a general purpose programming language instead of hand written YAML or templates. You build a tree of objects in code, call a synth step, and the framework writes plain Kubernetes YAML to disk. It never connects to a cluster. Applying the output with `kubectl apply` is the user's job.

The model comes from the Construct Programming Model (CPM), the same abstraction behind AWS CDK (for CloudFormation) and CDKTF (for Terraform). A construct is a node in a tree. CDK8s defines three core construct types: `App` (the root), `Chart` (a unit that maps to one manifest file), and `ApiObject` (a single Kubernetes resource). Multi language support comes from jsii (JavaScript Interop Interface), which compiles the TypeScript source into packages for Python, Java, Go, and .NET.

This deep-dive reads the `cdk8s-team/cdk8s-core` repository, the synthesis engine that is published to npm as the `cdk8s` package. The higher level intent API (`cdk8s-plus`) and the `cdk8s init` / `cdk8s synth` command line tooling (`cdk8s-cli`) live in separate repositories.

## When to use it

- You want type checking, loops, conditionals, and unit tests over your manifests instead of Go template strings.
- You already work in TypeScript, Python, Java, Go, or C# and want to keep manifests in that language.
- You want to compose reusable abstractions across many resources and share them as libraries.
- You want to import existing Custom Resource Definitions (CRDs) or Helm charts and treat them as typed constructs.

When it is a poor fit:

- You want a tool that also applies manifests to the cluster. CDK8s only synthesizes YAML; you still need `kubectl`, Argo CD, or Flux to apply it.
- Your team prefers plain declarative YAML with no build step or programming language toolchain.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how synthesis flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [cdk8s-team/cdk8s-core](https://github.com/cdk8s-team/cdk8s-core) (implementation, published to npm as `cdk8s`), accessed 2026-06-26.
2. [cdk8s-team/cdk8s](https://github.com/cdk8s-team/cdk8s) (umbrella repository), accessed 2026-06-26.
3. [CNCF project page: CDK for Kubernetes (cdk8s)](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/), accessed 2026-06-26.
4. [AWS What's New: cdk8s now Generally Available](https://aws.amazon.com/about-aws/whats-new/2021/10/cdk-kubernetes-cdk8s-available/), accessed 2026-06-26.
5. [AWS containers blog: GA of cdk8s and Go support](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/), accessed 2026-06-26.
6. [cdk8s.io documentation](https://cdk8s.io), accessed 2026-06-26.
7. [npm package: cdk8s](https://www.npmjs.com/package/cdk8s), accessed 2026-06-26.

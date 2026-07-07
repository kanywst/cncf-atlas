# Cedar

> Cedar is an open-source policy language and evaluation engine for fine-grained authorization, designed so that policies can be analyzed and the engine itself formally verified.

- **Category**: Identity & Policy
- **CNCF maturity**: Sandbox
- **Language**: Rust
- **License**: Apache-2.0
- **Repository**: [cedar-policy/cedar](https://github.com/cedar-policy/cedar)
- **Documented at commit**: `991bacf` (2026-06-25)

## What it is

Cedar is a language for writing authorization (deciding whether an authenticated principal may perform an action) policies, plus the engine that evaluates them. An application hands the engine a request made of four parts (principal, action, resource, and context), a set of policies, and a set of entities. The engine returns a single decision: `Allow` or `Deny`.

Cedar came out of Amazon, where it powers Amazon Verified Permissions and AWS Verified Access. It was open-sourced under Apache-2.0 in May 2023 and accepted into the CNCF Sandbox on 2025-10-08. The reference implementation in this repository is written in Rust and exposed as the `cedar-policy` crate, a command-line interface (CLI), a WebAssembly (wasm) binding for JavaScript and TypeScript, and a Language Server Protocol (LSP) server.

What sets Cedar apart from a general-purpose policy engine is that the language is deliberately restricted so policies admit a sound, complete, and decidable logical encoding. That restriction makes it possible to ship a symbolic compiler (`cedar-policy-symcc`) that proves properties about policies with a Satisfiability Modulo Theories (SMT) solver, and to develop the engine with verification-guided development against a formal model.

## When to use it

- You need fine-grained, per-request authorization decisions and want policy decoupled from application code.
- You want to express role-based, attribute-based, and relationship-based access control (RBAC, ABAC, ReBAC) in a single policy language.
- You want to analyze policies statically: prove two policy sets are equivalent, that a policy never errors, or that one policy implies another.
- You want a small, embeddable engine (a Rust crate, a wasm module, or a CLI) rather than a separate networked service.

It is a weaker fit when you need a general-purpose rule engine for arbitrary data transformation, or when your decisions depend on logic Cedar's restricted language cannot express. In those cases a general engine such as Open Policy Agent is closer.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [cedar-policy/cedar repository](https://github.com/cedar-policy/cedar)
2. [Cedar on CNCF (Sandbox)](https://www.cncf.io/projects/cedar/)
3. [Cedar Joins CNCF as a Sandbox Project (AWS Open Source Blog)](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/)
4. [Introducing Cedar, an open-source language for access control (AWS What's New)](https://aws.amazon.com/about-aws/whats-new/2023/05/cedar-open-source-language-access-control/)
5. [Using Open Source Cedar to Write and Enforce Custom Authorization Policies (AWS Open Source Blog)](https://aws.amazon.com/blogs/opensource/using-open-source-cedar-to-write-and-enforce-custom-authorization-policies/)
6. [Cedar: A new approach to policy management for Kubernetes (CNCF Blog)](https://www.cncf.io/blog/2025/03/28/cedar-a-new-approach-to-policy-management-for-kubernetes/)
7. [Cedar Policy Language Reference Guide](https://docs.cedarpolicy.com/)
8. [cedar-policy/cedar release v4.11.2](https://github.com/cedar-policy/cedar/releases/tag/v4.11.2)

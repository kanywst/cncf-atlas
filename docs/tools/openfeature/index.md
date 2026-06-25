# OpenFeature

> A vendor-neutral standard and reference daemon (flagd) for feature flag evaluation across any language and backend.

- **Category**: Developer Tools
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [open-feature/flagd](https://github.com/open-feature/flagd)
- **Documented at commit**: `80b9e95` (tag `flagd/v0.16.0`, 2026-06-01)

## What it is

OpenFeature is a specification for feature flag evaluation. It defines a single evaluation API that application code calls, while the actual flag management system plugs in behind a `provider` interface. The goal is to decouple application code from any one flag vendor, so switching from a SaaS product to a self-hosted backend does not require rewriting evaluation calls (5)(7).

The project is more than a document. It ships SDKs in many languages (Go, Java, JavaScript, .NET, Python, and others) and a reference flag backend called flagd. This deep-dive focuses on flagd, the implementation you can read end to end. flagd is a Go daemon that ingests flag definitions from a file, HTTP endpoint, Kubernetes CRD, gRPC stream, or cloud blob storage, then serves evaluations over gRPC and the OpenFeature Remote Evaluation Protocol (OFREP, a REST API) (1)(12).

flagd sits between your flag definitions and your application. SDKs and providers call it; it holds flags in an in-memory store, applies JSONLogic targeting rules, and returns a value plus a reason code such as `TARGETING_MATCH` or `STATIC` (1)(6).

## When to use it

- You want feature flags without committing to a single commercial vendor; OpenFeature gives you a stable API and a swappable provider behind it (5)(7).
- You need a self-hosted, open-source flag backend that reads flag definitions from files, Kubernetes CRDs, or object storage and serves them over gRPC or REST (1)(12).
- You run on Kubernetes and want flags injected as a sidecar via the OpenFeature Operator (2)(5).
- It is a poorer fit if you only need a single hosted SaaS dashboard and have no concern about vendor lock-in; in that case a vendor SDK alone may be simpler.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [open-feature/flagd](https://github.com/open-feature/flagd) (reference backend repository).
2. [open-feature/spec](https://github.com/open-feature/spec) (the OpenFeature specification).
3. [OpenFeature CNCF project page](https://www.cncf.io/projects/openfeature/) (acceptance dates, maturity).
4. [OpenFeature becomes a CNCF incubating project](https://www.cncf.io/blog/2023/12/19/openfeature-becomes-a-cncf-incubating-project/) (CNCF blog, 2023-12-19).
5. [OpenFeature official site](https://openfeature.dev/) (concepts, provider model).
6. [flagd Quick start](https://flagd.dev/quick-start/) (minimal startup and evaluation).
7. [Flagsmith Submits OpenFeature as CNCF Sandbox Project](https://www.flagsmith.com/blog/flagsmith-submit-openfeature-to-cncf) (origin).
8. [SiliconANGLE: CNCF names OpenFeature an incubating project](https://siliconangle.com/2023/12/19/cncf-names-openfeature-incubating-project-helping-standardize-feature-flags-software-development/).
9. [SD Times: OpenFeature becomes a CNCF incubating project](https://sdtimes.com/feature-flags/openfeature-feature-flagging-api-becomes-a-cncf-incubating-project/).
10. [open-feature/community](https://github.com/open-feature/community) (governance).
11. [GitHub API for open-feature/flagd](https://api.github.com/repos/open-feature/flagd) (stars, forks, license, created date).
12. [flagd README and docs](https://github.com/open-feature/flagd/blob/main/README.md) (architecture, sync sources, OFREP).

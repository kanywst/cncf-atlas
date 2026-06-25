# Buildpacks

> Turn application source code into production-ready OCI images without writing a Dockerfile.

- **Category**: App Definition & GitOps
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [buildpacks/pack](https://github.com/buildpacks/pack)
- **Documented at commit**: `2df3b8c` (v0.40.7)

## What it is

Cloud Native Buildpacks (CNB) is a specification and a set of tools that transform source code into a runnable OCI container image. You point a CLI at an application directory, and it detects the language, fetches dependencies, and produces an image, with no Dockerfile involved.

The ecosystem has three layers. The `pack` CLI in this repository is a developer-facing platform implementation. It does not build images itself. It starts a builder image and the `lifecycle` binaries as containers and drives the detect, analyze, restore, build, and export phases. The actual build logic lives in language-specific buildpacks, and the reference build engine lives in a separate repository, `buildpacks/lifecycle`.

CNB exists to unify a buildpack ecosystem that had fragmented across Heroku, Cloud Foundry, Google App Engine, and others. The standard defines a vendor-neutral platform-to-buildpack contract on top of the OCI image format, so the same buildpack runs anywhere and a base image can be swapped through layer rebase.

## When to use it

- You want repeatable container images from source without maintaining a Dockerfile per service.
- You operate many services in several languages and want one builder to cover them.
- You need to patch the OS layer across a fleet by rebasing the run image instead of rebuilding every app.
- It is a weaker fit when you need fine-grained control of every image layer, in which case a hand-written Dockerfile with BuildKit is more direct.
- It is a weaker fit for a single-language shop already served by a focused tool such as Jib (JVM) or ko (Go).

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how a build flows.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [TOC Approves Cloud Native Buildpacks from Sandbox to Incubation (CNCF)](https://www.cncf.io/blog/2020/11/18/toc-approves-cloud-native-buildpacks-from-sandbox-to-incubation/)
2. [Cloud Native Buildpacks site](https://buildpacks.io/)
3. [Buildpacks Go Cloud Native, Turning Source Code into Docker Images (Heroku)](https://www.heroku.com/blog/buildpacks-go-cloud-native/)
4. [Standardizing Heroku Buildpacks with CNCF (Salesforce Engineering)](https://engineering.salesforce.com/standardizing-heroku-buildpacks-with-cncf-a43525f6c441/)
5. [Planting New Platform Roots in Cloud Native with Fir (Heroku)](https://www.heroku.com/blog/planting-new-platform-roots-cloud-native-fir/)
6. [How Maintaining Cloud Native Buildpacks Powers Platforms Like Heroku](https://www.heroku.com/blog/how-maintaining-cloud-native-buildpacks-powers-platforms-like-heroku/)
7. [App Platform Buildpack References (DigitalOcean)](https://docs.digitalocean.com/products/app-platform/reference/buildpacks/)
8. [Getting Started / How to Use Paketo Builders (Paketo Buildpacks)](https://paketo.io/docs/howto/builders/)
9. [buildpacks/pack repository](https://github.com/buildpacks/pack)
10. [buildpacks/lifecycle repository](https://github.com/buildpacks/lifecycle)
11. [buildpacks/spec repository](https://github.com/buildpacks/spec)
12. [Basic App tutorial (buildpacks.io docs)](https://buildpacks.io/docs/for-app-developers/tutorials/basic-app/)
13. [buildpacks/rfcs repository](https://github.com/buildpacks/rfcs)

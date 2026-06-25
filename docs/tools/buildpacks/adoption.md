# Adoption & Ecosystem

## Who uses it

Each organisation below is cited. Adopters without a public source are omitted.

| Organisation | Use case | Source |
| --- | --- | --- |
| Heroku (Salesforce) | Next-generation "Fir" platform adopts CNB by default for all apps; Heroku funds a dedicated maintainer team. | [Heroku Fir](https://www.heroku.com/blog/planting-new-platform-roots-cloud-native-fir/) |
| DigitalOcean | App Platform builds with CNB when no Dockerfile is present, detecting the language and building with buildpacks. | [DigitalOcean docs](https://docs.digitalocean.com/products/app-platform/reference/buildpacks/) |
| Greenhouse, Salesforce, VMware | Named as production users at the time of CNCF Incubation. | [CNCF](https://www.cncf.io/blog/2020/11/18/toc-approves-cloud-native-buildpacks-from-sandbox-to-incubation/) |

## Adoption signals

Measured on `buildpacks/pack` via the GitHub API on 2026-06-24.

- Stars: 2,939
- Forks: 345
- Open issues: 169
- Contributors: about 164 (including anonymous)
- Repository created: 2018-06-25

The CNCF Incubation approval (2020-11-18) cited more than fifteen production users and committers from multiple organisations.

## Ecosystem

- Reference projects: `buildpacks/lifecycle` (build engine), `buildpacks/spec` (Buildpack, Platform, Distribution, and Image Extension APIs), and `buildpacks/rfcs` (design process).
- Buildpack providers: Paketo Buildpacks, Heroku CNB, and Google Cloud buildpacks. Builders and stacks ship as images such as `paketobuildpacks/builder-jammy-base`.
- Kubernetes integration: kpack drives the CNB lifecycle through CRDs; there are Tekton (`buildpacks/tekton-integration`) and GitHub Actions (`buildpacks/github-actions`) integrations.
- Platform integration: Heroku Fir, DigitalOcean App Platform, and Google Cloud.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Dockerfile + BuildKit | Most general, but you write base-image patching, layer optimisation, and SBOM yourself. CNB has buildpacks do detection and dependency resolution, and can swap the base via rebase with no Dockerfile. |
| Google Jib | JVM-only and needs no Docker daemon. CNB is multi-language over a shared builder and stack contract. |
| ko | Go-only, very fast. CNB is language-agnostic. |
| kaniko | Builds a Dockerfile in-cluster without a daemon. CNB writes no Dockerfile; image extension uses kaniko internally as a separate concern. |
| OpenShift Source-to-Image | Similar source-to-image idea, but Red Hat and OpenShift oriented. CNB is broader on OCI standards, rebase, and a distributed buildpack ecosystem. |
| nixpacks (Railway) | Similar auto-detect UX but Nix-based and not the CNB specification. |

The core distinction is a vendor-neutral platform-to-buildpack contract plus OCI layer rebase: an OS patch lands across every app by rebasing the run image, and one builder handles many languages without a Dockerfile.

## Sources

1. [TOC Approves Cloud Native Buildpacks from Sandbox to Incubation (CNCF)](https://www.cncf.io/blog/2020/11/18/toc-approves-cloud-native-buildpacks-from-sandbox-to-incubation/)
2. [Planting New Platform Roots in Cloud Native with Fir (Heroku)](https://www.heroku.com/blog/planting-new-platform-roots-cloud-native-fir/)
3. [How Maintaining Cloud Native Buildpacks Powers Platforms Like Heroku](https://www.heroku.com/blog/how-maintaining-cloud-native-buildpacks-powers-platforms-like-heroku/)
4. [App Platform Buildpack References (DigitalOcean)](https://docs.digitalocean.com/products/app-platform/reference/buildpacks/)
5. [Getting Started / How to Use Paketo Builders (Paketo Buildpacks)](https://paketo.io/docs/howto/builders/)
6. [buildpacks/pack repository](https://github.com/buildpacks/pack)

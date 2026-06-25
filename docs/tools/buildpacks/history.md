# History

## Origin

Buildpacks began at Heroku in 2011 as the mechanism behind its platform: detect an application's language, fetch its dependencies, and build a runnable artifact, all without a Dockerfile. In 2012 Heroku open-sourced the Buildpack API and stripped out its Heroku-specific pieces, which let other platforms adopt the idea. Cloud Foundry and Pivotal, Google App Engine, GitLab, Deis, and Dokku each grew their own variants. The API forked, and the same language buildpack had to be maintained separately for every platform.

Cloud Native Buildpacks (CNB) was launched in January 2018 as a joint effort by Pivotal and Heroku to re-unify that fragmented ecosystem with a single platform-to-buildpack contract. Unlike the older v2 buildpacks, CNB was built on modern container standards: the OCI image format, cross-repository blob mounts in registries, and layer rebase.

## Timeline

| Year | Milestone |
| --- | --- |
| 2011 | Heroku invents buildpacks for its PaaS: language auto-detection plus build, no Dockerfile. |
| 2012 | Heroku open-sources the Buildpack API; other platforms fork it, and the ecosystem fragments. |
| 2018-01 | Pivotal and Heroku launch the Cloud Native Buildpacks project to re-unify the contract on OCI. |
| 2018-10 | CNB is accepted into the CNCF Sandbox under Apache-2.0. |
| 2020-11 | The CNCF TOC approves promotion from Sandbox to Incubation. |
| 2024-2025 | Heroku adopts CNB across its next-generation "Fir" platform. |

## How it evolved

The defining choice of CNB over the original Heroku buildpacks was to target OCI. Images are assembled as OCI layers, the run image can be swapped under an app through rebase, and registries can move shared blobs with cross-repo mounts. This is what made buildpacks portable across platforms rather than tied to one PaaS.

Governance moved with the technology. When the CNCF TOC approved Incubation on 2020-11-18, it cited more than fifteen production users, committers from multiple organizations, and an established open governance model. Design changes now run through a public RFC process in the `buildpacks/rfcs` repository.

## Where it stands now

CNB remains at CNCF Incubating maturity and has not graduated. The `pack` CLI is the primary platform implementation, with `buildpacks/lifecycle` as the reference build engine and `buildpacks/spec` as the contract. Recent direction is anchored by Heroku's "Fir" generation, which adopts CNB by default for all apps while the older Cedar generation keeps classic buildpacks.

## Sources

1. [TOC Approves Cloud Native Buildpacks from Sandbox to Incubation (CNCF)](https://www.cncf.io/blog/2020/11/18/toc-approves-cloud-native-buildpacks-from-sandbox-to-incubation/)
2. [Buildpacks Go Cloud Native, Turning Source Code into Docker Images (Heroku)](https://www.heroku.com/blog/buildpacks-go-cloud-native/)
3. [Standardizing Heroku Buildpacks with CNCF (Salesforce Engineering)](https://engineering.salesforce.com/standardizing-heroku-buildpacks-with-cncf-a43525f6c441/)
4. [Planting New Platform Roots in Cloud Native with Fir (Heroku)](https://www.heroku.com/blog/planting-new-platform-roots-cloud-native-fir/)
5. [How Maintaining Cloud Native Buildpacks Powers Platforms Like Heroku](https://www.heroku.com/blog/how-maintaining-cloud-native-buildpacks-powers-platforms-like-heroku/)
6. [buildpacks/rfcs repository](https://github.com/buildpacks/rfcs)

# History

## Origin

The project traces back to Notary, which Docker started in 2015 and later donated to CNCF. That first generation, also shipped as Docker Content Trust (DCT), was built on The Update Framework (TUF) as a separate server and client. It did not implement the current Notary Project specifications ([source 3](https://notaryproject.dev/docs/faq/), [source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)).

The successor effort, originally called "Notary v2", began in December 2019 as a multi-vendor working group with Docker, Microsoft, Google, and Amazon. It set out to fix concrete limitations of the TUF-based v1: signatures were not portable between registries, only one signature per image was supported, and OCI artifacts other than container images could not be signed ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | Docker starts Notary; later donated to CNCF as Notary v1 / Docker Content Trust ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)) |
| 2017 | Notary Project accepted into CNCF as Incubating ([source 2](https://www.cncf.io/projects/notary-project/)) |
| 2019 | "Notary v2" multi-vendor working group founded ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)) |
| 2021 | Alpha of the new design ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)) |
| 2023 | Major release; the name becomes "Notary Project" and the tool "Notation" ([source 5](https://notaryproject.dev/blog/2023/announcing-major-release/)) |
| 2025 | Second security audit completed ([source 2](https://www.cncf.io/projects/notary-project/)) |

## How it evolved

The most consequential shift was abandoning the TUF server model for storing signatures as OCI Referrers in the registry itself. This is what makes a signature portable across registries and what allows multiple signatures per artifact ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)). The "Notary v2" label was retired with the 2023 major release; the umbrella is now "Notary Project" and the CLI is "Notation" ([source 5](https://notaryproject.dev/blog/2023/announcing-major-release/)).

The deprecation of Docker Content Trust has pushed adoption of the new design. Azure Container Registry began deprecating DCT on 2025-03-31, with full removal planned for 2028-03-31, and points users to Notary Project signing as the replacement ([source 6](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-content-trust-deprecation)).

## Where it stands now

The latest stable release is `v1.3.2` (2025-04-27); the `main` branch carries `v2.0.0-alpha.1` development (`internal/version/version.go:18`). The module path is `github.com/notaryproject/notation/v2`. Governance runs through the published Notary Project GOVERNANCE document, the CNCF Slack `#notary-project` channel, and regular community meetings ([source 11](https://github.com/notaryproject/.github/blob/main/GOVERNANCE.md), [source 1](https://github.com/notaryproject/notation)). A second security audit was completed in 2025 ([source 2](https://www.cncf.io/projects/notary-project/)).

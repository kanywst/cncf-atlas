# Adoption & Ecosystem

## Who uses it

Distribution has no `ADOPTERS.md`. The citable evidence for who runs it is its own README and the Docker donation announcement, so the table records what those two sources actually claim, not inferred per-company internals. The README states that Distribution is a core library for the registry operators below (README), and the donation blog names the operators that supplied maintainers when Docker gave the project to the CNCF (Docker blog).

| Organisation | Relationship (per cited source) | Source |
| --- | --- | --- |
| Docker (Docker Hub) | Original author; README lists Docker Hub as a registry operator built on the code | [README](https://github.com/distribution/distribution/blob/main/README.md), [Docker blog](https://www.docker.com/blog/donating-docker-distribution-to-the-cncf/) |
| GitHub (Container Registry) | README lists GitHub Container Registry as a core-library consumer; GitHub supplied a maintainer at donation | [README](https://github.com/distribution/distribution/blob/main/README.md), [Docker blog](https://www.docker.com/blog/donating-docker-distribution-to-the-cncf/) |
| GitLab (Container Registry) | README lists GitLab Container Registry as a core-library consumer; GitLab supplied a maintainer at donation | [README](https://github.com/distribution/distribution/blob/main/README.md), [Docker blog](https://www.docker.com/blog/donating-docker-distribution-to-the-cncf/) |
| DigitalOcean (Container Registry) | README lists DigitalOcean Container Registry as a core-library consumer; supplied a maintainer at donation | [README](https://github.com/distribution/distribution/blob/main/README.md), [Docker blog](https://www.docker.com/blog/donating-docker-distribution-to-the-cncf/) |
| CNCF Harbor / VMware Harbor Registry | README lists Harbor as built on the code; Harbor supplied a maintainer at donation | [README](https://github.com/distribution/distribution/blob/main/README.md), [goharbor/harbor](https://github.com/goharbor/harbor) |

A caveat worth stating plainly: the README and the 2021 donation post are the basis for these relationships. Whether each operator's current production registry is still Distribution-derived is not something this deep-dive confirmed against a primary source from that company, so the table stops at what the two cited documents say.

## Adoption signals

As of 2026-07-08, the GitHub repository shows 10,503 stars and 2,756 forks, created 2014-12-22, with the latest release `v3.1.1` dated 2026-05-01 (GitHub repository). The clearest signal is not the star count but the donation itself: Docker gave the project to the CNCF specifically because it was already the shared base for many large registries, and recruited maintainers from those operators (Docker blog). The project runs the OCI Distribution Specification conformance suite in CI, which is a signal about protocol correctness rather than popularity (README).

## Ecosystem

Distribution is the base layer, and the ecosystem is mostly things built on top of or beside it. **Harbor** (CNCF Graduated) uses Distribution as its registry core and adds RBAC, vulnerability scanning, signing, and replication around it (goharbor/harbor). The **OCI Distribution Specification** is the standard that this project's API became, so any conformant client works against it and any conformant registry speaks the same protocol (OCI Distribution Specification). On the storage side, the in-tree drivers (`filesystem`, `s3-aws`, `gcs`, `azure`, `inmemory`) connect it to the common object stores, so the ecosystem below it is whatever backend an operator already runs.

## Alternatives

Picking a registry usually means picking how much sits on top of the storage core. Distribution is the thin, spec-conformant base; the alternatives bundle more.

| Alternative | Differs by |
| --- | --- |
| Harbor | Built on Distribution but ships RBAC, Trivy scanning, signing, and replication; pick it when you need a full enterprise registry rather than a bare core (goharbor/harbor) |
| Zot | A separate OCI-native registry implementation, conformant with the same OCI Distribution Specification; a different codebase rather than a layer on this one |
| Quay | Red Hat's independent registry with integrated Clair scanning; a product, not a library to build on |
| Managed registries (ECR, Google Artifact Registry, Azure Container Registry, GitHub Container Registry) | Hosted services; you consume the OCI/Docker V2 API instead of running the server, so clients stay compatible but you give up self-hosting |

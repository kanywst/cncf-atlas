# Adoption & Ecosystem

## Who uses it

Meshery's `ADOPTERS.md` lists 18 organisations at the documented commit. Each entry is a company name and a link, with no description of how it uses Meshery, so the use case column reads "Not stated" for every row.

| Organisation | Use case | Source |
| --- | --- | --- |
| Asteria Aerospace | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| AYA Innovation Labs | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| BootLabs | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| DigitalOcean | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Ericsson | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| F5 | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| HPE Labs (Cloudless) | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| HPE Security Engineering | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Infor | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Intel | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Intraserve Systems | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Metabit Trading | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Metabob | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| OD10 Ventures | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| PITS Global Data Recovery Services | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| Red Hat | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| SolarWinds | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |
| TCS Labs | Not stated | [ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md) |

The CNCF incubation announcement says Meshery is used by organisations in aerospace, telecommunications, networking and enterprise software, without naming them ([CNCF blog](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/)). During the incubation review in January 2025, a TOC reviewer noted that adopters had not yet been submitted for interview ([cncf/toc#1386](https://github.com/cncf/toc/issues/1386)). Public material on how these organisations run Meshery is thin.

The v1.0 announcement quotes individuals, for example a tech lead at Stripe, but does not say their employers use Meshery, so they are not listed here ([Meshery blog](https://meshery.io/blog/meshery-v1.0-general-availability/)).

## Adoption signals

- **GitHub**: 12,203 stars and 4,187 forks on 2026-11-15 ([GitHub API](https://api.github.com/repos/meshery/meshery)). The CNCF announcement gives higher figures ("almost 15,000" stars, "over 6,800" forks), which do not match the API on that date.
- **Contributors and velocity**: the CNCF counts more than 7,000 contributors from about 1,000 organisations, and ranks Meshery fifth by velocity among nearly 250 CNCF projects for July 2025 to July 2026, with commits up 350% over that year ([CNCF blog](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/)). Live numbers are on [DevStats](https://meshery.devstats.cncf.io/).
- **Releases**: more than 800 GitHub releases from `v0.0.1` (2019) to `v1.0.79` (2026-11-13), published by hand from a continuously updated draft ([releases](https://github.com/meshery/meshery/releases)).
- **Maintainers**: the core maintainer list names people from Layer5, Moneris, Intuit, USyd, OD10 and independents ([MAINTAINERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/MAINTAINERS.md)).

## Ecosystem

- **meshery/meshkit, meshery/meshsync, meshery/schemas**: the shared Go library, the discovery component, and the OpenAPI schemas that generate Go and TypeScript types for both the server and the UI. The server pins `meshkit v1.0.29`, `meshsync v1.0.3` and `schemas v1.3.116` (`go.mod` at the documented commit, [AGENTS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/AGENTS.md)).
- **meshery-extensions**: the second GitHub organisation, holding the community's integrations, adapters and tooling ([Meshery blog](https://meshery.io/blog/meshery-v1.0-general-availability/)).
- **Kanvas**: a visual designer delivered as a Meshery extension; Kanvas Designer was announced as generally available with v1.0 ([Meshery blog](https://meshery.io/blog/meshery-v1.0-general-availability/)).
- **Service Mesh Performance (SMP)**: the benchmarking specification Layer5 donated to the CNCF alongside Meshery ([Layer5 news](https://layer5.io/company/news/cncf-adopts-meshery-to-advance-service-mesh-management/)). Meshery's load tests run on fortio (`server/handlers/load_test_handler.go:138-139`).
- **Model sources**: many bundled models are generated from Helm charts listed on Artifact Hub; the Istio model, for example, records Artifact Hub as its registrant (`models/istio-base/1.16.0/v1.0.0/components/VirtualService.json`).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| [Argo CD](https://argo-cd.readthedocs.io/) / [Flux](https://fluxcd.io/) | Git is the source of truth and a controller in the cluster pulls and reconciles continuously. Meshery Server pushes a design once per request. |
| [Crossplane](https://www.crossplane.io/) | Extends the Kubernetes API with its own resource types and reconciles them from inside the cluster. Meshery is an external client of the Kubernetes API. |
| [Headlamp](https://headlamp.dev/) / [Kubernetes Dashboard](https://github.com/kubernetes/dashboard) | Browse and edit live cluster objects. Meshery adds designs, relationship evaluation, multi-cluster deploys and a registry of resource types. |
| [Kiali](https://kiali.io/) | Observability console for Istio only. Meshery started with mesh management too, but works across meshes and other infrastructure. |

Pick Meshery when you want one tool to design, review and deploy infrastructure across clusters and keep an inventory of what is there. Pick a GitOps tool when you need Git history as the audit trail and automatic drift correction.

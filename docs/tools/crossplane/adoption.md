# Adoption & Ecosystem

## Who uses it

The following organisations are listed in the project's [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md), each with a stated use case.

| Organisation | Use case | Source |
| --- | --- | --- |
| Nike | Internal developer platform managing thousands of resources from dev to production | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| Nokia | Multi-cloud orchestration for production deployment of network services | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| SAP | 100+ KRM control planes and thousands of managed resources (as of 2024-02); also contributes providers | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| IBM | Provider for IBM Cloud and a service mapping framework | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| Grafana Labs | Control plane for an internal developer platform | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| Elastic | Deploying resources across clouds for Elastic Serverless | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| NASA Science Cloud (SMCE) | Deploying Open Science Studio (JupyterHub-based) through compositions | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| Deutsche Kreditbank (DKB) | 10+ EKS clusters and thousands of resources | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| DB Systel (Deutsche Bahn) | Backbone of a Developer Experience Platform integrated with Backstage | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |

## Adoption signals

At graduation the CNCF reported, across the whole crossplane org, 3,000+ contributors and 450+ organisations, a ranking of #13 by PR author count among the 231 CNCF projects (top 10%), and 70+ public adopters ([graduation announcement](https://www.cncf.io/announcements/2025/11/06/cloud-native-computing-foundation-announces-graduation-of-crossplane/)).

For the `crossplane/crossplane` repository alone, the GitHub API on 2026-06-22 reported 11,787 stars, 1,201 forks, and 190 open issues ([GitHub API](https://api.github.com/repos/crossplane/crossplane)). Contributors to this single repository number around 276 by API paging; the 3,000 figure covers the whole org.

## Ecosystem

- **Providers** install managed resource types. AWS, Azure, and GCP providers are generated from Terraform providers with Upjet; many more come from the community.
- **Composition functions** add composition logic in different languages: KCL, Python, Go, go-templating, and patch-and-transform among them. `function-kro` brings kro's YAML+CEL into a Crossplane pipeline ([function-kro blog](https://blog.crossplane.io/function-kro-yaml-cel/)).
- **Package registry** `xpkg.crossplane.io` distributes packages, established as part of graduation.
- **CLI** includes `crossplane render` (`cmd/crossplane/render/render.go`) to preview a pipeline locally before applying it.

## Alternatives

Crossplane reconciles continuously and so corrects drift automatically, keeps state as CRDs in etcd rather than in a separate state file with locks, and lets teams define their own APIs through XRDs and Compositions for safe developer self-service. The cost is that Kubernetes knowledge is a prerequisite ([platformengineering.org comparison](https://platformengineering.org/blog/terraform-vs-pulumi-vs-crossplane-iac-tool)).

| Alternative | Differs by |
| --- | --- |
| Terraform / OpenTofu | CLI `apply` with HCL and a managed state file; the largest provider ecosystem. Complementary: many Crossplane providers are generated from Terraform providers via Upjet |
| Pulumi | IaC in general-purpose languages (Python, TypeScript) via CLI or Automation API; does not require Kubernetes ([Pulumi comparison](https://www.pulumi.com/docs/iac/comparisons/crossplane/)) |
| Kro / Argo / Kustomize / Helm | Application-definition tools; `function-kro` lets kro definitions run inside a Crossplane pipeline ([function-kro blog](https://blog.crossplane.io/function-kro-yaml-cel/)) |

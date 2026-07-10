# History

## Origin

The project traces back to Kubernetes External Secrets (KES), built at GoDaddy. GoDaddy ran EKS with AWS Secrets Manager but had no standard way to pull those secrets into the cluster, so teams each wrote their own glue. KES solved that by adding an `ExternalSecret` custom resource that declaratively injected external secrets into pods, and GoDaddy open-sourced it ([GoDaddy engineering](https://www.godaddy.com/resources/news/kubernetes-external-secrets), [Container Solutions](https://blog.container-solutions.com/the-birth-of-the-external-secrets-community)). KES was written in JavaScript.

Several projects were solving the same problem in parallel. To consolidate them, the code moved from GoDaddy into a company-neutral `external-secrets` GitHub organization, and multiple people and organizations joined to build a single External Secrets solution on top of the existing work (`README.md`, [Container Solutions](https://blog.container-solutions.com/the-birth-of-the-external-secrets-community)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2020 | `external-secrets/external-secrets` repository created (2020-11-17); the Go rewrite that becomes External Secrets Operator begins |
| 2022 | Accepted into the CNCF Sandbox (2022-07-26), sponsored through TAG Security |
| 2026 | Active on `go 1.26.4`; chart release `helm-chart-2.7.0` (2026-06-26); documented commit `e100613` sits just after it |

## How it evolved

The decisive shift was rewriting KES from JavaScript into Go as the External Secrets Operator (ESO). The maintainers cited Kubernetes' first-class Go SDK support and the operator best practices that Kubebuilder and the Operator SDK encode. The first prereleases shipped with three backends (AWS Secrets Manager, AWS Parameter Store, and HashiCorp Vault) and the external-secrets.io documentation site, with contributions from Moritz Johner, Kellin McAvoy, Jonatas Baldin, Markus Maga, and Silas Boyd-Wickizer among others. The original JavaScript KES was deprecated ([Container Solutions](https://blog.container-solutions.com/the-birth-of-the-external-secrets-community)).

The rewrite also changed the object model. KES packed everything into one `ExternalSecret`, mixing "which secret to use in an app" with "how to authenticate to a backend." ESO split those into `SecretStore` / `ClusterSecretStore` for the connection and authentication and `ExternalSecret` for what to sync and where. That split is what lets one store definition back many `ExternalSecret` objects (`apis/externalsecrets/v1/secretstore_types.go`, [Container Solutions](https://blog.container-solutions.com/the-birth-of-the-external-secrets-community)).

## Where it stands now

ESO is a CNCF Sandbox project (accepted 2022-07-26), governed under the neutral `external-secrets` organization. Releases are cut as Helm chart tags; the operator version follows the chart, with `helm-chart-2.7.0` published 2026-06-26 and the documented commit `e100613` just after it (`git describe` reports `helm-chart-2.7.0-38-ge100613`). The codebase has grown to 41 providers and 17 generators in-tree. An incubation application has been raised, and the CNCF TOC has an open health review ([TOC #1819](https://github.com/cncf/toc/issues/1819)); as of this writing the CNCF project page still lists the project at Sandbox ([CNCF project page](https://www.cncf.io/projects/external-secrets/)).

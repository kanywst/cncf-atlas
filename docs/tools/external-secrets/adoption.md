# Adoption & Ecosystem

## Who uses it

The organizations below are listed in the project's [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) (accessed 2026-07-09). This deep-dive lists only what that file cites and does not add others. GoDaddy appears separately as the origin of the predecessor project (KES), documented on its engineering blog.

| Organisation | Use case | Source |
| --- | --- | --- |
| GoDaddy | Built and open-sourced KES, the predecessor to ESO | [GoDaddy engineering](https://www.godaddy.com/resources/news/kubernetes-external-secrets) |
| Mercedes-Benz Tech Innovation | Listed adopter | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |
| SAP | Listed adopter | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |
| Cisco | Listed adopter | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |
| Grafana Labs | Listed adopter | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |
| Red Hat OpenShift | Listed adopter | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |
| Amadeus, Codefresh, Container Solutions, Criteo, Elastic, Epidemic Sound, Fivetran, Form3, GoTo, Hostinger, Mixpanel, OVHcloud, Radio France, Roche, VMware Tanzu | Listed adopters | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |

## Adoption signals

As of 2026-07-09 (GitHub API): 6,730 stars and 1,357 forks, with the repository created on 2020-11-17. The project is a CNCF Sandbox project (accepted 2022-07-26) and carries CII Best Practices and OpenSSF Scorecard badges in its README (`README.md`). Releases are cut as Helm chart tags; the latest at the documented commit is `helm-chart-2.7.0` (2026-06-26). The CNCF TOC has an open health review of the project ([TOC #1819](https://github.com/cncf/toc/issues/1819)); that is a governance status, not an adoption signal, and is noted here only for completeness.

## Ecosystem

ESO sits between an external secret manager and the cluster. In-tree it ships 41 providers under `providers/v1/`, covering AWS Secrets Manager and Parameter Store, HashiCorp Vault and OpenBao, GCP Secret Manager, Azure Key Vault, IBM Cloud, Akeyless, CyberArk Conjur, 1Password, Doppler, Bitwarden, Pulumi ESC, and more. It is commonly paired with GitOps tools such as Argo CD and Flux: the `ExternalSecret` and `SecretStore` resources are committed to Git while the actual value stays in the backend. `ClusterExternalSecret` fans a secret out across namespaces, and `PushSecret` writes cluster secrets back to a provider.

## Alternatives

ESO's distinction is that it is multi-backend and always materializes a native Kubernetes `Secret`, so existing workloads consume secrets unchanged.

| Alternative | Differs by |
| --- | --- |
| HashiCorp Vault Secrets Operator (VSO) | HashiCorp's own operator, Vault-only, strong on dynamic secrets and lease renewal via its own CRDs; ESO is multi-backend across 41 providers |
| Secrets Store CSI Driver | Mounts secret values into pods via a CSI volume without creating a Kubernetes Secret (optional sync exists); ESO always creates a Secret, which suits GitOps and unchanged workloads but does put material in etcd |
| Sealed Secrets | Encrypts a Secret so it can be committed to Git, with no external store; ESO keeps the value in an external backend and commits only the reference |

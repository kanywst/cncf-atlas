# Adoption & Ecosystem

## Who uses it

The repository's `ADOPTERS.md` lists production adopters. The table below is a sample of named organizations from that file with the use case each one reports (source: <https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md>).

| Organisation | Use case | Source |
| --- | --- | --- |
| Outshift (by Cisco) | Provisions and configures Vault on Kubernetes and injects secrets into applications. | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |
| Thought Machine | Provisions Vault for its cloud native core banking engine (also called Vault). | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |
| Postman | Manages High Availability (HA) Vault services inside Kubernetes. | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |
| Vonage | Uses AWS KMS, S3, and DynamoDB; provides secrets to cloud and on-premise workloads, with a planned move to the raft backend. | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |
| Wildlife Studios | Runs the Vault Secrets Webhook on more than a dozen clusters with vault-env and vault-agent. | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |
| SHE BASH LLC | Delivers Vault secret storage for Kubernetes environments in the Department of Defense. | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |

The full file also lists Aspect, Mintel, PhishLabs, PITS Global Data Recovery Services, Pulselive, Samarkand Global, Tinkoff, TripleLift, Vase.ai, and ViaBill.

## Adoption signals

Measured from the GitHub REST API on 2026-06-26: 2,257 stars, 485 forks, 13 open issues, and 213 contributor entries (245 including anonymous contributors). The repository was created on 2018-03-07 and last pushed on 2026-06-22. Governance is documented in `MAINTAINERS.md`, which lists 7 active maintainers plus 3 alumni; the maintainers are spread across several organizations rather than a single vendor (source: <https://github.com/bank-vaults/bank-vaults/blob/main/MAINTAINERS.md>).

## Ecosystem

Bank-Vaults sits on top of HashiCorp Vault and does not depend on other CNCF projects (source: <https://github.com/cncf/sandbox/issues/54>). The umbrella adds the [Vault Operator](https://github.com/bank-vaults/vault-operator) for CRD-driven Vault provisioning, the [Secrets Webhook](https://github.com/bank-vaults/secrets-webhook) for injecting secrets into Pods, and the [Vault SDK](https://github.com/bank-vaults/vault-sdk) the CLI imports. On the integration side, the CLI's `--mode` constants cover AWS KMS plus S3, Google Cloud KMS plus GCS, Azure Key Vault, Alibaba KMS plus OSS, Oracle KMS, a remote Vault, Kubernetes Secrets, HSM, and local files (`cmd/bank-vaults/main.go:39`). It also exposes Prometheus metrics through `cmd/bank-vaults/metrics.go` and supports Velero-based backup.

## Alternatives

The closest neighbours differ in where the secret lands and how much of Vault's lifecycle the tool owns.

| Alternative | Differs by |
| --- | --- |
| External Secrets Operator (ESO) | Syncs an external secret store into Kubernetes Secret objects; the Bank-Vaults webhook instead injects secrets straight into Pod memory and skips the Kubernetes Secret (source: <https://bank-vaults.dev/docs/mutating-webhook/>). |
| HashiCorp Vault Agent Injector / Vault Secrets Operator | HashiCorp's own Pod injection and sync mechanisms; Bank-Vaults has a wider scope that also covers Vault provisioning and unseal automation (comparison: <https://bank-vaults.dev/docs/mutating-webhook/webhooks-comparision/>). |

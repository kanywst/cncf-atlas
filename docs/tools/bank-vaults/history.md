# History

## Origin

Bank-Vaults started at Banzai Cloud. The team ran Kubernetes platforms (Pipeline and Hollowtrees) that all used HashiCorp Vault, and the Vault setup logic kept being copied between them. They pulled that logic into a standalone project so the init, unseal, and configuration code lived in one place. The Vault Operator blog post describes this origin and the unseal-with-KMS flow that became the project's signature feature (source: <https://outshift.cisco.com/blog/vault-operator/>).

The name is a surfing pun, stated in the project README. "Bank Vaults" is a surf break in the Mentawai Islands, and the README leans on the bank-vault metaphor of heavy steel doors, secret unlocking combinations, and burly guards to describe secret management.

The repository was created on 2018-03-07 on GitHub under `banzaicloud/bank-vaults`. The copyright headers on the source files begin with "Copyright © 2018 Banzai Cloud" (for example `internal/vault/operator_client.go:1`), and the `NOTICE` file carries both that line and "Copyright © 2021 Cisco Systems, Inc. and/or its affiliates" (`NOTICE:1-2`).

## Timeline

| Year | Milestone |
| --- | --- |
| 2018 | Repository created under `banzaicloud/bank-vaults` on 2018-03-07; first copyright year on the sources. |
| 2021 | Cisco acquires Banzai Cloud; second copyright holder added to `NOTICE`. |
| 2023 | CNCF Sandbox application filed as cncf/sandbox#54, sponsored by Cisco. |
| 2024 | Accepted into the CNCF Sandbox (acceptance date 2024-06-18). |
| 2026 | Release v1.33.1 published (2026-05-25). |

## How it evolved

The project moved organizations twice. After Cisco acquired Banzai Cloud, maintenance passed to Outshift by Cisco, and the repository and docs moved from the `banzaicloud` namespace and `banzaicloud.com` to `bank-vaults/bank-vaults` and `bank-vaults.dev` (source: <https://bank-vaults.dev/>; former repository: <https://github.com/banzaicloud/bank-vaults>).

It also split into an umbrella project. What began as one repository was broken into separate repositories for the CLI, the Vault Operator, the Secrets Webhook (formerly `vault-secrets-webhook`), and the Vault SDK. The CLI in this repository now imports the SDK as an external module rather than carrying its own Vault client (`cmd/bank-vaults/unseal.go:24`).

The CNCF Sandbox path is recorded in cncf/sandbox#54: the application was opened on 2023-08-04 by sagikazarmark with Cisco as sponsor, and the issue was closed after the Sandbox vote passed (source: <https://github.com/cncf/sandbox/issues/54>). CNCF lists the official acceptance date as 2024-06-18 (source: <https://www.cncf.io/projects/bank-vaults/>).

## Where it stands now

The most recent release is v1.33.1 from 2026-05-25 (source: <https://github.com/bank-vaults/bank-vaults/releases>). The project is governed under the CNCF Sandbox with a documented maintainer set: `MAINTAINERS.md` lists 7 active maintainers plus 3 alumni, led by Mark Sagi-Kazar (sagikazarmark). Maintainers are spread across several organizations including Outshift by Cisco, with the wider umbrella continuing to develop the Operator, Webhook, and SDK as separate repositories.

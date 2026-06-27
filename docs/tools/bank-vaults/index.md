# Bank-Vaults

> Bank-Vaults automates initializing, unsealing, and configuring HashiCorp Vault, and keeps the unseal keys encrypted with a cloud Key Management Service (KMS) for Kubernetes.

- **Category**: Security & Compliance
- **CNCF maturity**: Sandbox
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [bank-vaults/bank-vaults](https://github.com/bank-vaults/bank-vaults)
- **Documented at commit**: `2248b7b` (near tag v1.33.1, 2026-06-22)

## What it is

Bank-Vaults is the Command Line Interface (CLI) at the center of an umbrella project for Cloud Native secret management. HashiCorp Vault starts up sealed, which means its encryption keys are not in memory and it serves no secrets until an operator supplies enough unseal keys. Bank-Vaults removes that manual step. It stores the unseal keys and root token encrypted with a cloud KMS, then runs as a sidecar or job that re-supplies them whenever Vault is sealed.

The CLI does three jobs against a Vault server: `init` creates the initial unseal keys and root token, `unseal` feeds keys back to a sealed Vault, and `configure` applies a declarative Vault configuration from a YAML file. Each job is built from two pieces: a key-value (KV) store that decides where the keys live, and a Vault Application Programming Interface (API) client that decides which Vault to operate on.

The repository documented here is only the CLI. The wider project also ships a [Vault Operator](https://github.com/bank-vaults/vault-operator) that provisions Vault on Kubernetes through a Custom Resource Definition (CRD), a [Secrets Webhook](https://github.com/bank-vaults/secrets-webhook) that injects secrets straight into Pod memory, and a [Vault SDK](https://github.com/bank-vaults/vault-sdk) the CLI itself imports for its Vault client.

## When to use it

- You run HashiCorp Vault on Kubernetes and want unseal to happen automatically after a Pod restart without an operator typing keys.
- You want unseal keys and the root token stored as ciphertext in object storage, encrypted by AWS KMS, Google Cloud KMS, Azure Key Vault, Alibaba KMS, Oracle KMS, or a Hardware Security Module (HSM).
- You want Vault policies, auth methods, secret engines, and audit devices defined declaratively in YAML and reconciled by a single command.
- It is not the right tool if you do not run HashiCorp Vault at all; Bank-Vaults drives Vault and does not replace it.
- It is not the right tool if you only need to sync secrets into Kubernetes Secret objects, where an External Secrets style sync is a closer fit.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. bank-vaults/bank-vaults repository: <https://github.com/bank-vaults/bank-vaults>
2. CNCF project page for Bank-Vaults: <https://www.cncf.io/projects/bank-vaults/>
3. CNCF Sandbox application issue (cncf/sandbox#54): <https://github.com/cncf/sandbox/issues/54>
4. Bank-Vaults official documentation: <https://bank-vaults.dev/>
5. Secret injection webhook documentation: <https://bank-vaults.dev/docs/mutating-webhook/>
6. Banzai Cloud and HashiCorp webhook comparison: <https://bank-vaults.dev/docs/mutating-webhook/webhooks-comparision/>
7. Former repository banzaicloud/bank-vaults: <https://github.com/banzaicloud/bank-vaults>
8. Vault Operator blog post (Outshift by Cisco): <https://outshift.cisco.com/blog/vault-operator/>
9. ADOPTERS.md: <https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md>
10. MAINTAINERS.md: <https://github.com/bank-vaults/bank-vaults/blob/main/MAINTAINERS.md>

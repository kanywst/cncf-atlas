# Getting Started

> Verified against tag v1.33.1 (commit `2248b7b`). Commands assume a Unix shell with Go and the HashiCorp Vault binary installed.

## Prerequisites

- Go 1.26 or newer (`go.mod:3` pins `go 1.26.3`).
- The HashiCorp Vault binary on your `PATH`, for the dev server.
- A checkout of the repository; the steps below run from its root.

## Install

Build the CLI from source. `make build` runs `go build -race -o build/ ./cmd/bank-vaults` (`Makefile:31`).

```bash
git clone https://github.com/bank-vaults/bank-vaults.git
cd bank-vaults
make build
```

The binary lands at `./build/bank-vaults`.

## A first working setup

This runs a dev Vault and uses `--mode file`, which stores keys in plaintext files. It is for local experimentation only; production uses a cloud KMS mode such as `aws-kms-s3`.

1. In one terminal, start a dev Vault server.

    ```bash
    vault server -dev -dev-root-token-id=root
    ```

2. In a second terminal, point the CLI at that server and initialize it in file mode.

    ```bash
    export VAULT_ADDR=http://127.0.0.1:8200
    ./build/bank-vaults init --mode file --file-path ./vault-keys
    ```

    This generates the unseal keys and root token and writes them under the `./vault-keys` prefix. The default mode is `k8s` (`cmd/bank-vaults/main.go:196`), so `--mode file` must be set explicitly when running outside a cluster.

3. Run the unseal loop against the same server.

    ```bash
    ./build/bank-vaults unseal --mode file --file-path ./vault-keys
    ```

    A dev Vault starts unsealed, so the loop logs that Vault is not sealed and waits; if you run a non-dev Vault it reads each `vault-unseal-N` key from the files and submits it.

## Verify it works

Check the seal status directly with the Vault CLI:

```bash
VAULT_ADDR=http://127.0.0.1:8200 vault status
```

`Sealed false` confirms Vault is unsealed. In the Bank-Vaults logs, the line `vault is not sealed` (or `successfully unsealed vault` for a sealed instance) confirms the loop is healthy (`cmd/bank-vaults/unseal.go:163`, `cmd/bank-vaults/unseal.go:176`).

## Where to go next

For production concerns such as cloud KMS modes, HA with raft, the Vault Operator CRD, and the Secrets Webhook, see the official documentation at <https://bank-vaults.dev/>. The webhook behaviour and its comparison with HashiCorp's injector are documented at <https://bank-vaults.dev/docs/mutating-webhook/>.

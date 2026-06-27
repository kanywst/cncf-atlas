# Internals

> Read from the source at commit `2248b7b`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/bank-vaults/main.go` | Root command, all flags, and the `--mode` constants. |
| `cmd/bank-vaults/unseal.go` | The `unseal` command and its retry loop. |
| `cmd/bank-vaults/common.go` | `kvStoreForConfig`: builds a KV store per mode. |
| `internal/vault/operator_client.go` | `Vault` interface and the `vault` implementation. |
| `pkg/kv/kv.go` | The `Service` interface every backend implements. |
| `pkg/kv/awskms/awskms.go` | AWS KMS envelope backend wrapping an inner store. |

## Core data structures

The `Vault` interface lists every operation the CLI can ask for: `Init`, `RaftJoin`, `Sealed`, `Unseal`, `Leader`, and `Configure` among them (`internal/vault/operator_client.go:44`). The commands depend only on this interface.

The `vault` struct is the single implementation (`internal/vault/operator_client.go:120`). It holds the KV store, the Vault API client, the init config, the decoded external config, and a rotation cache:

```go
type vault struct {
    ctx            context.Context
    keyStore       KVService
    cl             *api.Client
    config         *Config
    externalConfig *externalConfig
    rotateCache    map[string]bool
}
```

`New` is the only constructor, and it rejects a threshold larger than the share count before returning the value (`internal/vault/operator_client.go:130`):

```go
func New(ctx context.Context, k KVService, cl *api.Client, config Config) (Vault, error) {
    if config.SecretShares < config.SecretThreshold {
        return nil, errors.Errorf("the secret threshold can't be bigger than the shares [%d < %d]", config.SecretShares, config.SecretThreshold)
    }
```

`Config` carries the Shamir split parameters and root-token policy: `SecretShares`, `SecretThreshold`, `InitRootToken`, `StoreRootToken`, and `PreFlightChecks` (`internal/vault/operator_client.go:61`). `externalConfig` is the mapstructure target for the `configure` YAML, with fields for `Audit`, `Auth`, `Groups`, `Plugins`, `Policies`, `Secrets`, `StartupSecrets`, and `PurgeUnmanagedConfig` (`internal/vault/operator_client.go:89`).

Every KV backend implements the same two-method contract (`pkg/kv/kv.go:53`):

```go
type Service interface {
    Set(ctx context.Context, key string, value []byte) error
    Get(ctx context.Context, key string) ([]byte, error)
}
```

The comment above it states that implementations may or may not guarantee consistency or security properties (`pkg/kv/kv.go:51`).

## A path worth tracing

`(*vault).Unseal` is the project's signature operation (`internal/vault/operator_client.go:197`). It loops over key identifiers, pulls each from the KV store, and submits it to Vault until Vault reports unsealed:

```go
func (v *vault) Unseal(ctx context.Context) error {
    defer runtime.GC()
    for i := 0; ; i++ {
        slog.Debug("retrieving key from kms service...")
        k, err := v.keyStore.Get(ctx, keyUnsealForID(i))
        if err != nil {
            return errors.Wrapf(err, "unable to get key '%s'", keyUnsealForID(i))
        }

        slog.Debug("sending unseal request to vault...")
        resp, err := v.cl.Sys().Unseal(string(k))
```

`keyUnsealForID` builds the identifier as `vault-unseal-` plus the index (`internal/vault/operator_client.go:687`). The loop returns success once `resp.Sealed` is false (`internal/vault/operator_client.go:213`), and returns an error if `resp.Progress == 0`, which means the submitted key was rejected (`internal/vault/operator_client.go:218`).

The key never travels in plaintext at rest. When the KV store is the AWS KMS backend, `Get` reads ciphertext from the inner store (S3) and decrypts it (`pkg/kv/awskms/awskms.go:86`):

```go
func (a *awsKMS) Get(ctx context.Context, key string) ([]byte, error) {
    cipherText, err := a.store.Get(ctx, key)
    if err != nil {
        return nil, errors.WrapIf(err, "failed to get data for KMS client")
    }

    return a.decrypt(cipherText)
}
```

`decrypt` calls the KMS `Decrypt` API with the configured encryption context and trims the plaintext (`pkg/kv/awskms/awskms.go:72`). The write side mirrors it: `Set` encrypts with `encrypt` then stores the ciphertext (`pkg/kv/awskms/awskms.go:109`, `pkg/kv/awskms/awskms.go:95`).

## Things that surprised me

`Unseal` starts with `defer runtime.GC()` (`internal/vault/operator_client.go:198`). The decrypted key bytes are sensitive, so the function forces a garbage collection on the way out to clear them from memory sooner.

Root-token-less operation is a real path. When `StoreRootToken` is false, `Configure` runs the Vault generate-root flow each time instead of reading a stored token (`internal/vault/operator_client.go:462`). It pulls unseal or recovery keys, drives `GenerateRootUpdate`, and reconstructs the token by combining the encoded result with the One-Time Password (OTP) through an XOR (`internal/vault/operator_client.go:499`). Afterwards three deferred statements clear the token, reset the client token, and force a garbage collection (`internal/vault/operator_client.go:560`):

```go
// Clear the token and GC it
defer runtime.GC()
defer v.cl.SetToken("")
defer func() { rootToken = nil }()
```

The decoder safety valve is deliberate. `Configure` sets `ErrorUnused: true` so an unknown YAML key fails the decode (`internal/vault/operator_client.go:574`), and the comment right above explains why: with purge enabled, a typo in a config key could otherwise lead to deletion in Vault (`internal/vault/operator_client.go:572`).

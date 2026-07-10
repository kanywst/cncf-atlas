# Internals

> Read from the source at commit `e100613`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `apis/externalsecrets/{v1,v1beta1,v1alpha1}` | CRD types; `v1` is current. `SecretStoreProvider` is the discriminator union over all backends |
| `apis/generators/v1alpha1` | Generator types (`ClusterGenerator` umbrella and `GeneratorSpec` union) |
| `apis/meta/v1` | Shared selectors such as `SecretKeySelector` and `ServiceAccountSelector` |
| `pkg/controllers/externalsecret/` | The main reconcile loop and provider fetch |
| `pkg/controllers/secretstore/` | Store validation and the client manager |
| `pkg/controllers/{pushsecret,clusterexternalsecret,clusterpushsecret,generatorstate,webhookconfig}/` | The other reconcilers |
| `pkg/register/*.go` | Build-tagged provider/generator registration (one file per backend) |
| `providers/v1/*/` | Provider implementations, each its own Go module |
| `runtime/` | Cross-cutting helpers: `esutils` (resolvers, CA fetch, key validation), `cache`, `statemanager`, `feature`, `decoding` |

## Core data structures

`Provider` (`apis/externalsecrets/v1/provider.go:53`) is the factory interface: `NewClient`, `ValidateStore`, and `Capabilities`. It turns a store config into a `SecretsClient`.

`SecretsClient` (`apis/externalsecrets/v1/provider.go:73`) is the per-backend contract, with eight methods: `GetSecret`, `PushSecret`, `DeleteSecret`, `SecretExists`, `Validate`, `GetSecretMap`, `GetAllSecrets`, and `Close`. Read-only providers still implement `PushSecret` and `DeleteSecret`; the convention is to return a sentinel error rather than `nil` so the caller can tell "not supported" from "succeeded."

`NoSecretErr = NoSecretError{}` (`apis/externalsecrets/v1/provider.go:103`) is the sentinel a provider returns when a secret is absent. The interface comment states that when `GetSecret` returns this error, the corresponding entry is removed according to the `deletionPolicy`. The whole deletion behavior hangs off this one value.

`builder map[string]Provider` (`apis/externalsecrets/v1/provider_schema.go:26`) is the global registry from provider name to implementation. `Register` refuses a duplicate name (`provider_schema.go:44`), and `init()` functions under `pkg/register/` populate it at startup, gated by build tags.

## A path worth tracing

The interesting piece is how a store config resolves to a concrete backend, because ESO does it by JSON shape rather than a type field. `GetProvider` (`apis/externalsecrets/v1/provider_schema.go:75`) calls `getProviderName`, which marshals the `SecretStoreProvider` union to JSON, unmarshals into a map, and requires exactly one key:

```text
GetProvider(store)
  getProviderName(spec)
    json.Marshal(spec) -> map
    len(map) != 1  -> error "must only have exactly one backend specified"
    return the single key           // e.g. "aws", "vault", "gcpsm"
  builder[name]  -> the registered Provider
```

That code is `provider_schema.go:104-124`: a store with two provider blocks set, or none, fails here rather than in a provider. From there the client manager takes over. `Manager.GetFromStore` (`pkg/controllers/secretstore/client_manager.go:84`) calls `GetProvider` (`:85`), reuses a cached client if one exists for the same store (`getStoredClient`, `:147`), or builds one with `storeProvider.NewClient(...)` (`:98`).

The simplest provider to read as the reference shape is fake. `GetSecret` looks up `p.config[mapKey(ref.Key, ref.Version)]` and returns `NoSecretErr` if absent (`providers/v1/fake/fake.go:180`), extracts a JSON path with `gjson` when `ref.Property` is set, and otherwise returns the raw value. `GetSecretMap` (`providers/v1/fake/fake.go:198`) unmarshals the `GetSecret` result as JSON into key/value pairs. Every provider follows the same "fetch one value, then optionally expand it as JSON" pattern.

## Things that surprised me

The backend is identified by counting JSON keys. Instead of a discriminator field, `getProviderName` marshals the provider union and asserts `len(storeMap) != 1` is an error (`provider_schema.go:116-118`). The structure of the config is the type tag.

Existence checks use a partial cache, not the full one. When `--enable-managed-secrets-caching` is on, the full cache only holds Secrets with the `managed` label, so it cannot answer "does this Secret exist yet." ESO reads a `metav1.PartialObjectMetadata` from a separate partial cache for that check, and a comment in the controller spells out the race this avoids (`pkg/controllers/externalsecret/externalsecret_controller.go:301-309`).

Provider clients outlive individual calls on purpose. The `secretstore.Manager` keeps clients open for the whole reconcile and closes them together at the end, because some providers (GCP) cannot cheaply recreate a client per call (`pkg/controllers/externalsecret/externalsecret_controller_secret.go:49-52`).

The finalizer is added with Patch, not Update. Using Update would make the controller a co-owner of spec fields like `refreshInterval`; a Patch adds only the finalizer without claiming the rest of the spec (`pkg/controllers/externalsecret/externalsecret_controller.go:231-234`).

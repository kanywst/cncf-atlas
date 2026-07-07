# Internals

> Read from the source at commit `f5c408d`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/cozystack-api/` | Entry point for the aggregated apiserver (`main.go:27`). |
| `pkg/cmd/server/` | Server options and startup: reads `ApplicationDefinition` CRDs and builds the runtime `ResourceConfig`. |
| `pkg/apiserver/` | Wires the generic apiserver and registers one REST storage per kind (`apiserver.go:229`). |
| `pkg/registry/apps/application/` | The single generic REST storage shared by every Application kind, plus the Application-to-HelmRelease conversion. |
| `pkg/apis/apps/v1alpha1/` | The `Application` Go type and its API registration. |
| `pkg/config/` | The flattened runtime config types (`Resource`, `ApplicationConfig`, `ReleaseConfig`). |
| `api/v1alpha1/` | The `ApplicationDefinition` CRD types that define kinds. |
| `packages/apps/` | Tenant-facing Helm charts (one per kind). |
| `packages/system/`, `packages/core/` | System components and platform bootstrap charts. |

## Core data structures

`Application` (`pkg/apis/apps/v1alpha1/types.go:75`) is the single Go type that represents every tenant-facing kind. Its body is opaque: the spec is `Spec *apiextensionsv1.JSON` (`pkg/apis/apps/v1alpha1/types.go:81`). There is no `PostgresSpec` or `KubernetesSpec` in Go. Per-kind schema lives outside the type, as an OpenAPI schema string carried in config.

`REST` (`pkg/registry/apps/application/rest.go:89`) is the one storage type shared by all kinds. A single value holds the `gvr`, `gvk`, `kindName`, `releaseConfig`, and `specSchema`, and it implements Getter, Lister, Creater, Updater, Watcher, and Patcher itself. Two `Postgres` and `Kafka` endpoints are the same Go type with different config.

`config.Resource`, `ApplicationConfig`, and `ReleaseConfig` (`pkg/config/config.go:126`, `:132`, `:141`) are the flattened runtime form of one `ApplicationDefinition`: the mapping from a kind to its chart, prefix, labels, and HelmRelease generation parameters.

`ApplicationDefinition` (`api/v1alpha1/applicationdefinitions_types.go`) is the CRD that declares a kind. It carries the `OpenAPISchema` string (`:69`), the `Plural` name (`:71`), and a `Release` block (`:52`) with the chart reference, prefix, and labels. These resources are the configuration source that turns into `config.Resource` at startup.

The persisted object is not a Cozystack type at all. It is Flux's `helmv2.HelmRelease` (from `github.com/fluxcd/helm-controller/api/v2`). Cozystack has no store of its own; the `HelmRelease` is the record.

## A path worth tracing

Two things happen: kinds are registered at startup, then each create is converted.

At startup, `pkg/apiserver/apiserver.go:229` loops over the resolved resources and registers a REST storage per kind:

```go
appsV1alpha1Storage := map[string]rest.Storage{}
for _, resConfig := range c.ResourceConfig.Resources {
    storage := applicationstorage.NewREST(cli, watchCli, &resConfig)
    appsV1alpha1Storage[resConfig.Application.Plural] = cozyregistry.RESTInPeace(storage)
}
```

`c.ResourceConfig.Resources` is built earlier by reading the `ApplicationDefinition` CRDs and flattening each into a `config.Resource`. `NewREST` (`pkg/registry/apps/application/rest.go:130`) turns the definition's `OpenAPISchema` string into a structural schema for defaulting, but the Go type is the same generic `REST` for every kind.

On a create, `REST.Create` (`pkg/registry/apps/application/rest.go:166`) validates the name, rejects reserved `_`-prefixed keys with `validateNoInternalKeys`, and then runs the admission chain by hand, because a custom REST handler does not get it wired automatically the way `genericregistry.Store` does (`pkg/registry/apps/application/rest.go:210`). The conversion is the core. `convertApplicationToHelmRelease` builds a `HelmRelease` whose values are the Application spec verbatim:

```go
ValuesFrom: []helmv2.ValuesReference{
    {
        Kind: "Secret",
        Name: "cozystack-values",
    },
},
Values: app.Spec,
```

That `Values: app.Spec` line (`pkg/registry/apps/application/rest.go:1605`) is the whole trick: the tenant's opaque spec JSON becomes the chart's Helm values. The release is named `Prefix + app.Name` (`pkg/registry/apps/application/rest.go:1570`), points at a fixed `ChartRef` for the kind, and always mounts `Secret/cozystack-values` for platform-wide values. Only then is the `HelmRelease` created in the cluster (`pkg/registry/apps/application/rest.go:238`), and the created object is converted back to an `Application` for the response (`pkg/registry/apps/application/rest.go:245`).

## Things that surprised me

Adding a managed service touches no Go code. Because kinds come from `ApplicationDefinition` resources read at startup (`pkg/apiserver/apiserver.go:229`) and every kind is handled by one generic `REST` over an opaque JSON spec (`pkg/apis/apps/v1alpha1/types.go:80`), a new database is a Helm chart in `packages/apps/` plus a `-rd` chart that ships its definition. The binary is unchanged.

Per-kind timing lives in annotations, not code. Install and upgrade timeouts, retry intervals, and wait disablement are read from the `ApplicationDefinition` at conversion time (`pkg/registry/apps/application/rest.go:1553`). The `Kubernetes` kind carries a longer install timeout because Kamaji's admin-kubeconfig secret is generated asynchronously and can be slow to appear, so the value is tuned per kind rather than hard-coded globally.

Tenant kinds validate more than their own name. For a `Tenant`, `Create` also checks that the computed workload namespace fits in the DNS-1123 label limit, because a deeply nested tenant forms its namespace from the whole ancestor chain and can overflow the limit even when its own name is valid (`pkg/registry/apps/application/rest.go:189`).

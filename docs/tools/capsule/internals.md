# Internals

> Read from the source at commit `8d89d68`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/controller/main.go` | Entry point; builds the Manager and registers controllers and webhooks (`cmd/controller/main.go:115`) |
| `api/v1beta1`, `api/v1beta2` | CRD type definitions; v1beta2 is the storage version (`api/v1beta2/tenant_types.go:141`) |
| `internal/controllers/tenant` | Tenant reconciler that syncs policy onto member namespaces |
| `internal/webhook/namespace` | Mutating and validating admission handlers for namespaces |
| `pkg/tenant` | Owner and ownership resolution, including `IsTenantOwnerReference` |
| `pkg/runtime/indexers/namespace` | Field index that maps namespaces back to their owning tenant |

## Core data structures

`TenantSpec` (`api/v1beta2/tenant_types.go:21`) is the desired state of a tenant. It holds `Owners` (`api/v1beta2/tenant_types.go:40`), `NamespaceOptions` which carries the namespace quota (`api/v1beta2/tenant_types.go:42`), and `ForceTenantPrefix` (`api/v1beta2/tenant_types.go:91`), along with allowed lists for storage, priority, and runtime classes and additional role bindings.

`Tenant` (`api/v1beta2/tenant_types.go:152`) is the schema for the API: cluster-scoped, short name `tnt`, and the storage version. Its kubectl print columns expose the namespace quota, the namespace count, and the Ready condition (`api/v1beta2/tenant_types.go:144-150`).

`TenantStatus` (`api/v1beta2/tenant_status.go:24`) is the observed state. `State` is one of Active, Cordoned, or Terminating (`api/v1beta2/tenant_status.go:38`). The older `Namespaces []string` field is deprecated (`api/v1beta2/tenant_status.go:42`) and superseded by `Spaces []*TenantStatusNamespaceItem` (`api/v1beta2/tenant_status.go:44`).

`CapsuleConfigurationSpec` (`api/v1beta2/capsuleconfiguration_types.go:16`) is the cluster-wide configuration, and `ResourcePoolSpec` (`api/v1beta2/resourcepool_types.go:14`) defines a shared `corev1.ResourceQuotaSpec` distributed across selected namespaces through claims.

## A path worth tracing

The ownership lookup is the hinge the whole controller turns on. When the tenant reconciler needs the namespaces that belong to a tenant, it does not match a label. It lists namespaces through a field index. The index key is a single constant:

```go
const (
    OwnerReferenceIndex string = ".metadata.ownerReferences[*].capsule"
)
```

That constant is defined at `pkg/runtime/indexers/namespace/const.go:7`. The indexer function walks each namespace's owner references and keeps the names of those that are tenant references (`pkg/runtime/indexers/namespace/namespaces.go:25-42`):

```go
for _, or := range ns.OwnerReferences {
    if tenant.IsTenantOwnerReference(or) {
        res = append(res, or.Name)
    }
}
```

`IsTenantOwnerReference` (`pkg/tenant/owner_reference.go:18`) accepts a reference only when both the kind and the API group match, so an unrelated owner reference cannot be mistaken for tenant membership:

```go
func IsTenantOwnerReference(or metav1.OwnerReference) bool {
    if or.Kind != ObjectReferenceTenantKind {
        return false
    }

    if or.APIVersion == "" {
        return false
    }

    parts := strings.Split(or.APIVersion, "/")
    if len(parts) != 2 {
        return false
    }

    group := parts[0]

    return group == capsulev1beta2.GroupVersion.Group && or.Kind == ObjectReferenceTenantKind
}
```

On reconcile, `reconcileActiveTenantNamespaces` (`internal/controllers/tenant/namespaces.go:153`) lists members with `client.MatchingFields{".metadata.ownerReferences[*].capsule": tnt.GetName()}` (`internal/controllers/tenant/namespaces.go:159`), reconciles them in an `errgroup` capped at 8 in parallel (`internal/controllers/tenant/namespaces.go:168-169`), and finishes by calling `tnt.AssignNamespaces(list.Items)` to set status (`internal/controllers/tenant/namespaces.go:232`). Each member runs through `reconcileNamespace` (`internal/controllers/tenant/namespaces.go:237`) and `reconcileNamespaceMetadata` (`internal/controllers/tenant/namespaces.go:370`).

## Things that surprised me

The quota check has a deliberate hole, and the source explains why. `quotaHandler.handle` (`internal/webhook/namespace/validation/quota.go:71`) calls `tnt.IsFull()` (`internal/webhook/namespace/validation/quota.go:79`), but if the namespace already exists it returns nil rather than denying (`internal/webhook/namespace/validation/quota.go:84-86`). The comment there states the reason: a re-apply of an existing namespace should get the Kubernetes `AlreadyExists` error, which is closer to the native experience than a Capsule quota error.

`IsFull` itself reads the deprecated status field, not the new one. It compares `len(in.Status.Namespaces)` against the quota and returns false when no quota is set (`api/v1beta2/tenant_func.go:41`):

```go
func (in *Tenant) IsFull() bool {
    // we don't have limits on assigned Namespaces
    if in.Spec.NamespaceOptions == nil || in.Spec.NamespaceOptions.Quota == nil {
        return false
    }

    return len(in.Status.Namespaces) >= int(*in.Spec.NamespaceOptions.Quota)
}
```

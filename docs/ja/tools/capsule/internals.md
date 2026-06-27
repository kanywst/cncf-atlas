# 内部実装

> コミット `8d89d68` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/controller/main.go` | エントリポイント。Manager を構築しコントローラと webhook を登録する (`cmd/controller/main.go:115`) |
| `api/v1beta1`, `api/v1beta2` | CRD の型定義。v1beta2 が storage version (`api/v1beta2/tenant_types.go:141`) |
| `internal/controllers/tenant` | テナントのポリシーをメンバー Namespace に同期する reconciler |
| `internal/webhook/namespace` | Namespace 向けの mutating / validating admission ハンドラ |
| `pkg/tenant` | オーナーと所有権の解決。`IsTenantOwnerReference` を含む |
| `pkg/runtime/indexers/namespace` | Namespace を所属テナントへ逆引きするフィールドインデックス |

## 中核データ構造

`TenantSpec` (`api/v1beta2/tenant_types.go:21`) はテナントの desired state である。`Owners` (`api/v1beta2/tenant_types.go:40`)、Namespace quota を持つ `NamespaceOptions` (`api/v1beta2/tenant_types.go:42`)、`ForceTenantPrefix` (`api/v1beta2/tenant_types.go:91`) に加え、storage / priority / runtime class の許可リストや追加の RoleBinding を保持する。

`Tenant` (`api/v1beta2/tenant_types.go:152`) は API のスキーマで、クラスタスコープ、短縮名 `tnt`、storage version である。kubectl の print column に Namespace quota・Namespace count・Ready condition を出す (`api/v1beta2/tenant_types.go:144-150`)。

`TenantStatus` (`api/v1beta2/tenant_status.go:24`) は観測状態である。`State` は Active / Cordoned / Terminating のいずれか (`api/v1beta2/tenant_status.go:38`)。古い `Namespaces []string` は Deprecated とされ (`api/v1beta2/tenant_status.go:42`)、`Spaces []*TenantStatusNamespaceItem` に置き換えられた (`api/v1beta2/tenant_status.go:44`)。

`CapsuleConfigurationSpec` (`api/v1beta2/capsuleconfiguration_types.go:16`) はクラスタ全体設定、`ResourcePoolSpec` (`api/v1beta2/resourcepool_types.go:14`) は選択した Namespace 群に claim 経由で配分する共有 `corev1.ResourceQuotaSpec` を定義する。

## 追う価値のあるパス

所有権の逆引きはコントローラ全体が回転する蝶番である。テナント reconciler が所属 Namespace を必要とするとき、ラベルでマッチするのではなく、フィールドインデックスで Namespace を列挙する。インデックスキーは単一の定数である。

```go
const (
    OwnerReferenceIndex string = ".metadata.ownerReferences[*].capsule"
)
```

この定数は `pkg/runtime/indexers/namespace/const.go:7` で定義される。インデクサ関数は各 Namespace の OwnerReference を走査し、テナント参照のものだけ名前を拾う (`pkg/runtime/indexers/namespace/namespaces.go:25-42`)。

```go
for _, or := range ns.OwnerReferences {
    if tenant.IsTenantOwnerReference(or) {
        res = append(res, or.Name)
    }
}
```

`IsTenantOwnerReference` (`pkg/tenant/owner_reference.go:18`) は Kind と API グループの両方が一致したときだけ参照を採用するため、無関係な OwnerReference をテナント所属と取り違えない。

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

reconcile 時、`reconcileActiveTenantNamespaces` (`internal/controllers/tenant/namespaces.go:153`) は `client.MatchingFields{".metadata.ownerReferences[*].capsule": tnt.GetName()}` でメンバーを列挙し (`internal/controllers/tenant/namespaces.go:159`)、`errgroup` で並列上限 8 として reconcile し (`internal/controllers/tenant/namespaces.go:168-169`)、最後に `tnt.AssignNamespaces(list.Items)` で status を確定する (`internal/controllers/tenant/namespaces.go:232`)。各メンバーは `reconcileNamespace` (`internal/controllers/tenant/namespaces.go:237`) と `reconcileNamespaceMetadata` (`internal/controllers/tenant/namespaces.go:370`) を通る。

## 読んで驚いた点

quota チェックには意図的な穴があり、ソースがその理由を説明している。`quotaHandler.handle` (`internal/webhook/namespace/validation/quota.go:71`) は `tnt.IsFull()` (`internal/webhook/namespace/validation/quota.go:79`) を呼ぶが、Namespace が既に存在する場合は deny せず nil を返す (`internal/webhook/namespace/validation/quota.go:84-86`)。そこのコメントに理由がある。既存 Namespace の再適用には Kubernetes の `AlreadyExists` エラーを返す方が、Capsule の quota エラーより native な体験に近い、というものだ。

`IsFull` 自体は新しい status フィールドではなく Deprecated なフィールドを読む。`len(in.Status.Namespaces)` を quota と比較し、quota 未設定なら false を返す (`api/v1beta2/tenant_func.go:41`)。

```go
func (in *Tenant) IsFull() bool {
    // we don't have limits on assigned Namespaces
    if in.Spec.NamespaceOptions == nil || in.Spec.NamespaceOptions.Quota == nil {
        return false
    }

    return len(in.Status.Namespaces) >= int(*in.Spec.NamespaceOptions.Quota)
}
```

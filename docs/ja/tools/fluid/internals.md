# 内部実装

> コミット `25531595` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/` | バイナリごとの `main`。`dataset`・エンジン別ランタイムコントローラ・`csi`・`webhook`・`fluidapp`。 |
| `api/v1alpha1/` | CRD 型。`Dataset`・各 `Runtime`・データ操作 CRD。 |
| `pkg/ddc/base/` | エンジン抽象。`Engine`・`Implement`・`TemplateEngine`。 |
| `pkg/ddc/alluxio`, `pkg/ddc/juicefs`, `pkg/ddc/jindocache` | 具体的なエンジン実装。 |
| `pkg/ddc/factory.go` | ランタイム種別からエンジン実装を選ぶ。 |
| `pkg/controllers/` | 共通 reconcile コア (`runtime_controller.go`) とエンジン別コントローラ。 |
| `pkg/ctrl/` | master・worker・fuse・affinity 用ヘルパ。 |
| `pkg/csi/plugins/` | キャッシュを Pod にマウントする CSI node server。 |
| `pkg/utils/helm/` | `ddc-helm` バイナリを exec するラッパー。 |
| `charts/` | エンジン別の同梱 Helm chart。 |

## 中核データ構造

- `Dataset` (`api/v1alpha1/dataset_types.go:301`) と `DatasetSpec`・`DatasetStatus`。spec は `Mounts`・ノードアフィニティ・ランタイム参照を持ち、status は `phase`・`cacheStates`・`OperationRef` マップを持つ。`OperationRef` は同一データセットで同種のデータ操作が同時に走らないようにする排他ロックとして使われる。
- `DatasetPhase` 定数 (`api/v1alpha1/dataset_types.go:36`): `Bound`・`Failed`・`NotBound`・`Updating`・`DataMigrating`、加えて空と pending。reconcile ループが駆動する状態機械である。
- `Mount` (`api/v1alpha1/dataset_types.go:80`): 単一の under-file-system マウント点。options と、資格情報を Secret 参照で渡す `EncryptOptions` を持つ。
- `base.Engine` と `base.Implement` (`pkg/ddc/base/engine.go:32` と `:69`): 粗いエンジン API と、`TemplateEngine` が呼ぶ細粒度ステップ。エンジン追加は `Implement` を満たすこと。
- `cruntime.ReconcileRequestContext` (`pkg/runtime/context.go:31`): reconcile 1 回分を単一構造体に束ねたもの。`context.Context`・`NamespacedName`・`Category`・`*Dataset`・`client.Client` を embed し、1 つのランタイム種別が異なるエンジン実装へ dispatch できるよう `EngineImpl` を持つ。
- `common.CacheStateList` (`pkg/common/types.go:34`): `cached`・`cacheCapacity`・`cachedPercentage`・`cacheHitRatio` を文字列で持つ `map[CacheStateName]string`。データセットの status に反映される。

## 追う価値のあるパス

「`AlluxioRuntime` を作り、`Bound` なデータセットと動くキャッシュを得る」を追う。

各パスで何をするかは共通コアが決める。`ReconcileRuntime` は validate を実行し、続いて setup を実行し、setup 未完なら requeue する。

```go
if !utils.IsSetupDone(ctx.Dataset) {
    ready, err := engine.Setup(ctx)
    // ...
    if !ready {
        return utils.RequeueAfterInterval(time.Duration(20 * time.Second))
    }
}
```

`TemplateEngine.Setup` (`pkg/ddc/base/setup.go:25`) がエンジンのステップを順に呼ぶ。Alluxio の master ステップは `setupMasterInternal` (`pkg/ddc/alluxio/master_internal.go:32`) に着地し、ランタイムから Helm values ファイルを生成し、リリースが存在するか確認し、無ければ install する。

```go
chartName := utils.GetChartsDirectory() + "/" + common.AlluxioChart
// ... values 生成、リリース確認 ...
return helm.InstallRelease(e.name, e.namespace, valueFileName, chartName)
```

`helm.InstallRelease` (`pkg/utils/helm/utils.go:44`) は `install` の引数列を組み立てて外部バイナリを実行し、combined output を取得して失敗時にロールバックする (`pkg/utils/helm/utils.go:82`)。worker が ready になると `BindToDataset` が `status.phase` を `Bound` にし、`engine.Sync` が定期的に `status.cacheStates` を更新する。

## 読んで驚いた点

キャッシュ基盤は Go の Kubernetes クライアントでは全く展開されない。master/worker/FUSE のトポロジ全体が Helm に委譲される。`var helmCmd = []string{"ddc-helm"}` (`pkg/utils/helm/utils.go:41`) であり、コントローラはこのバイナリを `install -f <values> --namespace <ns> <name> <chart>` で exec する (`pkg/utils/helm/utils.go:60`)。つまり典型的なオペレータに見えるものが、肝心の所では改名された Helm CLI のラッパーである。この選択はエンジンのマニフェストを chart に閉じ込め新エンジンを安くするが、実行環境が `ddc-helm` を備える必要があり、install 失敗時には Helm のテキスト出力をパースし自前のロールバックを書かねばならない。

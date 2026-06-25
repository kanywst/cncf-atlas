# 内部実装

> コミット `c7f6cde` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/operator-sdk` | バイナリのエントリポイント。`main.go` が `cli.Run()` を呼ぶ。 |
| `internal/cmd/operator-sdk/cli` | CLI 組み立て。プラグインバンドルと extra command (`cli.go:50-148`)。 |
| `internal/cmd/operator-sdk/run/bundle` | `run bundle` コマンドの定義 (`cmd.go:27-65`)。 |
| `internal/olm/operator` | 共有 kube クライアント設定 (`config.go`) と OLM の install/cleanup ロジック。 |
| `internal/olm/operator/bundle` | `run bundle` のオーケストレータ `Install` (`install.go`)。 |
| `internal/olm/operator/registry` | カタログ作成と OperatorInstaller の状態機械 (`operator_installer.go`, `index_image.go`)。 |
| `internal/plugins/helm` | in-tree の helm v1 kubebuilder プラグイン。 |

## 中核データ構造

- `Install` (`internal/olm/operator/bundle/install.go:33-40`): `run bundle` のオーケストレータ。`BundleImage` を持ち、`*registry.IndexImageCatalogCreator` と `*registry.OperatorInstaller` を埋め込んで、カタログ作成と OLM インストールを 1 つの型に合成する。
- `OperatorInstaller` (`internal/olm/operator/registry/operator_installer.go:38-49`): OLM 投入の状態。フィールドは `CatalogSourceName`・`PackageName`・`StartingCSV`・`Channel`・`InstallMode`・`CatalogCreator`・`CatalogUpdater`・`SupportedInstallModes`。
- `IndexImageCatalogCreator` (`internal/olm/operator/registry/index_image.go:93-111`): bundle を index イメージへどう注入するかを設定する (`FBCContent`・`IndexImage`・`BundleImage`・`BundleAddMode`・`SecurityContext` ほか)。`CatalogCreator` と `CatalogUpdater` の両 interface を実装する (`index_image.go:113-114`)。
- `operator.Configuration` (`internal/olm/operator/config.go:32-42`): すべての OLM コマンドが共有する kube クライアントの束。`Namespace`・`RESTConfig`・controller-runtime の `Client`・`Scheme`・`Timeout` を持つ。
- OLM CRD 型は外部の `operator-framework/api v0.34.0` (`go.mod:17`) から来る: `v1alpha1.ClusterServiceVersion`・`Subscription`・`InstallPlan`・`CatalogSource`、`v1.OperatorGroup`。SDK はこれらを生成・承認するだけで、reconcile は OLM が行う。

## 追う価値のあるパス

`operator-sdk run bundle` を setup から OLM への書き込みまで追う。`setup` が bundle をロードし package メタデータを解決した後 (`install.go:73-150`)、`OperatorInstaller.InstallOperator` がクラスタへの変更を順に実行する (`operator_installer.go:55-102`):

```text
InstallOperator (operator_installer.go:55)
  CatalogCreator.CreateCatalog       -> CatalogSource          (:56)
  ensureOperatorGroup                -> OperatorGroup          (:73)
  createSubscription                 -> Subscription (Manual)  (:79)
  waitForInstallPlan                 -> wait for InstallPlan   (:84)
  approveInstallPlan                 -> set Spec.Approved=true (:89)
  getInstalledCSV                    -> wait for CSV ready     (:94)
```

Subscription は手動承認で作られる (`operator_installer.go:281-285`):

```go
sub := newSubscription(o.StartingCSV, o.cfg.Namespace,
    withPackageChannel(o.PackageName, o.Channel, o.StartingCSV),
    withCatalogSource(csName, o.cfg.Namespace),
    withInstallPlanApproval(v1alpha1.ApprovalManual))
```

その後 CLI が conflict リトライのもとで plan を自分で承認する (`operator_installer.go:319-339`):

```go
if err := retry.RetryOnConflict(retry.DefaultBackoff, func() error {
    if err := o.cfg.Client.Get(ctx, ipKey, &ip); err != nil {
        return fmt.Errorf("error getting install plan: %v", err)
    }
    ip.Spec.Approved = true
    return o.cfg.Client.Update(ctx, &ip)
}); err != nil {
    return err
}
```

## 読んで驚いた点

`setup` 内のカタログ形式の分岐が load-bearing だ。`fbcutil.IsFBC` (`install.go:98`) が index を File-Based Catalog か SQLite かで判定する。FBC なら `generateFBCContent` で declarative config を生成し (`install.go:105-131`)、SQLite はまだ動くが移行を促す deprecation 警告を出す (`install.go:135`)。

手動承認してから自分で承認する流れが微妙な部分だ。Subscription はあえて手動 install plan 承認を要求し、その後同じ CLI 実行が生成された plan を承認する。`run bundle` が自動 subscription を作ると思っている読者は、承認が CLI がユーザーの代理で行う明示的な 2 ステップ目であることを見落とす。

コードに焼き込まれた既知の upstream ギャップもある。グローバル `--verbose` フラグは kubebuilder が CLI を組み立てた後に root コマンドへ後付けされ (`cli.go:140-148`)、`TODO(estroz): upstream PR for global --verbose` というコメントが、これが kubebuilder 未マージの変更に対するローカルパッチであることを示している。

## 出典

1. operator-framework/operator-sdk repository: <https://github.com/operator-framework/operator-sdk>
2. operator-framework/api (OLM CRD types): <https://github.com/operator-framework/api>

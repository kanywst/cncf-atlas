# 内部実装

> コミット `439d98db` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `main.go` | kruise-manager のエントリポイント。webhook を先に、次にコントローラを登録。 |
| `cmd/daemon/main.go` | kruise-daemon のエントリポイント (`NewDaemon`)。 |
| `apis/apps/{v1alpha1,v1beta1,pub,defaults}` | CRD 型、共通 in-place 型、defaults。 |
| `apis/policy` | `policy.kruise.io` の型 (PodUnavailableBudget など)。 |
| `pkg/controller/<crd>` | CRD ごとに 1 コントローラ。 |
| `pkg/util/inplaceupdate` | 共通 in-place update エンジン。 |
| `pkg/webhook/pod/mutating` | Pod mutating webhook。readiness gate 注入を含む。 |
| `pkg/daemon/{criruntime,kuberuntime,imagepuller,containermeta,containerrecreate,podprobe}` | ノードローカルなランタイム作業。 |

## 中核データ構造

- `CloneSetSpec` / `CloneSetUpdateStrategy` / `CloneSetStatus` (`apis/apps/v1beta1/cloneset_types.go:41`, `:177`, `:202`): Deployment 相当の spec に `volumeClaimTemplates`、`Recreate` / `InPlaceIfPossible` / `InPlaceOnly` の `UpdateStrategy.PodUpdatePolicy`、partition ベースのカナリアを足す。
- `UpdateSpec` (`pkg/util/inplaceupdate/inplace_update.go:86`): in-place が適用する計算済み差分。`ContainerImages map[string]string`、`ContainerResources`、`ContainerRefMetadata`、`MetaDataPatch`、`GraceSeconds`、old / new テンプレートを持つ。`VerticalUpdateOnly()` が resource のみ更新かを判定する。
- `InPlaceUpdateState` (`apis/apps/pub/inplace_update.go:52`): Pod annotation に焼き込む更新状態。`Revision`、`LastContainerStatuses` (更新前 imageID = 完了判定の基準)、`NextContainerImages` / `NextContainerResources` (launch priority 順の次バッチ)、`ContainerBatchesRecord` を記録する。完了判定は記録した `ImageID` を現在のランタイム status と突合する。
- `UpdateOptions` (`pkg/util/inplaceupdate/inplace_update.go:64`): 差し替え可能な関数群 (`CalculateSpec`, `PatchSpecToPod`, `CheckPodNeedsBeUnready`, `CheckContainersUpdateCompleted`)。CloneSet / Advanced StatefulSet / Advanced DaemonSet が 1 つのエンジンを共有しつつ、これで挙動を変える。
- `inplaceupdate.Interface` (`pkg/util/inplaceupdate/inplace_update.go:79`): `CanUpdateInPlace` / `Update` / `Refresh` の 3 メソッド。各ワークロードコントローラが保持する。

## 追う価値のあるパス

CloneSet のローリング in-place update を、reconciler から apiserver への patch まで追う。

`Reconcile` は保持した reconcile 関数に転送するだけ (`pkg/controller/cloneset/cloneset_controller.go:198-200`):

```go
func (r *ReconcileCloneSet) Reconcile(_ context.Context, request reconcile.Request) (reconcile.Result, error) {
    return r.reconcileFunc(request)
}
```

`doReconcile` は CloneSet を取得し、scale expectation を確認し、Pod / PVC を claim し、current / update の ControllerRevision を決める。revision が変わっていれば daemon が新イメージを事前 pull できるよう ImagePullJob を作る。続いて `syncCloneSet` (`cloneset_controller.go:403`) が scale、次に update を実行する。

`realControl.Update` (`pkg/controller/cloneset/sync/cloneset_update.go:47`) が更新対象を `updatePod` (`cloneset_update.go:254`) で回す。ポリシーが in-place を許し Pod が受けられるなら共通エンジンを呼ぶ (`cloneset_update.go:306`):

```go
res := c.inplaceControl.Update(pod, oldRevision, updateRevision, opts)
```

in-place 不可で `InPlaceOnly` の場合は再作成せず拒否する (`cloneset_update.go:319-320`):

```go
return 0, fmt.Errorf("find Pod %s update strategy is InPlaceOnly but can not update in-place", pod.Name)
```

エンジン内では `realControl.Update` (`pkg/util/inplaceupdate/inplace_update.go:313`) が `UpdateSpec` を計算する。差分が image (と resource) に閉じなければ spec は nil で in-place 不可。`CheckPodNeedsBeUnready` が true なら `InPlaceUpdateReady` を `ConditionFalse` にして readiness gate を倒す (conflict retry 付き)。その後 `updatePodInPlace` (`inplace_update.go:350`、定義 `:362`) を呼ぶ。

`updatePodInPlace` は conflict retry の中で最新 Pod を取り直し、revision hash を書き、`InPlaceUpdateState` を `apps.kruise.io/inplace-update-state` annotation に JSON で記録する。`grace == 0` なら `PatchSpecToPod` で spec を patch し apiserver に書き戻す:

```go
clone, expectedResources, err = opts.PatchSpecToPod(clone, spec, &inPlaceUpdateState)
```

resource 変更は `/resize` subresource への strategic merge patch として適用する (`inplace_update.go:402`):

```go
_, err := adp.PatchPodResource(cloneCopy, client.RawPatch(types.StrategicMergePatchType, patchResources))
```

`grace > 0` なら spec を `inplace-update-grace` annotation に保存し、猶予期間後に適用する (`inplace_update.go:411-413`)。kubelet がコンテナを再起動した後、`kruise-daemon` の `containermeta` が実イメージを報告し、`Refresh` が `CheckContainersUpdateCompleted` で完了と判定して readiness gate を戻す。

## 読んで驚いた点

完了判定は kubelet のコンテナ status を直接は信用しない。エンジンは更新前 imageID を `LastContainerStatuses` に記録し、ノードごとの daemon がランタイムから別の実 imageID を報告するのを待つ。ノードで `kruise-daemon` が動いていないと、そのノードの in-place update は完了確認ができない。

launch priority は 1 回の in-place update をバッチに分ける。コンテナの launch priority が異なると、エンジンは一度に全部 patch せず、残りのイメージを `NextContainerImages` に積み、各バッチを `PreCheckBeforeNext` でゲートしてから次バッチを適用する。1 つのイメージ更新が、1 つの Pod の中で順序付きの波として進みうる。

grace 期間はコントローラ側の sleep ではない。意図した spec を annotation に書いて後で適用するので、遅延はプロセスメモリではなくコントローラ再起動をまたいで生き残る。

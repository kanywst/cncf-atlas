# 内部実装

> コミット `8f6d4e1` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `controller/` | application-controller: reconcile ループ、状態比較、同期実行 |
| `reposerver/` | Git / Helm / Kustomize / OCI からのマニフェスト生成 |
| `server/` | api-server: gRPC/REST、認証、RBAC、UI 配信 |
| `gitops-engine/` | 取り込み済みの差分・同期ライブラリ。ローカル module 化 (`go.mod:374`) |
| `applicationset/` | Application をテンプレート化する ApplicationSet コントローラ |
| `pkg/apis/application/v1alpha1/` | `Application` と `AppProject` の API 型 |
| `cmd/main.go` | multi-call バイナリのエントリポイント (`cmd/main.go:1`) |

## 中核データ構造

- `Application` (`pkg/apis/application/v1alpha1/types.go:68`) はコントローラ全体が回転する対象。`Spec` は source(s)、destination、`syncPolicy` を持ち、`Status` (`pkg/apis/application/v1alpha1/types.go:1213`) は sync 状態、health、managed リソース一覧を持つ。
- `SyncPolicy` (`pkg/apis/application/v1alpha1/types.go:1518`) は auto-sync の可否と挙動をゲートする。`SyncStatus` (`pkg/apis/application/v1alpha1/types.go:1942`) は live と desired の比較結果を記録する。
- `comparisonResult` (`controller/state.go:82`) は reconcile の戻り値。`syncStatus`、`healthStatus`、`resources`、gitops-engine の `reconciliationResult`、`diffResultList`、pre/post-delete-hook フラグ、`revisionsMayHaveChanges` を束ねる。
- `CompareWith` (`controller/appcontroller.go:88`) は比較レベルの enum。`CompareWithLatestForceResolve=3`、`CompareWithLatest=2`、`CompareWithRecent=1`、`ComparisonWithNothing=0`。
- `ReconciliationResult` (`gitops-engine/pkg/sync/reconcile.go:65`) は差分計算の入力。target と live を index 対応で並べ、hooks を加える。

## 追う価値のあるパス

reconcile の判断は `processAppRefreshQueueItem` (`controller/appcontroller.go:1728`) にある。`needRefreshAppStatus` が返すレベル (`controller/appcontroller.go:1761`) で作業量が決まる。

```text
processAppRefreshQueueItem            controller/appcontroller.go:1728
  needRefreshAppStatus -> level       controller/appcontroller.go:1761
  if level == ComparisonWithNothing:  controller/appcontroller.go:1797
      キャッシュからツリー再構築; return (repo-server を叩かない)
  CompareAppState(...)                controller/appcontroller.go:1876
      GetRepoObjs (repo-server)       controller/state.go:694
      GetManagedLiveObjs (cluster)    controller/state.go:773
      argodiff.StateDiffs(...)        controller/state.go:917
  autoSync(...) if OutOfSync          controller/appcontroller.go:1908
```

先頭の短絡分岐が面白い。

```go
if comparisonLevel == ComparisonWithNothing {
    // ... キャッシュから GetAppManagedResources、ツリー再構築、永続化、return
}
```

レベルが `ComparisonWithNothing` のとき、コントローラは repo-server に一切触れない。キャッシュ済み managed resources を読み、リソースツリーを再計算し、status を永続化して return する (`controller/appcontroller.go:1797`)。フル比較はレベルが `CompareWithRecent` 以上のときだけ起き、Git 最新 revision を取りに行くのは `CompareWithLatest` のときだけである。

## 読んで驚いた点

非自明な設計は比較レベルの ladder だ。宣伝文句からは「reconcile = 毎サイクル Git とクラスタのフル diff」と思いがちだが、そうではない。repo-server のマニフェスト生成が最も高コストなので、コントローラは作業を段階化する。`ComparisonWithNothing` は repo-server を叩かずキャッシュからリソースツリーだけ再構築し (`controller/appcontroller.go:1797`)、`CompareWithRecent` は前回 synced revision を再利用し、`CompareWithLatest` で初めて Git 最新を取りに行く (`controller/appcontroller.go:88`)。数千 Application の規模では、これが repo-server の溶解を防ぐ肝になる。

コードでしか分からない点が 2 つ。1 つは一時的な Git エラーが grace-period キャッシュで吸収されること。`repoErrorGracePeriod` 内ならコントローラは `ErrCompareStateRepo` を返して前回状態を維持し、OutOfSync に倒さない (`controller/state.go:699`)。もう 1 つは live state がクラスタ単位の共有 watch キャッシュから `GetManagedLiveObjs` 経由で読まれること (`controller/state.go:773`)。よって毎回 API server に list しない。

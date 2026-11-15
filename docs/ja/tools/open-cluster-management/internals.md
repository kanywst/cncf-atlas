# 内部実装

> コミット `b4e4b23` (`b4e4b232350d6967008372423e5aa7a967d80a9f`, 2026-11-13) のソースを読んだもの。ここでの主張はすべてファイルと行を指す。`vendor/open-cluster-management.io/` 配下のパスは API 型と add-on フレームワークで、別リポジトリにあるものを `ocm` に vendor している。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/` | 6 つのバイナリ: `registration`、`work`、`placement`、`addon`、`registration-operator`、`server`。それぞれ `pkg/cmd/` の cobra サブコマンドを組み立てる。 |
| `pkg/cmd/hub`, `pkg/cmd/spoke` | 各コンポーネントの hub 側と managed cluster 側のサブコマンド。 |
| `pkg/registration/hub` | クラスタの受け入れ、クラスタごとの namespace と RBAC、lease 監視、cluster set、ClusterProfile の同期。 |
| `pkg/registration/spoke` | registration エージェント: bootstrap、ManagedCluster の作成、status、claim、lease、add-on の資格情報。 |
| `pkg/registration/register` | 1 つの interface の後ろにある資格情報ドライバ (`csr`、`token`、`aws_irsa`、`grpc`)。 |
| `pkg/work/spoke` | work エージェント: 適用、status feedback、AppliedManifestWork の記録、executor の認可。 |
| `pkg/work/hub` | ManifestWorkReplicaSet と ManifestWork のガベージコレクション。 |
| `pkg/placement` | スケジューリングコントローラと、その filter と prioritizer のプラグイン。 |
| `pkg/addon` | hub の add-on manager と、テンプレートベースの add-on エージェント。 |
| `pkg/operator` | cluster-manager と klusterlet の operator。 |
| `pkg/server` | gRPC の転送サーバと、リソースごとのサービス。 |

`pkg/` 配下のテスト以外の Go は約 44,000 行。最大は registration の約 13,400 行で、work の 9,000 行、operator の 8,000 行が続く。

## 中核データ構造

- **`ManagedCluster`** (`vendor/open-cluster-management.io/api/cluster/v1/types.go:48-76`)。cluster スコープで、managed cluster 1 つにつき 1 つ。spec には、ハンドシェイクのうち hub 管理者側を担う `HubAcceptsClient` (`:64`)、`LeaseDurationSeconds` (`:70`)、`Taints` (`:76`) がある。status には condition、capacity、version、claim が入り、エージェントが書く。
- **`ManifestWork`** (`vendor/open-cluster-management.io/api/work/v1/types.go:37-56`)。対象クラスタの namespace に置く namespaced リソース。`Workload` は生のマニフェストを持つ。`DeleteOption` は削除時に適用済みリソースをどうするか (Foreground、Orphan、SelectivelyOrphan, `types.go:401-407`) を決める。`ManifestConfigs` はリソースごとの update strategy と feedback ルール、`Executor` はエージェントが適用前に権限を確認する主体を指定する。executor がなければ、エージェントは自分の service account で適用し、確認は行わない (`pkg/work/spoke/auth/basic/auth.go:65-67`)。
- **`AppliedManifestWork`**。managed cluster 上の cluster スコープのリソースで、名前は `<hubHash>-<workName>` (`pkg/work/spoke/controllers/manifestcontroller/manifestwork_controller.go:215`)。work が適用したリソースを記録し、spec から外れたものをエージェントが消せるようにする。
- **`Placement`** (`vendor/open-cluster-management.io/api/cluster/v1beta1/types_placement.go:58-102`)。namespaced。`ClusterSets`、`NumberOfClusters`、`Predicates` (ラベル、claim、CEL のセレクタは `:213-221`)、`PrioritizerPolicy`、`SpreadPolicy` (`:93`)、`Tolerations`、結果をグループに分ける `DecisionStrategy`。
- **`ManagedClusterSet` と `ManagedClusterSetBinding`**。set はクラスタをまとめる (`vendor/open-cluster-management.io/api/cluster/v1beta2/types_managedclusterset.go:33-76`)。binding は set を 1 つの namespace から見えるようにする (`ManagedClusterSetBinding`。namespace ごとの取得は `pkg/placement/controllers/scheduling/scheduling_controller.go:227`)。Placement は自分の namespace に bind された set からしか選べない (`types_placement.go:18-26`)。

## 追う価値のあるパス

1 つの ManifestWork を work エージェントの中で追う。起点は `ManifestWorkController.sync` (`pkg/work/spoke/controllers/manifestcontroller/manifestwork_controller.go:132`)。

コントローラは、クラスタの hub namespace に絞った lister から work を読む。work が削除中、work の finalizer がない、またはすでに `Complete` condition がある場合は早期に return する (`manifestwork_controller.go:153-166`)。finalizer の確認には意味がある。後で片付けられない work のリソースには、エージェントは触らない。

次に AppliedManifestWork を作るか patch する (`manifestwork_controller.go:169`、本体は `:213-240`)。名前に hub hash (hub API サーバの URL の SHA-256, `pkg/work/helper/helpers.go:360-364`) が入るので、同じ managed cluster が複数の hub に登録しても衝突しない。

その後、2 つの reconciler を順に回す (`manifestwork_controller.go:98-110`、ループは `:178`)。1 つ目の `manifestworkReconciler.reconcile` (`manifestwork_reconciler.go:112`) が適用を担う。`parseAndSortManifests` (`:257`) が各マニフェストをデコードし、固定のランク表で stable sort する:

```go
var resourceApplyOrder = map[string]int{
    // Rank 0: cluster-scoped, no deps
    "PriorityClass":            0,
    "Namespace":                0,
    "CustomResourceDefinition": 0,
```

この表は `manifestwork_reconciler.go:56` から始まる。namespace と CRD がランク 0、RBAC が 1、service account とポリシーが 2、設定とストレージが 3、Service が 4、ワークロードが 5、webhook と APIService が 6。表にない kind は 1000 になり、spec 上の順序を保つ (`:279-287`)。マニフェストごとに `applyOneManifest` (`:321`) が、Complete 済みのものを飛ばし、`Executor` の権限を SubjectAccessReview で確認し (`:351-358`、validator は `pkg/work/spoke/auth/basic/auth.go:62`)、update strategy に応じた applier を選んで適用する (`:363-375`)。applier は `CreateOnly`、`ServerSideApply`、`Update`、`ReadOnly` の 4 つ (`pkg/work/spoke/apply/apply.go:31-37`)。既定は `Update` (`manifestwork_reconciler.go:368`)。ループ全体は `retry.RetryOnConflict` の中で回る (`:150`)。

2 つ目の `appliedManifestWorkReconciler.reconcile` は、前回適用したリソースと今回適用したリソースを比べ、差分を削除する (`appliedmanifestwork_reconciler.go:90-99`)。ManifestWork からマニフェストを外すとクラスタからも消えるのは、この仕組みによる。

最後に両方のオブジェクトの status を patch し、ジッター付きの 4 分後に work を requeue する (`manifestwork_controller.go:40,175-208`)。リアルタイムの状態は別経路で戻る。`AvailableStatusController` が既定でおよそ 10 秒ごと (最大 90% のジッター付き) に適用済みリソースを polling し (`pkg/work/spoke/options.go:38`, `pkg/work/spoke/controllers/statuscontroller/availablestatus_controller.go:103`)、feedback ルールを評価する。Deployment、Job、Pod、DaemonSet には組み込みルールがある (`pkg/work/spoke/statusfeedback/rules/rule.go:76-79`)。

## 読んで驚いた点

**権限不足はエラー扱いしない。** executor にあるリソースの権限がない場合、エージェントはその失敗をマニフェストの condition に記録し、エラーを消して、どれかのチェックが求めた最短の再試行時間で requeue する (`manifestwork_reconciler.go:180-189`)。拒否が続くあいだ work は短い間隔で reconcile され続け、コントローラのエラー backoff には入らない。server-side apply の conflict も、再試行では解消できないのでエラー一覧から外される (`:191-195`)。

**CSR の名前検査が厳格。** `validateCSR` は、任意の共有グループを除いて organization がちょうど 1 つ `system:open-cluster-management:<cluster>` であることを要求する。さらに common name を `:` で分割してちょうど 2 要素 (クラスタとエージェント) であることを求め、クラスタ部分が CSR のクラスタラベルと一致するかを確認する (`pkg/registration/register/csr/approve_reconciler.go:133-201`)。更新時には要求者が common name に書かれたユーザーと一致することも求められる (`approve_reconciler.go:69-72`) ので、あるクラスタの証明書を持つエージェントが、別のクラスタ名の証明書へ更新することはできない。新しいクラスタ名の CSR には、引き続き hub 管理者の承認か alpha の自動承認 gate が必要。

**証明書のローテーションにジッターがある。** 残り寿命が、20% から 25% の間でランダムに選んだ閾値を下回ると、エージェントは新しい証明書を要求する (`pkg/registration/register/csr/csr.go:509-520`)。同時に参加したクラスタ群の更新がばらける。

**Placement の決定はページ分割される。** 1 つの PlacementDecision が持てるクラスタ名は最大 100。それより大きい結果は複数の PlacementDecision に分かれる (`pkg/placement/controllers/scheduling/scheduling_controller.go:49,466-474`)。1 つのオブジェクトには結果の一部しか入らないことがあるので、利用側は placement のラベル (`cluster.open-cluster-management.io/placement`, `vendor/open-cluster-management.io/api/cluster/v1beta1/types_placementdecision.go:32`) が付いた PlacementDecision をすべて読む必要がある。

**既定のスケジューリングは prioritizer 2 つだけ。** prioritizer policy を書かなければ、Balance と Steady だけが重み 1 で有効になり、ほかの prioritizer は重み 0 (`pkg/placement/controllers/scheduling/schedule.go:148-160`)。Balance は、ほかの placement の decision に現れる回数が少ないクラスタほど高い点をつける (`pkg/placement/plugins/balance/balance.go:18-22,52-68`)。Steady は、この placement がすでに選んでいるクラスタに最高点をつけ、決定が揺れないようにする (`pkg/placement/plugins/steady/steady.go:20-24`)。最終スコアは重み付き和で、同点はクラスタ名で決まる (`schedule.go:277-292`)。同じ入力からは常に同じ決定が出る。

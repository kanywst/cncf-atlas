# 内部実装

> コミット `e8b5a0c` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `src/cmd` | 4 つのバイナリ: `clusternet-agent`、`clusternet-scheduler`、`clusternet-controller-manager`、`clusternet-hub`。 |
| `src/pkg/apis` | `apps`、`clusters`、`proxies`、`shadow` グループの CRD 型定義。 |
| `src/pkg/scheduler` | クラスタ用 scheduler framework: filter / score / predict / bind プラグイン。 |
| `src/pkg/controllermanager/deployer` | Subscription を Base へ、Base を Description へ展開する。 |
| `src/pkg/agent/deployer` | Description を apply する子側 deployer (generic / helm)。 |
| `src/pkg/hub` | aggregated API server、shadow registry、proxy exchanger。 |
| `src/pkg/predictor` | クラスタの残容量を見積もる resource predictor framework。 |

## 中核データ構造

いずれも `src/pkg/apis` 配下の CRD である。

- `Subscription` と `SubscriptionSpec` (`src/pkg/apis/apps/v1alpha1/subscription.go:34`、`src/pkg/apis/apps/v1alpha1/subscription.go:43`) が配布の入力。`Subscribers` (`src/pkg/apis/apps/v1alpha1/subscription.go:92`) がクラスタを選択し、`Feeds` (`src/pkg/apis/apps/v1alpha1/subscription.go:103`) が配布対象を列挙し、`SchedulingStrategy` (`src/pkg/apis/apps/v1alpha1/subscription.go:65`) が全クラスタ複製か容量按分かを選ぶ。scheduler は出力を `Status.BindingClusters` に書く。
- `ManagedCluster`、`ManagedClusterSpec`、`ManagedClusterStatus` (`src/pkg/apis/clusters/v1beta1/types.go:354`、`src/pkg/apis/clusters/v1beta1/types.go:191`、`src/pkg/apis/clusters/v1beta1/types.go:234`) が登録済みの子 1 つを表す。Status は `NodeStatistics` (`src/pkg/apis/clusters/v1beta1/types.go:372`)、`PodStatistics` (`src/pkg/apis/clusters/v1beta1/types.go:390`)、`ResourceUsage` (`src/pkg/apis/clusters/v1beta1/types.go:400`) を持ち、heartbeat で更新され scheduler の predict 段が読む。
- `Base` と `BaseSpec` (`src/pkg/apis/apps/v1alpha1/types.go:31`、`src/pkg/apis/apps/v1alpha1/base.go:20`) がクラスタ単位の中間表現。ある子が受け取るべき Feed 集合である。
- `Description` と `DescriptionSpec` (`src/pkg/apis/apps/v1alpha1/description.go:35`、`src/pkg/apis/apps/v1alpha1/description.go:44`) がレンダリング済みのデプロイ単位。生マニフェストと deployer 種別 (Generic / Helm) を持つ。agent / hub が apply する終端オブジェクト。
- `FeedInventory` と `ReplicaRequirements` (`src/pkg/apis/apps/v1alpha1/feedinventory.go:31`、`src/pkg/apis/apps/v1alpha1/feedinventory.go:67`) が Dividing スケジューリングを支える。各 Feed が要求する CPU/メモリを記録し、predict 段が「このクラスタに何レプリカ載るか」を計算する。

補助型として `Manifest` (`src/pkg/apis/apps/v1alpha1/manifest.go:30`)、`HelmChart` / `HelmRelease` (`src/pkg/apis/apps/v1alpha1/helm.go:37`、`src/pkg/apis/apps/v1alpha1/helm.go:211`)、クラスタ単位 / フリート全体のオーバーライドである `Localization` / `Globalization` (`src/pkg/apis/apps/v1alpha1/localization.go:31`、`src/pkg/apis/apps/v1alpha1/globalization.go:32`) がある。

## 追う価値のあるパス

scheduler の決定が生成済み Description に至るまでを追う。

scheduler の Subscription ごとのループは、1 件 pop してスケジュールし非同期に bind する。`scheduleOne` は `src/pkg/scheduler/scheduler.go:287`、キューの pop は `src/pkg/scheduler/scheduler.go:288`、アルゴリズム呼び出しは `src/pkg/scheduler/scheduler.go:346`。generic アルゴリズム `Schedule` (`src/pkg/scheduler/algorithm/generic.go:70`) は filter (`src/pkg/scheduler/algorithm/generic.go:79`)、predict (`src/pkg/scheduler/algorithm/generic.go:94`)、prioritize (`src/pkg/scheduler/algorithm/generic.go:100`)、subgroup と select (`src/pkg/scheduler/algorithm/generic.go:106`、`src/pkg/scheduler/algorithm/generic.go:111`) を順に回す。

bind は Base を作らない。`DefaultBinder.Bind` (`src/pkg/scheduler/framework/plugins/defaultbinder/default_binder.go:57`) は Subscription を copy し、bind 結果を status に設定し、`status` subresource を patch する。status への書き込みは `src/pkg/scheduler/framework/plugins/defaultbinder/default_binder.go:65` から始まる。

```go
subCopy := sub.DeepCopy()
subCopy.Status.BindingClusters = targetClusters.BindingClusters
subCopy.Status.Replicas = targetClusters.Replicas
subCopy.Status.SpecHash = utils.HashSubscriptionSpec(&subCopy.Spec)
subCopy.Status.DesiredReleases = len(targetClusters.BindingClusters)
```

merge patch は `src/pkg/scheduler/framework/plugins/defaultbinder/default_binder.go:83` で `status` subresource へ送られる。次に controller manager が引き継ぐ。`populateBasesAndLocalizations` (`src/pkg/controllermanager/deployer/deployer.go:322`) が `sub.Status.BindingClusters` を `src/pkg/controllermanager/deployer/deployer.go:335` でループし、`src/pkg/controllermanager/deployer/deployer.go:357` で Base テンプレを組み、`src/pkg/controllermanager/deployer/deployer.go:450` で作成する。`handleBase` (`src/pkg/controllermanager/deployer/deployer.go:703`) が各 Base を `populateDescriptions` (`src/pkg/controllermanager/deployer/deployer.go:755`) で Description へレンダリングし、テンプレを `src/pkg/controllermanager/deployer/deployer.go:834` で組み、`src/pkg/controllermanager/deployer/deployer.go:968` で作成する。最後に agent が `src/pkg/agent/deployer/generic/generic.go:131` で apply する。

```text
scheduleOne -> Schedule -> DefaultBinder.Bind (status を patch)
  -> populateBasesAndLocalizations -> Bases.Create
  -> handleBase -> populateDescriptions -> Descriptions.Create
  -> agent handleDescription -> ApplyDescription
```

## 読んで驚いた点

shadow API は普通の `kubectl apply` を CRD に書き換える。`clusternet-hub` は登録済みリソース型に対し shadow REST ハンドラを登録する。面白いのは `REST.Create` (`src/pkg/hub/registry/shadow/template/rest.go:105`) で、投入オブジェクトは決して実体化されない。`src/pkg/hub/registry/shadow/template/rest.go:107` で dry-run 検証され、`src/pkg/hub/registry/shadow/template/rest.go:113` で `Manifest` に包まれる。

```go
manifest := &appsapi.Manifest{
    ObjectMeta: metav1.ObjectMeta{
        Name:      r.getNormalizedManifestName(result.GetNamespace(), result.GetName()),
        Namespace: r.reservedNamespace,
        Labels:    result.GetLabels(), // reuse labels from original object, which is useful for label selector
    },
    Template: runtime.RawExtension{
        Object: result,
    },
}
```

この Manifest は `src/pkg/hub/registry/shadow/template/rest.go:132` で作成される。効果として、ユーザは既存のマニフェストと `kubectl` をそのまま使い、親はそれを配布素材として保存する。

もうひとつ非自明なのが proxy 経路である。NAT やファイアウォールの内側にいる子でも到達できるのは、hub が Rancher の `remotedialer` で reverse WebSocket トンネルを保持するからである。hub は `src/pkg/hub/exchanger/exchanger.go:76` で dialer server を構築し、`src/pkg/hub/exchanger/exchanger.go:94` でクラスタごとの dialer を取得して transport の dial 経路に挿し、`src/pkg/hub/exchanger/exchanger.go:119` の `ProxyConnect` で proxy 接続を提供する。子が dial-out し、親がその接続越しにリクエストを re-dial するので、親から子へのインバウンド到達性は不要である。これが「Cluster Internet」という名前の文字どおりの由来である。

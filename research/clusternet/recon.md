# Clusternet 技術リコン

CNCF Sandbox のマルチクラスタ管理アドオン。親クラスタ (parent) ひとつから多数の子クラスタ (child) を「インターネットを見るように」操作する。リポジトリは `clusternet/clusternet`。

- リポジトリ: <https://github.com/clusternet/clusternet>
- 公式サイト: <https://clusternet.io>
- 言語: Go (`go.mod` に `module github.com/clusternet/clusternet` / `go 1.23.0`、`src/go.mod:1`, `src/go.mod:3`)
- ライセンス: Apache License 2.0 (`src/LICENSE:1`、GitHub API の `spdx_id` も `Apache-2.0`)
- pin したコミット: `e8b5a0c622e417960db3a6b9bfa057ca46488159` (2026-05-10, `main` ブランチ)
- 直近タグ: `v0.18.1` (commit `bbe50d31e489f7906dd2bcf7d57bd090c795e890`, 2025-08-13 リリース)。pin した HEAD はこのタグより先の `main`
- マルチプラットフォーム: linux/amd64, arm64, ppc64le, s390x, 386, arm (`src/README.md` 記載)

用語を先に一行ずつ定義する。

- parent cluster (親クラスタ): Clusternet のコントロールプレーン 3 種が動くクラスタ。すべての API をここに集約する。
- child cluster / ManagedCluster (子クラスタ): `clusternet-agent` が動き、親に登録される被管理クラスタ。
- CRD (Custom Resource Definition): Kubernetes の API を拡張するユーザ定義リソース型。
- CSR (CertificateSigningRequest): クライアント証明書の発行要求。子クラスタ登録の認証に使う。
- Feed: 配布対象の 1 リソース参照 (Deployment, CRD, HelmChart など)。
- Subscription: どの Feed をどのクラスタ群へどう配るかを宣言する CRD。Clusternet の入力点。

## 基本情報

- repo: `clusternet/clusternet`
- pinned commit: `e8b5a0c622e417960db3a6b9bfa057ca46488159` / 近いタグ: `v0.18.1`
- 言語 / ビルド: Go 1.23 / `make` (`src/Makefile`、`GOVERSION ?= 1.23.8` が `src/Makefile:20`)
- ライセンス: Apache-2.0 (`src/LICENSE:1`)
- CNCF 成熟度: Sandbox (2023-03-07 受理)
- カテゴリ: Orchestration & Scheduling

## 歴史の素材

- 初回リリース `v0.1.0` は 2021-06-08 (GitHub Releases API、全 28 リリース)。リポジトリ作成は 2021-06-07。
- 名前は「Cluster Internet」。多数のクラスタを「インターネットを見るように」扱うのが目標 (<https://github.com/clusternet/clusternet>, README タグライン)。
- 2023-03-07 に CNCF Sandbox 受理 (<https://www.cncf.io/projects/clusternet/>、"accepted to CNCF on March 7, 2023 at the Sandbox maturity level")。CNCF への提出 issue は <https://github.com/cncf/sandbox/issues/10>。
- `v0.15.0` 以降で `clusternet-controller-manager` が分離され、4 コンポーネント体制になった (<https://clusternet.io/docs/introduction/>)。
- 直近タグは `v0.18.1` (2025-08-13)。pin した `main` HEAD (2026-05-10) はそれより先。

## アーキテクチャの素材

`cmd/` に 4 つの実行ファイルがある (`src/cmd/`)。README/公式の 4 コンポーネントに一致する (<https://clusternet.io/docs/introduction/>)。

- `clusternet-agent` (`src/cmd/clusternet-agent`): 子クラスタ側で動く唯一の常駐。自分自身を親へ自動登録し (ClusterRegistrationRequest + CSR)、heartbeat/version/health を報告し、親へ websocket トンネルを張る。Pull モードでは親から配布された Description を子へ適用する。
- `clusternet-scheduler` (`src/cmd/clusternet-scheduler`): Subscription を入力に配布先クラスタ群を決める。Kubernetes の scheduler framework をクラスタ単位に移植した実装 (`src/pkg/scheduler/`)。
- `clusternet-controller-manager` (`src/cmd/clusternet-controller-manager`): スケジュール済み Subscription を Base / Description へ展開し、子の dedicated namespace へ配る deployer 群を持つ (`src/pkg/controllermanager/deployer/deployer.go`)。
- `clusternet-hub` (`src/cmd/clusternet-hub`): aggregated API server。shadow API、子クラスタへの proxy (`kubectl` 中継)、登録要求の承認を担う (`src/pkg/hub/`)。エントリは `src/cmd/clusternet-hub/hub.go:31` の `main()` → `app.NewClusternetHubCmd`。

`pkg/` の主要ディレクトリ。

- `pkg/apis` 全 CRD の型定義 (`apps`, `clusters`, `proxies`, `shadow`)。
- `pkg/scheduler` クラスタ用 scheduler framework (filter / score / predict / bind プラグイン)。
- `pkg/controllermanager/deployer` Subscription → Base → Description の展開ロジック。
- `pkg/agent` 子クラスタ側 deployer (generic / helm)。
- `pkg/hub` aggregated apiserver、shadow registry、proxy exchanger。
- `pkg/predictor` クラスタ残容量を予測する resource predictor framework。

### クラスタ登録と sync モード

子クラスタは 3 つの sync モードを持つ (`src/pkg/apis/clusters/v1beta1/types.go:39`)。

- `Push` (`:44`): 親の変更を hub が子へ push して適用する。
- `Pull` (`:48`): 子の agent が親を watch して自分で適用する。
- `Dual` (`:51`): 両方。

登録は agent が `ClusterRegistrationRequest` (`src/pkg/apis/clusters/v1beta1/types.go:171`) を出し、`ClusterID` (Version 4 UUID) と bootstrap token で認証、hub が承認して per-cluster の dedicated namespace を切る CSR ベースのフロー。

## 内部実装の素材

### コア動作を端から端まで追う: アプリのマルチクラスタ配布

「1 つの Subscription をクラスタ群へ配る」のが Clusternet の代表動作。CRD で言うと `Subscription → Base → Description → 実リソース`。順に追う。

1. ユーザが parent に `Subscription` を作成する。subscription controller が拾い、finalizer を注入してから外部注入された `syncHandlerFunc` に委譲する。

    - `handle` 入口: `src/pkg/controllers/apps/subscription/subscription.go:176`
    - finalizer 付与: `src/pkg/controllers/apps/subscription/subscription.go:203`
    - 委譲: `src/pkg/controllers/apps/subscription/subscription.go:230` の `c.syncHandlerFunc(sub)`

2. `clusternet-scheduler` が Subscription をスケジューリングキューから pop し 1 件ずつ処理する。Kubernetes scheduler の `scheduleOne` をクラスタ単位に移植したもの。

    - `scheduleOne`: `src/pkg/scheduler/scheduler.go:287`
    - queue pop: `src/pkg/scheduler/scheduler.go:288` の `sched.SchedulingQueue.Pop()`
    - スケジュールアルゴリズム呼び出し: `src/pkg/scheduler/scheduler.go:346` の `sched.scheduleAlgorithm.Schedule(...)`
    - reserve / permit / prebind を経て非同期 goroutine で `bind`: `src/pkg/scheduler/scheduler.go:415`

3. スケジュールアルゴリズム本体 `genericScheduler.Schedule` は Kubernetes と同じ 4 段に subgroup 段を足した構成。

    - 入口: `src/pkg/scheduler/algorithm/generic.go:70`
    - Step1 Filter (適合クラスタ抽出): `src/pkg/scheduler/algorithm/generic.go:79`
    - Step2 Predict (Dividing 時に各クラスタの収容可能レプリカ数を予測): `src/pkg/scheduler/algorithm/generic.go:94`
    - Step3 Prioritize (スコアリング): `src/pkg/scheduler/algorithm/generic.go:100`
    - Step4 Subgroup → selectClusters: `src/pkg/scheduler/algorithm/generic.go:106`, `src/pkg/scheduler/algorithm/generic.go:111`

4. `bind` は BindPlugin を回す。既定の `DefaultBinder.Bind` は計算結果を Subscription の status に書き戻すだけで、Base 生成はしない (controller-manager に渡すため疎結合)。

    - `bind`: `src/pkg/scheduler/scheduler.go:432` → `fwk.RunBindPlugins` (`:448`)
    - `DefaultBinder.Bind`: `src/pkg/scheduler/framework/plugins/defaultbinder/default_binder.go:57`
    - status へ書き戻し: `src/pkg/scheduler/framework/plugins/defaultbinder/default_binder.go:65` の `subCopy.Status.BindingClusters = targetClusters.BindingClusters`
    - merge patch を `status` subresource へ送る: `src/pkg/scheduler/framework/plugins/defaultbinder/default_binder.go:83`

   検証済みコード片 (`default_binder.go:64-68`):

    ```go
    subCopy := sub.DeepCopy()
    subCopy.Status.BindingClusters = targetClusters.BindingClusters
    subCopy.Status.Replicas = targetClusters.Replicas
    subCopy.Status.SpecHash = utils.HashSubscriptionSpec(&subCopy.Spec)
    subCopy.Status.DesiredReleases = len(targetClusters.BindingClusters)
    ```

5. `clusternet-controller-manager` の `Deployer` が `Status.BindingClusters` の変化を拾い、各 binding クラスタ (= dedicated namespace) ごとに `Base` を 1 つ生成する。

    - `handleSubscription` → `populateBasesAndLocalizations`: `src/pkg/controllermanager/deployer/deployer.go:273`, `src/pkg/controllermanager/deployer/deployer.go:322`
    - BindingClusters をループ: `src/pkg/controllermanager/deployer/deployer.go:335`
    - `Base` テンプレ生成 (Spec.Feeds = sub.Spec.Feeds): `src/pkg/controllermanager/deployer/deployer.go:357`
    - `Bases(namespace).Create`: `src/pkg/controllermanager/deployer/deployer.go:450`

6. 生成された `Base` を同じ deployer の `handleBase` が拾い、Feed の中身 (Manifest / HelmChart) を解決して `Description` を生成する。Description が「あるクラスタへ実際に適用するレンダリング済みマニフェスト束」。

    - `handleBase` → `populateDescriptions`: `src/pkg/controllermanager/deployer/deployer.go:703`, `src/pkg/controllermanager/deployer/deployer.go:755`
    - `Description` テンプレ生成: `src/pkg/controllermanager/deployer/deployer.go:834`
    - `Descriptions(namespace).Create`: `src/pkg/controllermanager/deployer/deployer.go:968`

7. 子クラスタの `clusternet-agent` (Pull モード) がその子の namespace の `Description` を watch し、中の各オブジェクトを子クラスタの API へ apply する。Push モードでは hub が websocket トンネル越しに同じことをする。

    - `handleDescription`: `src/pkg/agent/deployer/generic/generic.go:123`
    - 適用: `src/pkg/agent/deployer/generic/generic.go:131` の `utils.ApplyDescription(...)`

`Subscription → (scheduler) BindingClusters → (controller-manager) Base → Description → (agent/hub) 実 apply` が配布パイプライン全体。スケジューラとデプロイヤが status 経由で疎結合なのがポイント。

### コアデータ構造

すべて `pkg/apis` 配下の CRD。

- `Subscription` / `SubscriptionSpec` (`src/pkg/apis/apps/v1alpha1/subscription.go:34`, `:43`): 配布の入力。`Subscribers []Subscriber` (`:92`) でクラスタ selector、`Feeds []Feed` (`:103`) で配布対象、`SchedulingStrategy` (`:65`、既定 `Replication`、もう一方が `Dividing`) で全クラスタ複製か容量按分かを選ぶ。`Status.BindingClusters` がスケジューラの出力。
- `ManagedCluster` / `ManagedClusterSpec` / `ManagedClusterStatus` (`src/pkg/apis/clusters/v1beta1/types.go:354`, `:191`, `:234`): 登録済み子クラスタ 1 つ。Status は heartbeat で更新され `NodeStatistics` (`:372`), `PodStatistics` (`:390`), `ResourceUsage` (`:400`) を持つ。scheduler の predict 段がこれを見て残容量を判断する。
- `Base` / `BaseSpec` (`src/pkg/apis/apps/v1alpha1/types.go:31`, `src/pkg/apis/apps/v1alpha1/base.go:20`): 「ある子クラスタへ配るべき Feed 集合」の中間表現。Subscription を per-cluster に割り当てた結果。
- `Description` / `DescriptionSpec` (`src/pkg/apis/apps/v1alpha1/description.go:35`, `:44`): レンダリング済みのデプロイ単位。生マニフェストと種別 (`Deployer`: Generic / Helm) を持つ。agent / hub が実 apply する終端オブジェクト。
- `FeedInventory` / `ReplicaRequirements` (`src/pkg/apis/apps/v1alpha1/feedinventory.go:31`, `:67`): Dividing スケジューリング用。各 Feed が要求する CPU/メモリ等を棚卸しし、scheduler の predict 段が「このクラスタに何レプリカ載るか」を計算するのに使う。

補助構造として `Manifest` (`src/pkg/apis/apps/v1alpha1/manifest.go:30`)、`HelmChart` / `HelmRelease` (`src/pkg/apis/apps/v1alpha1/helm.go:37`, `:211`)、`Localization` / `Globalization` (`src/pkg/apis/apps/v1alpha1/localization.go:31`, `src/pkg/apis/apps/v1alpha1/globalization.go:32`、クラスタ単位 / 全体のオーバーライド) がある。

### 非自明な設計判断: shadow API (kubectl apply が CRD に化ける)

`clusternet-hub` は aggregated API server で、登録済みの全リソース型に対して「shadow」REST ハンドラを動的に登録する (`src/pkg/hub/registry/shadow/`)。狙いは「ユーザは普通の `kubectl apply -f deployment.yaml` を hub に投げるだけでマルチクラスタ配布の素材になる」こと。

仕組みは shadow REST の `Create` にある。投入オブジェクトを実体化せず、dry-run で検証したうえで `appsapi.Manifest` に包んで保存する。

- `REST.Create`: `src/pkg/hub/registry/shadow/template/rest.go:105`
- dry-run: `src/pkg/hub/registry/shadow/template/rest.go:107`
- `Manifest` でラップ: `src/pkg/hub/registry/shadow/template/rest.go:113`
- `Manifests(namespace).Create`: `src/pkg/hub/registry/shadow/template/rest.go:132`

検証済みコード片 (`rest.go:113-122`):

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

結果としてユーザは Clusternet 専用 CRD を覚えずに既存マニフェストと `kubectl` をそのまま使える。「Kubernetes のやり方を変えない」という設計目標を API レイヤで実現している。

関連してもう一つ非自明なのが proxy の作りで、子クラスタが NAT/FW の内側にいても親から `kubectl` で叩ける。hub は Rancher の `remotedialer` で reverse websocket トンネルを張り、子からの dial-out を保持し、親宛のリクエストをそのトンネル越しに re-dial する。

- `remotedialer.Server` を生成: `src/pkg/hub/exchanger/exchanger.go:76`
- cluster ID ごとに dialer を取得し transport の `DialContext` に挿す: `src/pkg/hub/exchanger/exchanger.go:94`
- proxy 経路: `src/pkg/hub/exchanger/exchanger.go:119` の `ProxyConnect`

これにより親→子のインバウンド到達性が不要になる。エッジ/オンプレ混在を「インターネット越しに見る」という名前の由来そのもの。

### ビルドとエントリポイント

- ビルド: `Makefile` (Go 1.23 系、`GOVERSION ?= 1.23.8` が `src/Makefile:20`)。`Dockerfile` あり、vendor 無し (module モード)。
- エントリ例: `clusternet-hub` は `src/cmd/clusternet-hub/hub.go:31` の `main()`。他 3 コンポーネントも `cmd/<name>/<name>.go` に同型の `main` を持つ。
- kubectl plugin: `kubectl krew install clusternet` で配布 (`src/README.md:79`)。

## 採用事例の素材

- 正式な `ADOPTERS.md` はリポジトリに存在しない (GitHub Contents API で 404)。本番採用組織を裏取りできるソースは未確認。捏造しない。
- README は「30+ contributors from Tencent, intel, ByteDance, Ant Group, Kanzhun, Purple Mountain Laboratories, Dmall, KuGou, Futu, WeBank, QQ Music, 37Games」と記す (<https://github.com/clusternet/clusternet>)。これは contributor の所属であり「本番採用」の出典ではない点に注意。
- maintainer の所属は Tencent / Intel / Purple Mountain Laboratory (`src/MAINTAINERS.md`)。
- GitHub シグナル (2026-06-27 時点、GitHub API): stars 1,440 / forks 208 / open issues 70 / contributors 約 48 名。最新リリース `v0.18.1` (2025-08-13)、全 28 リリース。

## 代替・エコシステム

- 隣接 CNCF プロジェクト: Karmada、Open Cluster Management (OCM)、KubeVela、KubeStellar。いずれもマルチクラスタのアプリ配布をやるが完全に同一ではない (<https://palark.com/blog/cncf-sandbox-2023-h1/>)。
- Clusternet の差別化はネットワーク寄り。reverse websocket トンネルで子クラスタを親から透過的に `kubectl` できる点と、shadow API で既存マニフェストをそのまま使える点。Karmada が配布/スケジューリング中心なのに対し、Clusternet は「visit (proxy)」も一級機能。
- 統合: Helm (OCI チャート含む) ビルトイン、cluster-api 作成クラスタの自動登録、mcs-api でのマルチクラスタサービス、Prometheus/Grafana 監視、Submariner / Istio / Linkerd でのクロスクラスタネットワーク (<https://github.com/clusternet/clusternet>, README Core Features)。
- client 連携: `client-go` ラッパー (`src/examples/clientgo`) と kubectl krew plugin。

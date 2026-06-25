# recon: KubeVela

調査メモ。出典は URL を添える。path:line は pinned commit のもの。

## 基本情報

- repo: [kubevela/kubevela](https://github.com/kubevela/kubevela) (Go module 名は歴史的経緯で `github.com/oam-dev/kubevela`、`src/go.mod:1`)
- pinned commit: `a10dba6d37353d25989502e52facaae87452a5b1` (master, commit date 2026-06-10)
- 近いタグ: 安定版最新は `v1.10.8`、プレリリース最新は `v1.11.0-alpha.3` (2026-04-13)。HEAD はそれより先の master
- 言語 / ビルド: Go 1.23.8 (`src/go.mod:3`) / `make manager` で controller を `go build ./cmd/core/main.go` (`src/Makefile:102-103`)、CLI は `go build ./references/cmd/cli/main.go` (`src/makefiles/build.mk:4`)
- ライセンス: Apache-2.0 (`src/LICENSE:1-5`、各 Go ファイル冒頭にヘッダ。`gh repo view` も `apache-2.0` を返す)
- CNCF 成熟度: Incubating (2023-02-27 昇格。[CNCF project page](https://www.cncf.io/projects/kubevela/))
- カテゴリ (tools.ts の CATEGORY_ORDER から): App Definition & GitOps

## 歴史の素材

- 出自は Open Application Model (OAM)。OAM は 2020 年に Alibaba Cloud と Microsoft Azure が共同提唱したアプリ配信モデルで、KubeVela はその最初の実装。`oam-kubernetes-runtime` から派生し、8 組織以上 (Alibaba Cloud, Microsoft, Upbound ほか) のブートストラップ貢献で立ち上がった。([CNCF blog 2023-03-31](https://www.cncf.io/blog/2023/03/31/kubevela-the-road-to-cloud-native-application-and-platform-engineering/))
- OAM の中核抽象: Component (ワークロードのモデル化) と Trait (Component に運用能力を付与)。抽象層は CUE で記述される。([CNCF blog 2023-03-31](https://www.cncf.io/blog/2023/03/31/kubevela-the-road-to-cloud-native-application-and-platform-engineering/))
- マイルストーン: 2020-11 OSS 公開 / 2021-04 v1.0 / 2021-06-22 CNCF Sandbox 受理 / 2023-02-27 Incubating 昇格。([CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/))
- 昇格時点の成長: contributor 90+ から 290+、star 1900+ から 4700+、貢献組織 20+ から 70+。([CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/))

## アーキテクチャの素材

KubeVela は Kubernetes 上の CRD コントローラ。ユーザは `Application` CR (`components[]` + `policies[]` + `workflow`) を 1 つ書き、コントローラがそれを実リソースに展開する。

- API グループ `core.oam.dev`。型は `src/apis/core.oam.dev/v1beta1/` に集約。`Application` 本体は `src/apis/core.oam.dev/v1beta1/application_types.go:81-87` (`Spec ApplicationSpec` + `Status common.AppStatus`)。`ApplicationSpec` は `Components` / `Policies` / `Workflow` の 3 本柱 (`:51-65`)。
- トップレベルのコンポーネント (`src/pkg/`): `appfile` (Application を中間表現にパース)、`cue` (CUE による template 評価)、`workflow` (ステップ実行エンジン)、`resourcekeeper` / `resourcetracker` (適用済みリソースの台帳と GC)、`multicluster` (クラスタまたぎ配信)、`policy`、`definition` (X-Definition 解決)、`addon`、`velaql` (クエリ)。
- エントリポイントは 3 つ: controller-manager `src/cmd/core/main.go:25-30` (`app.NewCoreCommand()`)、CLI `vela` `src/references/cmd/cli/main.go`、kubectl プラグイン `src/cmd/plugin/main.go`。

## 内部実装の素材

代表オペレーション = Application 1 件の reconcile を端から端まで追う。中心は `src/pkg/controller/core.oam.dev/v1beta1/application/application_controller.go` の `Reconcile` (`:109`)。

1. `Application` を取得 (`:115-124`)。pause / controller 要件不一致なら早期 return (`:126-133`)。
2. パーサとハンドラを生成: `appfile.NewApplicationParser(r.Client)` (`:144`)、`NewAppHandler` (`:145`)。
3. finalizer 処理 (`:153`) と Application-scope policy 変換 (`:165`)。
4. `appParser.GenerateAppFile(logCtx, app)` (`:180`) で `Application` を `Appfile` 中間表現に変換。実装は `src/pkg/appfile/parser.go:87` の `GenerateAppFile`。
5. AppRevision を準備・適用 (`PrepareCurrentAppRevision` `:188` / `FinalizeAndApplyAppRevision` `:194`)。リビジョンハッシュで新旧判定。
6. `handler.ApplyPolicies(logCtx, appFile)` (`:211`)。
7. `handler.GenerateApplicationSteps(...)` (`:222`) で workflow インスタンスと runner 群を生成。`RenderCondition` をセット。
8. `executor.New(workflowInstance)` から `workflowExecutor.ExecuteRunners(authCtx, runners)` (`:231-236`)。workflow 実行時間を histogram で計測 (`:237`)。
9. workflow の状態 (`Suspending` / `Terminated` / `Failed` / `Executing` / `Succeeded` / `Skipped`) で分岐 (`:280-319`)。成功時は status を ResourceTracker から再構築し (`:323`)、health を `evalStatus` で評価 (`:326`)。

レンダリング核心 (Component から実マニフェスト): `Appfile.GenerateComponentManifest` (`src/pkg/appfile/appfile.go:332`)。category が Terraform なら Terraform module、それ以外は `generateComponentFromCUEModule` (`:346`, `:541`)。`baseGenerateComponent` (`:553`) が各 Trait の `EvalContext(pCtx)` を呼び (`:556-560`)、patch があれば CUE `Unify` で workload にマージ (`:561-575`)、最後に `evalWorkloadWithContext` (`:576`, `:623`) が `base.Unstructured()` で CUE 値を unstructured K8s オブジェクトへ変換 (`:599`)。

workflow から実適用への接続: workflow の component 適用ステップが `handler.resourceKeeper.Dispatch(ctx, resources, applyOptions)` (`src/pkg/controller/core.oam.dev/v1beta1/application/generator.go:104`) を呼ぶ。`Dispatch` 本体は `src/pkg/resourcekeeper/dispatch.go:61`。マルチクラスタ配信は `dispatcher.go:170` 経由。

### 中核データ構造

- `Application` (`src/apis/core.oam.dev/v1beta1/application_types.go:81`): ユーザ向けの唯一の入力 CR。`storageversion` 指定あり。
- `ApplicationComponent` (`src/apis/core.oam.dev/common/types.go:351`): `Name` / `Type` / `Properties` (RawExtension) / `Traits[]` / `DependsOn` / `Inputs` / `Outputs`。Component と Trait の OAM 合成単位。
- `Appfile` (`src/pkg/appfile/appfile.go:160`): reconcile 中の中間表現。`ParsedComponents` / `ParsedPolicies` / 解決済み `RelatedComponentDefinitions` / `RelatedTraitDefinitions` / `RelatedWorkflowStepDefinitions`、`Artifacts []*ComponentManifest`、`WorkflowSteps` を束ねる。
- `ComponentManifest` (`src/apis/types/componentmanifest.go:24`): 1 Component のレンダリング結果 (workload + traits の unstructured 群)。
- `ResourceTracker` (`src/apis/core.oam.dev/v1beta1/resourcetracker_types.go:51`): 適用済みリソースの台帳。type は `root` / `versioned` / `component-revision` (`:61-68`) で GC 寿命が変わる。

### 非自明な設計判断

抽象層を Go コードではなく CUE template で実装している点。ComponentDefinition / TraitDefinition は CUE で書かれ、reconcile 時に評価される。Trait の workload への適用は CUE の `Unify` (構造的単一化) で行われる (`src/pkg/appfile/appfile.go:564,570`)。これにより、プラットフォームチームはコントローラを再ビルドせず CUE 定義の追加だけで新しい component / trait 型を LEGO のように足せる。最終マニフェストは CUE 値から `Unstructured()` で生成 (`:599`)。コストは CUE 評価エラーの扱いが複雑になる点で、`FormatCUEError` という専用のエラー整形を持つ (`:604,611`)。

ResourceTracker による GC も非自明。適用結果を K8s 上の ResourceTracker CR に台帳化し、`ManagedResources` を圧縮保存できる (`MarshalJSON` で圧縮分岐、`src/apis/core.oam.dev/v1beta1/resourcetracker_types.go:86-103`)。削除は台帳の差分計算で行うため、宣言から消えたリソースを確実に回収できる。

## 採用事例の素材

出典: [kubevela/community ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md) (参照 2026-06-24)。Production Users から citable な名前のみ。

- Alibaba Cloud (ACK ONE, BizWorks, SAE)
- China Merchants Bank (招商銀行)
- Bytedance (コンテナ化ゲームプラットフォーム)
- Baidu (MEG マイクロサービス)
- JD Cloud / China Mobile Cloud / NetEase Games / Li Auto / XPeng Motors / Geely Auto / Shein / OceanBase / Springer Nature / wasmCloud / Vortexa など

Development & Testing Users (ADOPTERS.md 記載): Intuit (application-centric K8s platform)、Siemens Technology、HSBC、Mercedes-Benz Group China、Guidewire、Trendyol、DaoCloud、Didi Chuxing ほか。

注: CNCF incubation blog でも Alibaba / Bytedance / China Merchants Bank が名指しで紹介されている ([CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/))。

採用シグナル (GitHub API 経由、参照 2026-06-24): star 7,833 / fork 1,030 / contributor 253 / open issue 214。

## 代替・エコシステム

- Helm: K8s マニフェストのパッケージング / テンプレート。KubeVela はより上位の抽象で、Helm chart をそのまま配信できる ([KubeVela docs](https://kubevela.io/docs/))。
- Argo CD: Git をソースオブトゥルースにした GitOps 同期。KubeVela とは層が違い、併用例 (Argo CD + Crossplane + KubeVela) が知られる ([KubeVela talks](https://kubevela.io/videos/talks/en/devops-toolkit-2/))。
- Crossplane: クラウドインフラのプロビジョニング (CRD)。KubeVela は Crossplane CRD をネイティブに扱える。
- 本質的な差: KubeVela は OAM ベースのアプリ中心抽象に workflow とマルチクラスタ配信を 1 つの control plane にまとめる。抽象の柔軟性 (CUE モジュール) が強みで、トレードオフは複雑性がプラットフォーム設定側に移ること ([LibHunt 比較](https://www.libhunt.com/compare-kubevela-vs-crossplane))。
- 統合: Terraform (community 製 controller)、KCL ([KCL + KubeVela 連携](https://www.kcl-lang.io/blog/2023-12-15-kubevela-integration))、addon エコシステム (`src/pkg/addon`)。

## ガバナンス

- ガバナンスは [kubevela/community GOVERNANCE.md](https://github.com/kubevela/community/blob/main/GOVERNANCE.md) に集約 (repo の `src/GOVERNANCE.md` はそこへのポインタのみ)。
- maintainer の super-majority 投票で意思決定。1 週間の非公開投票期間。6 か月以上不活発な maintainer は自動 removal (super-majority で延長可)。CNCF Code of Conduct 準拠。

## 最小セットアップ

```bash
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm install --create-namespace -n vela-system kubevela kubevela/vela-core
```

その後 `Application` CR を `kubectl apply` するか `vela up -f app.yaml` で配信。出典: [KubeVela docs Introduction](https://kubevela.io/docs/)。

## タグライン案

- EN: Application-centric delivery control plane that turns one OAM `Application` into multi-cluster Kubernetes resources via composable CUE modules.
- JA: 1 つの OAM `Application` から、組み立て可能な CUE モジュール経由でマルチクラスタの Kubernetes リソースを配信するアプリ中心の control plane。

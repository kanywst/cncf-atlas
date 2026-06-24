# recon: Crossplane

調査メモ。自分用。出典は URL + `path:line` で残す。clone は `research/crossplane/src` (gitignore 済み)。

## 基本情報

- repo: `crossplane/crossplane` (org に provider 等多数あるが、コア実装はこれ。CNCF landscape / docs もここを指す)
- pinned commit: `56aace77e6771894afa157a3339dbe8d6d15401a` (main, 2026-06-19, PR #7509 のマージ)
- 近いタグ: 最新安定リリースは `v2.3.2` (2026-06-09)。pin はその後の main HEAD で `v2.4.0-rc.0` より前。タグ commit とは一致しない
- 言語 / ビルド: Go (`go 1.25.10`、module `github.com/crossplane/crossplane/v2`)。ビルドは `make` (Upbound build submodule + nix)。バイナリは単一 `crossplane`
- ライセンス: Apache-2.0 (`LICENSE` 1 行目 "Apache License Version 2.0"、`go.mod` ヘッダ、GitHub API `spdx_id=Apache-2.0` で一致確認)
- CNCF 成熟度: Graduated (2025-10-28 graduated、公表 2025-11-06)
- カテゴリ: App Definition & GitOps (control-plane / platform engineering。CNCF landscape の元区分は Orchestration & Scheduling だが、実態は宣言的アプリ/インフラ定義の control plane でこのバケットが最も近い)
- main entrypoint: `cmd/crossplane/main.go:87` の `main()`。kong CLI、サブコマンド `core` / `rbac` / `render`。コントローラ起動は `cmd/crossplane/core/core.go:164` の `(*startCommand).Run`

## 歴史の素材

- 2018: Upbound が作成し OSS 化 (元は「universal multicloud control plane」構想)。GitHub repo 作成は 2018-09-08 (GitHub API `created_at`)。出典: [Crossplane graduation blog](https://blog.crossplane.io/crossplane-cncf-graduation/)
- 2020-06-25: CNCF Sandbox 受理。出典: [CNCF project page](https://www.cncf.io/projects/crossplane/)
- 2021-09-14: CNCF Incubating 昇格。当時 v1.0 到達が大きな節目。出典: [Crossplane CNCF Incubation blog](https://blog.crossplane.io/crossplane-cncf-incubation/) と [CNCF project page](https://www.cncf.io/projects/crossplane/)
- 2025-08: Crossplane v2.0 リリース。アーキテクチャ刷新 (後述)。出典: [What's New in v2](https://docs.crossplane.io/latest/whats-new/)
- 2025-10-28 graduated / 2025-11-06 公表。要件: 第三者セキュリティ監査 2 回、vendor-neutral governance、OpenSSF Best Practices badge、LTS ポリシー、リリース基盤を CNCF 所有へ移管、community registry `xpkg.crossplane.io` 開設。出典: [CNCF graduation announcement](https://www.cncf.io/announcements/2025/11/06/cloud-native-computing-foundation-announces-graduation-of-crossplane/) と [graduation blog](https://blog.crossplane.io/crossplane-cncf-graduation/)
- graduation application issue: [cncf/toc#1397](https://github.com/cncf/toc/issues/1397)

## アーキテクチャの素材

Crossplane は Kubernetes API server の上に乗る「control plane を作るためのフレームワーク」。自前の状態ファイルは持たず、desired/observed state は CRD として etcd に置き、controller が継続的に reconcile する。Terraform/Pulumi の「apply 一発」モデルと対照的 (出典: [Pulumi の比較ページ](https://www.pulumi.com/docs/iac/comparisons/crossplane/))。

トップレベルのコンポーネント (`internal/controller/`):

- `apiextensions/` — コアの composition エンジン。XRD / Composition / CompositionRevision / Composite(XR) を扱う。reconcile の中心
- `pkg/` — package manager。Provider / Configuration / Function パッケージ (OCI image) の install / dependency 解決 / revision 管理。依存解決は `internal/dag/` の DAG (`internal/dag/dag.go:17` "Directed Acyclic Graph for Package dependencies")
- `ops/` — v2 新機能 Operations。function pipeline を Job のように一回完走させる (`cronoperation` / `watchoperation` / `operation`)
- `rbac/` — RBAC Manager。XRD ごとに必要な ClusterRole を生成
- `protection/` — Usage / 削除保護 (foreground deletion, cross-resource ref protection)

コントローラ起動の流れ (`cmd/crossplane/core/core.go:164` `(*startCommand).Run`):

1. controller-runtime manager を組み立て
2. `apiextensions.Setup(mgr, ao)` (`core.go:539`)
3. feature flag が立てば `ops.Setup` (`core.go:550`)
4. `pkg.Setup(mgr, po)` (`core.go:642`)
5. `protection.Setup` / webhook (`core.go:654`)
6. `mgr.Start(ctrl.SetupSignalHandler())` (`core.go:665`)

controller の動的ライフサイクル管理は `internal/engine/` (`internal/engine/engine.go` "Package engine manages the lifecycle of a set of controllers")。XRD が適用されるたびに対応する XR controller を起動/停止する。

非自明な設計判断:

- **Composition Functions over gRPC**: v2 は P&T (patch & transform) を廃止し、composition を完全に function pipeline 化。各 function は別プロセス/コンテナで動く gRPC サービスで、`proto/fn/v1/run_function.proto` の `RunFunctionRequest`/`RunFunctionResponse` でやり取りする。これにより YAML/KCL/Python/Go/HCL など任意言語で composition を書ける。各 function は完全な desired state を返す契約 (`run_function.proto:281` `message State` のコメント: 明示しないものは削除される)。出典: [Functions docs](https://docs.crossplane.io/latest/packages/functions/)
- **Server-Side Apply の field ownership で composed resource を所有**: `composition_functions.go:755` `ComposedFieldOwnerName(xr)`。SSA の field manager 名を XR ごとに決め、複数 composer が同一リソースを安全に分担できる
- **Circuit breaker**: XR reconciler に circuit breaker を内蔵 (`reconciler.go:591` `WatchCircuitClosed()` / `:593` `WatchCircuitOpen`)。暴走 watch を遮断し、状態を condition として公開

## 内部実装の素材

代表オペレーションを end-to-end で追う: **XR (composite resource) の reconcile → function pipeline 実行 → composed resource の apply**。

入口は `internal/controller/apiextensions/composite/reconciler.go:564` `(*Reconciler).Reconcile`:

```text
reconciler.go:574  XR を Get (composite.New + gvk/schema)
reconciler.go:592  circuit breaker 状態を確認し condition セット
reconciler.go:600  pause annotation を確認、あれば status 更新して return
reconciler.go:618  削除中なら finalizer 除去して return (削除時に function は走らない)
reconciler.go:642  finalizer 付与
reconciler.go:656  SelectComposition       (composition 参照を解決)
reconciler.go:674  SelectCompositionRevision
reconciler.go:693  revision.Fetch          (CompositionRevision 取得)
reconciler.go:715  ValidPipeline condition を確認 (true でなければ中断)
reconciler.go:730  Configure               (XR を revision に合わせて設定)
reconciler.go:745  resource.Compose(...)   <- ここが本体
```

`Compose` の実体は `internal/controller/apiextensions/composite/composition_functions.go:288` `(*FunctionComposer).Compose`:

```text
composition_functions.go:296  ObserveComposedResources   (既存 composed を観測)
composition_functions.go:307  FetchConnection            (XR の connection details)
composition_functions.go:312  AsState                    (observed を protobuf State へ)
composition_functions.go:323  desired は空 State から開始
composition_functions.go:344  for stepIndex, fn := range req.Revision.Spec.Pipeline
composition_functions.go:345    RunFunctionRequest{Observed, Desired, Context}
composition_functions.go:347    fn.Input を structpb へ unmarshal
composition_functions.go:356    Credentials を Secret から注入
composition_functions.go:378    bootstrap Requirements (RequiredResources/Schemas) を事前取得
composition_functions.go:405    rsp = c.pipeline.RunFunction(ctx, fn.FunctionRef.Name, fnreq)  <- gRPC 呼び出し
composition_functions.go:418    d = rsp.GetDesired()   (次 function へ desired を引き継ぐ)
composition_functions.go:422    fctx = rsp.GetContext()
composition_functions.go:450    Results: FATAL severity なら PipelineFatalError で中断
composition_functions.go:484  for name, dr := range d.GetResources()  (desired composed を構築)
composition_functions.go:528    RenderComposedResourceMetadata        (XR 由来の metadata 付与)
```

pipeline TTL は各 function が返す最小の非ゼロ値 (`composition_functions.go:413`)。`FunctionRunner` インターフェースは `composition_functions.go:149`。

中核データ構造 (3-5 個):

- `PipelineStep` (`apis/apiextensions/v1/composition_common.go:59`): composition の 1 ステップ。`Step` 名、`FunctionRef`、任意の `Input` (RawExtension)、`Credentials`、`Requirements`。Composition は `Pipeline []PipelineStep` を持つ (`apis/apiextensions/v1/composition_types.go:54`)
- `CompositeResourceDefinition` (XRD) (`apis/apiextensions/v2/xrd_types.go:269`、Spec は `:40`): 新しい XR の型を定義。v2 で `Scope` (`:60` Namespaced/Cluster、default Namespaced) が追加され、claim は deprecated (`:114`)
- `CompositionRevision` (`apis/apiextensions/v1/composition_revision_types.go:102`): Composition の immutable スナップショット。XR は revision を選択して固定でき、ローリング更新を制御
- `RunFunctionRequest` / `State` / `Resource` (`proto/fn/v1/run_function.proto:39` / `:281` / `:292`): function との protobuf 契約。`State` は XR (`composite`) と `map<string,Resource> resources` (composed) を持つ。function は完全な desired を返す契約
- `FunctionComposer` (`internal/controller/apiextensions/composite/composition_functions.go:130`): pipeline 実行器。observe -> run pipeline -> garbage collect を orchestration

その他追う価値:

- package manager の DAG 依存解決: `internal/dag/dag.go`
- 動的 controller 管理: `internal/engine/engine.go`
- Operations (v2): `internal/controller/ops/`、API は `apis/ops/v1alpha1/`

## 採用事例の素材

ADOPTERS (`ADOPTERS.md` に記載、すべて出典付き):

- Nike — internal developer platform、開発から本番まで数千リソースを管理
- Nokia — network service の本番デプロイ向けマルチクラウドオーケストレーション
- SAP — 2024-02 時点で 100+ KRM control plane、数千 managed resource。provider も貢献
- IBM — IBM Cloud 向け provider、service mapping framework
- Grafana Labs — 内部 developer platform の control plane
- Elastic — Elastic Serverless 向けにマルチクラウドでリソース展開
- NASA Science Cloud (SMCE) — Open Science Studio (JupyterHub ベース) を composition で展開
- Deutsche Kreditbank (DKB) — 10+ EKS クラスタ、数千リソース
- DB Systel (Deutsche Bahn) — Developer Experience Platform のバックボーン、Backstage 連携

CNCF 公表値 (graduation 時、出典 [graduation announcement](https://www.cncf.io/announcements/2025/11/06/cloud-native-computing-foundation-announces-graduation-of-crossplane/)): 全 crossplane org で 3,000+ contributors / 450+ organizations、CNCF 全 231 project 中 PR author 数で #13 (上位 10%)、70+ public adopters。

GitHub (`crossplane/crossplane` 単体、GitHub API、2026-06-22 取得): stars 11,787 / forks 1,201 / open issues 190。contributors は API ページング上 ~276 (この repo 単体。CNCF の 3,000 は org 全体)。

## 代替・エコシステム

- **Terraform / OpenTofu**: CLI で apply、HCL、状態ファイル管理。最大の provider エコシステム。Crossplane provider の多くは Upjet で Terraform provider から生成される (関係は補完的)
- **Pulumi**: 汎用言語 (Python/TS 等) で IaC。CLI / Automation API、K8s 不要。Crossplane は K8s クラスタが運用前提
- **Kro / Argo / Kustomize / Helm**: アプリ定義系。`function-kro` で kro の YAML+CEL を Crossplane pipeline に持ち込める (出典: [function-kro blog](https://blog.crossplane.io/function-kro-yaml-cel/))

本質的な差: Crossplane は (1) K8s の継続 reconcile で drift を自動修正、(2) 状態は etcd 内 CRD で別途 state ファイル/ロック不要、(3) XRD/Composition で「自社 API」を定義し開発者セルフサービスを安全に提供する platform engineering 向け。学習コストとして K8s 知識が前提になる (出典: [platformengineering.org の比較](https://platformengineering.org/blog/terraform-vs-pulumi-vs-crossplane-iac-tool))。

エコシステム: provider (AWS/Azure/GCP は Upjet 生成、その他コミュニティ多数)、composition functions (KCL/Python/Go/go-templating/patch-and-transform 等)、package registry `xpkg.crossplane.io`、CLI (`crossplane render` でローカルに pipeline をプレビュー、`cmd/crossplane/render/render.go`)。

## インストール / 最小構成

出典: [Get started docs](https://docs.crossplane.io/latest/get-started/) と repo の Helm chart (`cluster/`)。

```bash
# 1. K8s クラスタ (kind 等) を用意した上で Helm で導入
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm install crossplane crossplane-stable/crossplane \
  --namespace crossplane-system --create-namespace

# 2. function と XRD/Composition を適用し、XR を作る
# 3. ローカル検証は CLI:
crossplane render xr.yaml composition.yaml functions.yaml
```

最小で動く構成: K8s クラスタ + crossplane core + (provider もしくは function) + XRD + Composition + XR。v2 では composed に Crossplane MR だけでなく任意の K8s リソース (Deployment や CloudNativePG の Cluster 等) を含められる。

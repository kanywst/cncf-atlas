# recon: Argo CD

調査メモ。自分用の密度。出典 URL は `sources.md` に番号で対応。パスは `research/argo/src/` 以下を指す。

## 基本情報

- repo: `argoproj/argo-cd`
- CNCF プロジェクト "Argo" は 4 サブプロジェクト (CD / Workflows / Rollouts / Events) の傘。カテゴリ "App Definition & GitOps" の中心は GitOps エンジンの Argo CD なので、deep-dive の主対象として argo-cd を選定。star も最大 (23.2k)。
- pinned commit: `8f6d4e19393233a0b566403b8b76dbc11c8c9c1c` (branch `master`, 2026-06-22 commit)
- 近いタグ: 安定最新リリースは `v3.4.4` (2026-06-18 公開)。pin した master は `VERSION` ファイルが `3.6.0` の開発版で v3.4.4 より先行。`v3.5.0-rc1` が RC として存在。
- 言語: Go (`go 1.26.3`, module `github.com/argoproj/argo-cd/v3`)。UI は React/TypeScript (`ui/`)。
- ビルド: `make build` / `make cli` / `make test` / `make codegen` (`AGENTS.md` 参照)。Go ファイル約 1017 (vendor 除く)。
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認。`go.mod` module は v3)。
- CNCF 成熟度: Graduated (2022-12-06 卒業)。出典 #1, #2。
- カテゴリ (tools.ts CATEGORY_ORDER): App Definition & GitOps。

## 歴史の素材

- 起源は 2016 年のスタートアップ Applatix (創業 Hong Wang, Jesse Suen, Alexander Matyushentsev)。コンテナ/k8s 上の DevOps スイートを作ろうとし、最初に出たのが Argo Workflows。出典 #4, #6。
- Applatix は Intuit に買収される。Intuit 内で「多数のクラスタ/namespace を管理する k8s ネイティブのデプロイツールが無い」課題から Argo CD が誕生。金融企業ゆえコンプライアンス要件があり GitOps アプローチを採用。出典 #4, #6。
- 2017 年に Argo をオープンソース化。2018-01 に Argo Workflows 公開、Argo CD と Argo Events が 2018 中、Argo Rollouts が 2019。BlackRock が Argo Events を寄贈。出典 #4, #5。argo-cd repo の GitHub `created_at` は 2018-02-09。出典 #3。
- CNCF Incubator 受理: 2020-04。Graduated: 2022-12-06 (Kubernetes/Prometheus/Envoy 等と並ぶ卒業プロジェクトに)。出典 #1, #2。
- 創業メンバーは後に Akuity を設立 (商用マネージド/サポート)。出典 #4。

## アーキテクチャの素材

Argo CD は複数バイナリ構成。単一 `cmd/main.go:1` がバイナリ名 (`ARGOCD_BINARY_NAME`) で各サブコマンドへ分岐する multi-call binary。主要コンポーネント:

- application-controller (`controller/`): 心臓部。Application CRD を reconcile し、Git の望ましい状態とクラスタの実状態を比較・同期。
- repo-server (`reposerver/`): Git/Helm/Kustomize/OCI からマニフェストを生成する gRPC サービス。controller は `GetRepoObjs` 経由で叩く (`controller/state.go:206`)。
- api-server (`server/`): gRPC + REST API、認証、RBAC、UI 配信。
- 補助: applicationset-controller (`applicationset/`)、commit-server (`commitserver/`)、cmp-server (config management plugin, `cmpserver/`)、notification-controller、dex (SSO)。

差分計算と適用の実体は `gitops-engine`。注目すべき構造変更: gitops-engine は元々別 repo (`argoproj/gitops-engine`) だったが、現在は argo-cd monorepo 内 (`gitops-engine/`) に取り込まれ、`go.mod:372` の `replace github.com/argoproj/argo-cd/gitops-engine => ./gitops-engine` でローカル module 化されている。import path も `github.com/argoproj/argo-cd/gitops-engine/...` に変わった (`controller/sync.go:15-18`)。

### 代表操作のトレース: Application の reconcile から auto-sync まで

1. コントローラ起動: `controller/appcontroller.go:908` `Run()` が statusProcessors 本の worker を回し、`appRefreshQueue` (`appcontroller.go:118`, `:200` で生成、rate-limited workqueue) を処理する。
2. refresh 1 件処理: `appcontroller.go:1728` `processAppRefreshQueueItem()`。informer indexer から Application を取得 (`:1746`)、`needRefreshAppStatus` で refresh 要否と比較レベルを決定 (`:1761`)。defer で reconcile 後に `appOperationQueue` に積み替える (`:1743`、race 回避は issue #18500)。
3. comparison level による短絡: `ComparisonWithNothing` ならキャッシュ済み managed resources からツリーだけ更新して return (`:1797-1816`)。フル比較に進む場合は dest cluster 解決 (`:1837`)、source/revision を組み立て (`:1849-1874`)。
4. 状態比較: `appcontroller.go:1876` が `CompareAppState(...)` を呼ぶ。本体 `controller/state.go:632`。
   - `GetRepoObjs` で repo-server からターゲット (Git 由来) マニフェスト生成 (`state.go:694`)。repo エラーは grace period 付きキャッシュで一時失敗を握りつぶす (`state.go:699-710`, `ErrCompareStateRepo`)。
   - live state は `m.liveStateCache.GetManagedLiveObjs` でクラスタキャッシュから取得 (`state.go:773`)。
   - gitops-engine の `Reconcile()` で target/live を突き合わせ (`gitops-engine/pkg/sync/reconcile.go:71`)、`argodiff.StateDiffs(...)` で実差分 (`state.go:917`)。
   - リソース毎に `SyncStatusCodeSynced`/`OutOfSync` を決め、全体 `syncCode` を確定 (`state.go:926`, `:990`, `:1039`)。結果は `comparisonResult` (`state.go:82`)。
5. auto-sync 判定: `appcontroller.go:1900` で project の sync window を見て、`:1908` `ctrl.autoSync(...)`。OutOfSync かつ自動同期が有効なら Operation を発行。
6. 同期実行: operation queue 側で `controller/sync.go:101` `SyncAppState()`。gitops-engine の `sync.NewSyncContext(...)` を組み立て (`sync.go:319`)、server-side apply / prune / hooks / sync wave 等のオプションを注入 (`sync.go:300-313`)。`syncCtx.Sync()` で実際に kubectl apply 相当を実行 (`sync.go:343`)、`GetState()` で結果収集 (`sync.go:347`)。
7. ステータス永続化: reconcile 末尾で `app.Status.Sync` / `Health` / `Resources` を更新し (`appcontroller.go:1929-1936`)、`persistReconciliationStatus` で CRD に patch。

設計判断のポイント:

- pull 型 GitOps。external CI が push するのではなく、controller が Git を真実として継続的に reconcile する。
- refresh と operation を別キューに分離 (`appRefreshQueue` / `appOperationQueue`) し、sync が refresh の後に走る順序を保証 (#18500)。
- 比較は repo-server へのマニフェスト生成が高コストなので、4 段階の comparison level で必要最小限に抑える (下記)。

## 内部実装の素材

中核データ構造:

- `Application` CRD: `pkg/apis/application/v1alpha1/types.go:68`。`ApplicationSpec` (`:77`, source(s)+destination+syncPolicy)、`ApplicationStatus` (`:1213`)、`SyncStatus` (`:1942`)、`SyncPolicy` (`:1518`)。Argo CD の操作対象そのもの。
- `comparisonResult`: `controller/state.go:82`。syncStatus / healthStatus / resources / `reconciliationResult` (gitops-engine) / `diffResultList` / hasPre/PostDeleteHooks / `revisionsMayHaveChanges` を束ねる reconcile の戻り値。
- `CompareWith` (比較レベル enum): `controller/appcontroller.go:88-94`。`CompareWithLatestForceResolve=3` / `CompareWithLatest=2` / `CompareWithRecent=1` / `ComparisonWithNothing=0`。
- `ReconciliationResult`: `gitops-engine/pkg/sync/reconcile.go:65`。target と live を index 対応で並べた、差分計算の入力。
- `AppProject` CRD: `pkg/apis/application/v1alpha1/types.go`。sync window、source/destination 制限、RBAC スコープを持つマルチテナント境界。

一番効く非自明な設計 (= one non-obvious design choice): reconcile の「比較レベル ladder」。`processAppRefreshQueueItem` は毎回フル比較せず、`needRefreshAppStatus` が返すレベルで処理量を変える (`appcontroller.go:1761`)。`ComparisonWithNothing` なら repo-server を一切叩かずキャッシュ済み managed resources からリソースツリーだけ再構築して即 return する (`appcontroller.go:1797-1816`)。`CompareWithRecent` は前回 synced revision を再利用し、`CompareWithLatest` で初めて Git 最新を取りに行く。Git/Helm マニフェスト生成が最も高コストな処理なので、ここを段階化して repo-server への負荷を抑えるのが大規模クラスタ (数千 app) で効く肝。コードを読まないと「reconcile = 毎回フル diff」と誤解する。

その他メモ:

- repo エラーの grace period キャッシュ (`state.go:699-710`): 一時的な Git 失敗で OutOfSync/Unknown に倒さず、`repoErrorGracePeriod` 内なら前回状態を維持。
- managed live object はクラスタ単位の共有キャッシュ (`liveStateCache`) から引く。controller は watch ベースで実状態を持ち、毎回 API server に list しない。

## 採用事例の素材

- repo 同梱 `USERS.md` (pin commit 時点で 445 エントリの「officially using」自己申告リスト)。出典 #7。citable な著名名: Adobe, Adyen, Alibaba Group, Ant Group, Autodesk, Bayer AG, BMW Group, Bosch (いずれも `USERS.md` に記載)。
- CNCF 卒業アナウンスが本番採用組織として明記: Adobe, BlackRock, Capital One, Google, Intuit, PagerDuty, Peloton, Snyk, Swisscom, Tesla, Volvo。「350+ 組織が本番利用 (Incubator 参加時から 250% 増)」。出典 #1。
- 採用シグナル (2026-06-22 時点, GitHub API): star 23,219 / fork 7,353 / open issues 4,216。contributors はおおよそ 2,000 超 (anon 含むページネーション末尾 page=2033)。出典 #3。BlackRock は Argo Events を寄贈したコントリビュータ。出典 #1, #4。

## 代替・エコシステム

- 直接の代替: Flux CD (CNCF Graduated の GitOps コントローラ)。Flux は GitOps Toolkit のコントローラ群でコンポーザブル、UI は持たない。Argo CD は単体で web UI / SSO / RBAC / マルチクラスタ可視化を内包し、application-centric。
- 周辺: 同じ Argo 傘の Argo Rollouts (progressive delivery)、Argo Workflows、Argo Events と連携。ApplicationSet で多クラスタ/モノレポ向けに Application を量産。gitops-engine は Argo CD と Flux 系の双方が共有しうる差分/同期ライブラリ (本 repo に取り込み済み)。
- 商用/マネージド: Akuity (創業者の会社)、Codefresh (GitOps プラットフォーム化)、Red Hat OpenShift GitOps (downstream)。出典 #4, #1。

## インストール / 最小構成

- 最小: k8s クラスタに `kubectl create namespace argocd`、続けて `stable` ブランチの `manifests/install.yaml` を `kubectl apply -n argocd -f` する (公式 manifests)。`argocd` CLI でログインし、Git repo を指す Application を作って sync。マニフェスト群は repo の `manifests/` に存在。出典 #8。

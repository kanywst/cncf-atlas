# recon: Carvel (kapp-controller)

調査メモ。Carvel は単機能ツールの寄せ集め (ytt / kapp / kbld / imgpkg / vendir / kapp-controller / secretgen-controller)。本 deep-dive はクラスタ内エンジンであり最もアーキテクチャが厚い `kapp-controller` を主実装リポジトリとして扱う。コードは `research/carvel/src` (gitignored) に clone 済み。

## 基本情報

- repo: `carvel-dev/kapp-controller` (Carvel スイートの主実装)
- umbrella/community repo: `carvel-dev/carvel` (ドキュメント・コミュニティのみ、実装なし)
- pinned commit: `be1faefd135d62d901a0ad4b4904b30c6c0dc7c3` / タグ: `v0.60.3` (HEAD == タグ)
- 言語 / ビルド: Go (go.mod `go 1.26.3`) / `hack/build.sh` (Version は git タグから ldflags 注入、`cmd/controller/main.go:16-17`)
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認、全 `.go` に `SPDX-License-Identifier: Apache-2.0` ヘッダ、GitHub API の `license.spdx_id` も `Apache-2.0`)
- メインエントリ: `cmd/controller/main.go:19` の `func main()`
- CNCF 成熟度: Sandbox (受理 2022-09-14、後述)
- カテゴリ: App Definition & GitOps

## 歴史の素材

- 起源: Dmitriy Kalinin と Nima Kaviani が既存の Kubernetes デプロイツール (モノリシックでデバッグしづらい) に不満を持ち、UNIX 哲学 (一つのことをうまくやる小さなツールを pipe で組む) で作ったのが始まり。出典: [Introduction to Carvel (carvel.dev blog)](https://carvel.dev/blog/introduction-to-carvel-blog-post/) 2026-06-26 参照。
- 名前の変遷: 当初 "Kubernetes Tools" から "k14s"、2020-08 に "Carvel" へリブランド。VMware (Tanzu) がスポンサー。旧 org は `github.com/k14s`、その後 `vmware-tanzu/carvel`、現在 `carvel-dev`。生成されるアノテーションには今も `k14s.io` が残る。出典: [Carvel sets sail for the CNCF Sandbox (VMware OSS blog)](https://blogs.vmware.com/opensource/2022/10/25/carvel-sets-sail-for-the-cncf-sandbox/) 2026-06-26 参照。
- "Carvel" は造船技法 (板を重ねず横並びに張って滑らかな船体を作る) に由来し、ツールを UNIX pipe で組む様に見立てた。同上 VMware blog。
- リリース時期: ツール群は 2018 秋から 2019 春に順次公開。`kapp-controller` リポジトリ自体は 2019-11-06 作成 (GitHub API)。
- CNCF Sandbox: 2022-09-14 受理。出典: [CNCF project page: Carvel](https://www.cncf.io/projects/carvel/) 2026-06-26 参照、および [Project Carvel has joined the CNCF (carvel.dev)](https://carvel.dev/blog/carvel-cncf-sandbox/)。

## アーキテクチャの素材

kapp-controller は controller-runtime ベースの Kubernetes コントローラ。フラグ定義は `cmd/controller/main.go:23-32` (concurrency, namespace, metrics-bind-address, start-api-server, sidecarexec など)。`sidecarexec` フラグが立つと別プロセスとして起動する (`cmd/controller/main.go:35-38` から `cmd/controller/sidecarexec.go:12` の `sidecarexecMain`)。

セットアップは `cmd/controller/run.go:61` の `func Run`。

- manager 生成: `run.go:82` `manager.New`、Scheme は `kcconfig.Scheme` (`run.go:72`)。
- コントローラを複数登録: config (`run.go:71-99`)、app (`run.go:118-141`)、加えて pkgrepository / packageinstall。
- app コントローラの reconciler は `app.NewReconciler` (`run.go:129`)、`CRDAppFactory` (`run.go:119`) を介して App ごとの実体を作る。最大並列数は `--concurrency` (`run.go:137`)。
- aggregated API server (集約 API サーバ): `--start-api-server` 有効時に `apiserver.NewAPIServer` を起動 (`run.go:47-58`)。これが Package / PackageMetadata を提供する (後述)。

トップレベル構成 (`pkg/` 配下): `apis`(型/CRD), `apiserver`(集約 API), `app`(App 調整), `fetch`/`template`/`deploy`(各段の実装), `packageinstall`/`pkgrepository`(パッケージング調整), `sidecarexec`(外部コマンド実行), `exec`(コマンド runner), `kubeconfig`/`satoken`(クラスタ資格情報), `reftracker`(Secret/ConfigMap 参照追跡), `metrics`。

## 内部実装の素材

### 代表操作: App CR の fetch から template から deploy を端から端まで

CR (CustomResource) = Kubernetes のカスタムリソース。SA (ServiceAccount) = サービスアカウント。

1. controller-runtime が App の変更を検知し `Reconciler.Reconcile` を呼ぶ: `pkg/app/reconciler.go:74`。
   - 最新の App を API から取り直す: `reconciler.go:79` (`Apps(...).Get`)。
   - factory で実体化し参照を更新: `reconciler.go:90` `NewCRDApp` / `reconciler.go:91` `UpdateAppRefs`。
   - `reconciler.go:100` `return crdApp.Reconcile(force)` に委譲。

2. `App.Reconcile`: `pkg/app/app_reconcile.go:19`。削除中なら `reconcileDelete`、それ以外は `reconcileDeploy` 経由で本体へ。

3. 本体パイプライン `reconcileFetchTemplateDeploy`: `pkg/app/app_reconcile.go:105`。
   - 一時ディレクトリ生成 `memdir.NewTmpDir("fetch-template-deploy")`: `app_reconcile.go:113`。
   - fetch 実行: `app_reconcile.go:128` `assetsPath, fetchResult = a.fetch(assetsPath)`、結果を `Status.Fetch` に記録 (`app_reconcile.go:130-138`)。
   - template 実行: `app_reconcile.go:154` `tplResult := a.template(assetsPath)`、`Status.Template` に記録。
   - deploy 実行: `app_reconcile.go:177` `return a.updateLastDeploy(a.deploy(tplResult.Stdout, a.updateLastDeployNoReturn))`。各段でエラーが出たら以降を打ち切り status に格納する (途中 return)。

4. fetch: `pkg/app/app_fetch.go:22` `func (a *App) fetch`。各 `Spec.Fetch` を vendir の 1 ディレクトリ設定に変換し (`app_fetch.go:35` `vendir.AddDir`)、`vendir.Run(conf, dstPath, a.cacheID())` で実行: `app_fetch.go:48`。vendir が git / Helm chart / OCI imgpkg bundle などを 1 つのディレクトリに取り込む。

5. template: `pkg/app/app_template.go:15` `func (a *App) template`。`Spec.Template` を順に走査し種別で分岐: `app_template.go:35-44` で `tpl.Ytt` から `NewYtt` (`:36`)、`tpl.Kbld` から `NewKbld` (`:38`)、`tpl.HelmTemplate` から `NewHelmTemplate`、`tpl.Sops`、`tpl.Cue`。直前段の stdout を次段の stdin に流す pipe 方式: `app_template.go:51-54` (`isStream` で `TemplateStream` か `TemplateDir` を選ぶ)。

6. deploy: `pkg/app/app_deploy.go:15` `func (a *App) deploy`。`Spec.Deploy` はちょうど 1 件である必要 (`app_deploy.go:21`)。`dep.Kapp` 分岐で `newKapp` から `kapp.Deploy(tplOutput, ...)`: `app_deploy.go:38`。

7. 実際の `kapp` 実行: `pkg/deploy/kapp.go:53` `func (a *Kapp) Deploy`。引数を組み立て `goexec.Command("kapp", args...)`: `kapp.go:73`、`a.cmdRunner.RunWithCancel(cmd, a.cancelCh)`: `kapp.go:79`。`cmdRunner` は sidecar の RPC クライアント (後述)。

### 中核データ構造 (3 から 5 個)

- `App` / `AppSpec`: `pkg/apis/kappctrl/v1alpha1/types.go:24` / `:48`。`Spec.Fetch []AppFetch` `Spec.Template []AppTemplate` `Spec.Deploy []AppDeploy` の 3 段がそのままパイプラインに対応 (`types.go:35`/`:37`/`:39`)。`ServiceAccountName` (`types.go:29`) でデプロイ権限を絞る。
- `PackageInstall` / `PackageInstallSpec`: `pkg/apis/packaging/v1alpha1/package_install.go:24` / `:47`。`PackageRef`(`:85`) の `VersionSelection *versions.VersionSelectionSemver` で semver 制約を指定し、解決した Package から App CR を生成する高レベル抽象。
- `PackageRepository` / `PackageRepositorySpec`: `pkg/apis/packaging/v1alpha1/package_repository.go:20` / `:41`。imgpkg bundle (OCI イメージ) を fetch して中の Package / PackageMetadata を公開する。
- `Package` / `PackageMetadata`: `pkg/apiserver/apis/datapackaging/types.go:30` / `:16`。CRD ではなく集約 API server が提供する読み取りビュー (PackageRepository の中身を K8s API として見せる)。
- `exec.CmdRunResult`: 各段 (fetch/template/deploy) の stdout/stderr/exit code/error を運ぶ統一結果型。Status の `Fetch`/`Template`/`Deploy` にそのまま転写される。

### 非自明な設計判断

ONR の概念ではない。RPC (Remote Procedure Call) = プロセス間遠隔手続き呼び出し。

1. **sidecarexec による特権分離**: 外部 CLI (vendir, ytt, kbld, sops, helm, cue, kapp) を本体プロセスで直接 exec せず、別プロセス (sidecar) が `net/rpc` 経由で実行する。許可コマンドは allowlist で固定: `cmd/controller/sidecarexec.go:20-26` で `AllowedCmdNames` を列挙、サーバ側 `pkg/sidecarexec/server.go:35-39` で set 化、実行時に `pkg/sidecarexec/cmd_exec.go:40-41` で `if _, found := r.allowedCmdNames[input.Command]; !found { return fmt.Errorf("Command '%s' is not allowed", ...) }` と弾く。本体の `cmdRunner` はこの RPC クライアント (`run.go:64-69` の `sidecarClient.CmdExec()`) なので、kapp 実行すら sidecar 経由。
2. **Package/PackageMetadata を CRD でなく集約 API server で提供**: `pkg/apiserver/apiserver.go` が `k8s.io/kube-aggregator` を使う (`apiserver.go:43-44`, `:149` `aggregatorclient.NewForConfig`)。PackageRepository の中身を仮想リソースとして見せ、etcd に個別 CRD を量産しない設計。
3. **config の同期初回 reconcile**: ツール実行前に proxy / CA 証明書設定を sidecar に確実に反映するため、config reconciler を起動時に同期的に 1 回回す: `cmd/controller/run.go:93-98`。

## 採用事例の素材

- リポジトリに `ADOPTERS` ファイルは存在しない (確認済み)。明示的な採用組織リストは公開されていない。
- 出自として VMware Tanzu 製品 (Tanzu Kubernetes Grid / Tanzu Application Platform) が Carvel ツールを内部採用してきた経緯は VMware OSS blog で言及あり。固有の第三者導入企業名は確証ソースが取れないため列挙しない (捏造禁止)。
- GitHub シグナル (gh API, 2026-06-26 取得): `carvel-dev/kapp-controller` star 315 / fork 125 / open issues 203 / contributors 約 76 (anon 込み)。umbrella `carvel-dev/carvel` star 409。最終 push 2026-06-22。

## 代替・エコシステム

- 直接の比較対象: Argo CD, Flux (GitOps エンジン)、Helm (パッケージング)。Carvel の差別化は「単機能ツールを組み合わせる」哲学と、kapp の drift 防止 (クラスタ管理フィールドを明示でき、単純な 3-way merge より厳密)。出典: [Comparing Kubernetes deployment tools (NETWAYS)](https://nws.netways.de/blog/2024/07/16/comparing-kubernetes-deployment-tools-what-we-got-today) 2026-06-26 参照。
- 隣接/新興: Timoni (CUE ベース), Glasskube (UI + curated registry, Flux に依存)。
- 統合: fetch 段で git / Helm chart / OCI (imgpkg bundle) を取り込み、template 段で ytt / kbld / Helm template / sops / cue を pipe で連結、deploy 段で kapp。Carvel ツール同士だけでなく Kustomize 等とも組める。
- CLI: `kctrl` (リリース資産に `kctrl-{os}-{arch}` あり)。

## install / 最小構成

- コントローラ導入 (kubectl):

  ```bash
  kubectl apply -f https://github.com/carvel-dev/kapp-controller/releases/latest/download/release.yml
  ```

- リリース資産に `release.yml` / `package.yml` / `package-metadata.yml` / `kctrl-*` バイナリが含まれる (gh API, v0.60.3 で確認)。
- 最小の App CR は `apiVersion: kappctrl.k14s.io/v1alpha1`, `kind: App`, `spec.fetch[]` / `spec.template[]` / `spec.deploy[]` を 1 つずつ書き、`spec.serviceAccountName` でデプロイ用 SA を指定する。examples は `research/carvel/src/examples/` に同梱。

# recon: Helm

調査メモ。Helm v4 系の main を読んだ。出典は URL と `path:line` で残す。

## 基本情報

- repo: `helm/helm` (canonical, 単一実装リポ)
- pinned commit: `74fa4fceb83526d7e7f3a5e99c768a3fe3d04549` (2026-06-20 commit)
- 近いタグ: `v4.2.2` (2026-06-18)。HEAD は v4.2.2 の数コミット後の main 先端。`internal/version/version.go` の `version = "v4.2"`、go module は `helm.sh/helm/v4`。
- 言語 / ビルド: Go 1.26.0 (`go.mod`) / `make build` → `CGO_ENABLED=$(CGO_ENABLED) go build -trimpath -tags '...' -ldflags '...' -o bin/helm ./cmd/helm` (`Makefile:70`)
- ライセンス: Apache-2.0 (確認済み。`LICENSE` 先頭 `Apache License Version 2.0, January 2004`、`gh repo view` も `apache-2.0`)
- CNCF 成熟度: Graduated (2020-04-30、CNCF 10 番目の卒業プロジェクト)
- カテゴリ (バケット): App Definition & GitOps
- main entrypoint: `cmd/helm/helm.go` の `main()` → `helmcmd.NewRootCmd(...)` → `cmd.Execute()` (`cmd/helm/helm.go:35`)

CNCF landscape 上の元カテゴリは "App Definition & GitOps" で、指定バケットとそのまま一致する。

## 歴史の素材

- 2015-10-15: Deis (スタートアップ) が Helm を開発、初回 KubeCon (SF) で発表。当時の `deisctl` を Kubernetes 向けに書き直したのが発端。Homebrew / apt / yum を手本にした「Kubernetes のパッケージマネージャ」。今は "Helm Classic" と呼ぶ。出典: [Helm History](https://helm.sh/community/history/)、[Helm 3 Preview pt1](https://helm.sh/blog/helm-3-preview-pt1/)
- 2016-01: Google の Kubernetes Deployment Manager チームと Seattle で合流、Helm 2 を作る決定。Deis / Google / SkippBox / Bitnami が開発に参加。プロジェクトは一旦 Kubernetes 配下へ。DM のサーバサイド成分が `Tiller` に改名され Helm 2.0 に残った。出典: [Helm History](https://helm.sh/community/history/)
- 2017 春: Microsoft が Deis を買収。出典: [Microsoft OSS Blog](https://opensource.microsoft.com/blog/2020/05/01/helm-package-manager-kubernetes-now-cncf-graduated-project)
- 2018-06: Helm が Kubernetes サブプロジェクトから独立し CNCF incubating へ昇格。Monocular / Chart Repo / ChartMuseum などを傘下に。出典: [Helm History](https://helm.sh/community/history/)
- 2019 後半: Helm 3 リリース。Tiller を削除し、クライアントから Kubernetes API を直接叩く構成へ回帰。セキュリティと RBAC が単純化。出典: [CNCF Helm 3 alpha](https://www.cncf.io/blog/2019/05/16/helm-3-preview-helm-3-alpha-release-available-and-whats-next/)
- 2020-04-30: CNCF Graduated に到達。出典: [CNCF Helm Graduation](https://www.cncf.io/announcements/2020/04/30/cloud-native-computing-foundation-announces-helm-graduation/)
- 2025-11 (KubeCon NA): Helm 4 リリース。6 年ぶりのメジャー。ネイティブ server-side apply と WASM ベースのプラグイン再設計。今読んでいる v4 系がこれ。出典: 比較記事群 (sources 参照)

## アーキテクチャの素材

トップレベルの層構造 (`research/helm/src/`):

- `cmd/helm/helm.go`: 薄い main。`kube.ManagedFieldsManager = "helm"` を設定し root cobra コマンドを実行するだけ。
- `pkg/cmd/`: cobra コマンド層。`root.go` (`NewRootCmd`)、`install.go`、`uninstall.go` などユーザ向け CLI。フラグ解釈と引数から action への橋渡し。
- `pkg/action/`: 各サブコマンドのビジネスロジック (Install / Upgrade / Rollback / Uninstall / List / Pull / Push / Lint ほか)。`action.go` の `Configuration` が共有状態 (KubeClient, Releases storage, Capabilities, RESTClientGetter) を持つ。
- `pkg/engine/`: Go `text/template` ベースのチャートレンダラ。
- `pkg/chart/`: チャートのデータモデル (v2) と `internal/chart/v3`。
- `pkg/storage/` と `pkg/storage/driver/`: リリース状態の永続化層。driver は secret / configmap / memory / sql。
- `pkg/kube/`: Kubernetes クライアントラッパ (Build / Create / Update / Wait)。
- `pkg/registry/`、`pkg/getter/`、`pkg/downloader/`、`pkg/repo/`、`pkg/pusher/`: チャート配布 (OCI レジストリ含む) と取得。
- `pkg/provenance/`: 署名と検証 (OpenPGP provenance)。

リクエストの流れ (install): cobra コマンド → `action.Install.RunWithContext` → 値の合成とスキーマ検証 → `engine` でテンプレ描画 → `kube.Build` で manifest を Kubernetes オブジェクト化 → 衝突チェック → storage に Release 保存 → `performInstall` で実際に cluster へ apply。

設計判断 (非自明): Helm 3 以降、リリース状態 (Release オブジェクト) は Kubernetes Secret として in-cluster に保存するのがデフォルト。`pkg/action/action.go:675` の `case "secret", "secrets", "":` が `driver.NewSecrets(...)` を選ぶ。中身は base64+gzip エンコードした Release で (`pkg/storage/driver/util.go:38` `encodeRelease`、`gzip.BestCompression`)、Secret の `Type` は `helm.sh/release.v1` (`pkg/storage/driver/secrets.go:284`)。Helm 2 の Tiller (サーバサイド常駐) を捨て、状態を専用サーバではなく対象 namespace の Secret に置いた。driver は `HELM_DRIVER` で secret/configmap/memory/sql に差し替え可能 (`pkg/cmd/root.go:65`)。

## 内部実装の素材

代表オペレーション `helm install` を端から端まで追った。

1. CLI 入口。`pkg/cmd/install.go:132` `newInstallCmd` がコマンドを組み立て、`RunE` 内 `pkg/cmd/install.go:159` で `runInstall(args, client, valueOpts, out)` を呼ぶ。`runInstall` はチャート解決と値マージの後、`pkg/cmd/install.go:347` で `client.RunWithContext(ctx, chartRequested, vals)` を実行。

2. action 本体。`pkg/action/install.go:284` `func (i *Install) RunWithContext(...)`:

   - `pkg/action/install.go:296` `i.cfg.KubeClient.IsReachable()` で cluster 到達性チェック (dry-run でなければ)。
   - `pkg/action/install.go:308` `i.availableName()` でリリース名の妥当性と重複を確認。
   - `pkg/action/install.go:313` `chartutil.ProcessDependencies(chrt, vals)` で subchart 依存を解決。
   - `pkg/action/install.go:352` `i.cfg.getCapabilities()` で API バージョンと KubeVersion を取得。
   - `pkg/action/install.go:366` `util.ToRenderValuesWithSchemaValidation(...)` で最終 values を組み JSON Schema 検証。
   - `pkg/action/install.go:375` `i.createRelease(...)` で Release オブジェクト生成 (Revision=1)。
   - `pkg/action/install.go:378` `i.cfg.renderResources(...)` でテンプレ描画。hooks / manifest / NOTES を分離。
   - `pkg/action/install.go:391` `rel.SetStatus(rcommon.StatusPendingInstall, ...)`。
   - `pkg/action/install.go:394` `i.cfg.KubeClient.Build(...)` で manifest 文字列を Kubernetes ResourceList へ。
   - `pkg/action/install.go:415` `existingResourceConflict(...)` で既存リソースとの衝突を拒否 (install 固有の安全策。`--take-ownership` なら `requireAdoption`)。
   - `pkg/action/install.go:423` dry-run ならここで return。
   - `pkg/action/install.go:465` `i.cfg.Releases.Create(rel)` で storage に履歴保存。
   - `pkg/action/install.go:472` `i.performInstallCtx(ctx, rel, toBeAdopted, resources)` で実 apply。失敗時 `failRelease`。

3. レンダリング。`pkg/action/action.go:279` `renderResources(...)`:

   - `pkg/action/action.go:288` チャートの `KubeVersion` 制約を cluster と突き合わせ。
   - `pkg/action/action.go:300` cluster と話す場合は `engine.New(restConfig)`、それ以外は素の `engine.Engine`。`pkg/action/action.go:309` または `:315` で `e.RenderWithContext(ctx, ch, values)`。
   - `pkg/action/action.go:328` 描画結果から `NOTES.txt` を抜き出し別バッファへ。

4. テンプレエンジン。`pkg/engine/engine.go:82` `func (e Engine) Render(...)` → `pkg/engine/engine.go:285` `func (e Engine) render(tpls map[string]renderable)`。Go `text/template` を使い、`pkg/engine/engine.go:190` で `missingkey=error` / `missingkey=zero` を再注入 ([golang/go#43022](https://github.com/golang/go/issues/43022) の回避)。`recursionMaxNums = 1000` (`pkg/engine/engine.go` 内) で include 再帰を制限。

中核データ構造:

- `Release` (`pkg/release/v1/release.go:30`): デプロイ 1 回分。`Name` / `Info` / `Chart` / `Config` (上書き値) / `Manifest` (描画済み YAML) / `Hooks` / `Version` (revision) / `Namespace` / `ApplyMethod` ("ssa" か "csa")。ロールバックはこの revision を辿る。
- `Chart` (`pkg/chart/v2/chart.go:38`): `Metadata` (Chart.yaml) / `Lock` / `Templates` / `Values` (デフォルト値) / `Schema` (JSON Schema) / `Files` と非公開の `parent` `dependencies`。subchart はこの木構造。
- `Driver` interface (`pkg/storage/driver/driver.go:99`): `Creator` + `Updator` + `Deletor` + `Queryor` + `Name()` の合成。secret/configmap/memory/sql が実装。Release の保存先を抽象化。
- `renderable` (`pkg/engine/engine.go:137`): エンジン内部。`tpl` (テンプレ文字列) / `vals` / `basePath` (namespace prefix)。
- `Configuration` (`pkg/action/action.go`): action 層の共有コンテキスト。`KubeClient` / `Releases` (storage) / `Capabilities` / `RESTClientGetter` / `CustomTemplateFuncs` を保持。`getStorage` (`action.go:675` 付近) が `HELM_DRIVER` を見て driver を組む。

## 採用事例の素材

`ADOPTERS.md` (リポ内、CNCF 公式ドキュメントの一部) に記載の組織のみ:

- IBM、Microsoft、Oracle、New Relic、Percona、Samsung SDS、Octopus Deploy、Qovery、InfoCert、Intercept、Omnistrate、Softonic、Syself、SyncTune、Ville de Montreal

採用シグナル (数値、2026-06-22 時点 `gh` API):

- GitHub stars: 29,902 / forks: 7,670 / contributors: 371 (Link ヘッダ最終ページ) / 作成 2015-10-06
- CNCF 2025 サーベイで Kubernetes 利用者の約 75% が Helm を利用と報告される (出典: 比較記事群、sources 参照)。一次サーベイ原典は未確認なので二次出典扱い。

## 代替・エコシステム

- Kustomize: テンプレ無し。素の YAML に overlay/patch を重ねる。`kubectl apply -k` で kubectl 内蔵。パッケージ配布モデルを持たない。出典: [IBM Kustomize vs Helm](https://www.ibm.com/think/insights/kustomize-vs-helm)、[Spacelift](https://spacelift.io/blog/kustomize-vs-helm)
- Timoni: CUE をテンプレ言語に、配布は OCI artifact、apply は server-side + Flux drift detection。digest 参照で不変性、Cosign 署名。まだ early。出典: [Timoni comparison](https://timoni.sh/comparison/)、[Introducing Timoni](https://medium.com/@stefanprodan/introducing-timoni-next-gen-package-manager-for-kubernetes-29df39683000)
- kapp / Carvel、Helmfile (複数リリースのオーケストレーション) も隣接。出典: [Glasskube top 13](https://dev.to/glasskube/our-top-13-deployment-templating-tools-for-kubernetes-4mei)
- 本質的な差: Helm はチャートという versioned かつ distributable なパッケージ単位 + Go template + provenance 署名 + OCI 配布 (3.8 以降) でエコシステム支配 (Artifact Hub に 1 万超のチャート)。多くの OSS が一次インストール手段として Helm チャートを公開する点が他ツールにない強み。弱点は Go template の可読性とレンダ後 YAML の検証性。Helm 4 で server-side apply をネイティブ化し、Timoni などが突いていた差を一部埋めた。
- 統合先: Argo CD / Flux などの GitOps コントローラが Helm チャートを first-class でレンダと同期。OCI レジストリ (ECR / GAR / GHCR / Docker Hub) を配布バックエンドに使える。

## install と最小構成

- 取得: macOS は `brew install helm`、Linux はインストールスクリプトかバイナリ配布 (`README.md:38` 付近)。公式は [installation guide](https://helm.sh/docs/intro/install/)。
- 前提: kubeconfig で到達可能な Kubernetes クラスタ (install 系は `IsReachable()` を要求。`pkg/action/install.go:296`)。
- 最小動作例: `helm repo add <name> <url>` でリポジトリ登録 → `helm install <release> <name>/<chart>` でデプロイ → `helm list` で確認 → `helm uninstall <release>`。OCI なら `helm install <release> oci://<registry>/<chart> --version <ver>`。
- 状態確認: `kubectl get secret -l owner=helm` でリリース Secret (`helm.sh/release.v1`) が namespace に作られているのが見える。

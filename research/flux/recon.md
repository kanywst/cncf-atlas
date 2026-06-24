# recon: flux

調査メモ。Flux (CNCF Graduated, GitOps)。`flux2` リポジトリは CLI + bootstrap が本体で、実際のリコンサイルはクラスタ内の GitOps Toolkit コントローラ群が担う。出典は URL と `file:line` で残す。

## 基本情報

- repo: `fluxcd/flux2` (<https://github.com/fluxcd/flux2>)
- pinned commit: `65d975b490d1284cd1f341d0980e38c84d3aa6a9` (main, 2026-06-19) / 近いタグ: `v2.8.8` (2026-05-20 リリース。HEAD はその先の main)
- 言語 / ビルド: Go (`go 1.26.0`, `go.mod` 冒頭) / `make build` = `CGO_ENABLED=0 go build -ldflags="-s -w -X main.VERSION=..." -o ./bin/flux ./cmd/flux` (`Makefile:57-58`)
- ライセンス: Apache-2.0 (`LICENSE:1-3` で本文確認、`gh` の SPDX も `Apache-2.0`)
- main entrypoint: `cmd/flux/main.go` (`rootCmd` は `:43`、`func main()` は `:191`、`rootCmd.Execute()` は `:204`)
- CNCF 成熟度: Graduated (2022-11-30 グラジュエート、後述の出典で確認)
- カテゴリ (バケット): App Definition & GitOps

### リポジトリ構成 (トップレベル)

- `cmd/flux/` : Cobra ベースの CLI 全サブコマンド (`bootstrap` / `create` / `get` / `reconcile` / `build` など)。Go ファイル計 258 (テスト除く)。
- `pkg/bootstrap/` : bootstrap のオーケストレーション本体 (`bootstrap.go`, `bootstrap_plain_git.go`, `bootstrap_provider.go`, `provider/`)。
- `pkg/manifestgen/` : install / sync / sourcesecret / kustomization のマニフェスト生成。
- `internal/build/` : `flux build kustomization` のローカルビルド + サーバ側との diff。
- `internal/{flags,tree,utils}` : CLI フラグ型、依存ツリー描画、kube クライアント/apply ヘルパ。
- `pkg/{log,printers,status,uninstall}` : ロガー、出力フォーマット、ヘルスチェック、アンインストール。
- `manifests/`, `install/`, `action/`, `rfcs/`, `tests/`, `docs/` : 埋め込みマニフェスト素材、GitHub Action、RFC、E2E。

GitOps Toolkit のコントローラは別リポジトリで、`flux2` は `go.mod` でそれらの `api` モジュールに依存する (`go.mod`: `kustomize-controller/api v1.9.0`, `helm-controller/api v1.6.0`, `source-controller`, `notification-controller/api v1.8.4`, `image-reflector-controller/api`, `image-automation-controller/api`)。デフォルトインストール対象は `source-controller, kustomize-controller, helm-controller, notification-controller`、追加で `image-reflector-controller, image-automation-controller, source-watcher` (`pkg/manifestgen/install/options.go:46-47`)。

## 歴史の素材

- 2016: Weaveworks 社内で Flux 誕生。GitOps という語を作ったのも同社。([Platform9 history](https://platform9.com/blog/an-introduction-to-flux-part-1-history-and-features/))
- 2017-01-27: v0.1.0 公開。([Platform9 history](https://platform9.com/blog/an-introduction-to-flux-part-1-history-and-features/))
- 2019-07-15: CNCF Sandbox 受理。([CNCF graduation announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/))
- 2020-04〜05: モノリシックな v1 を controller-runtime + CRD で全面再設計する決定、Flux v2 プロジェクト発足、v1 はメンテナンスモードへ。分割されたコンポーネント群が GitOps Toolkit。([Platform9 history](https://platform9.com/blog/an-introduction-to-flux-part-1-history-and-features/))
- 2021-03-12: CNCF Incubating へ昇格。v2 が multi-tenancy / 任意数の Git リポジトリ同期などを実装。([CNCF graduation announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/))
- 2022-11-30: CNCF Graduated。Argo CD と同時グラジュエート。([CNCF graduation announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/), [Flux blog](https://fluxcd.io/blog/2022/11/flux-is-a-cncf-graduated-project/))
- 2023-07: Flux v2 が GA。2023-11 に 2 度目のセキュリティ監査を CVE ゼロで完了。([CNCF blog: What is Flux CD](https://www.cncf.io/blog/2023/09/15/what-is-flux-cd/))

`fluxcd/flux2` リポジトリ自体は 2020-04-24 作成 (v2 再設計のタイミングと一致、`gh api repos/fluxcd/flux2 .created_at`)。

## アーキテクチャの素材

二層構造。(1) `flux` CLI = day-0 のブートストラップとマニフェスト生成。(2) クラスタ内 GitOps Toolkit コントローラ = 継続リコンサイル。CLI が一度ブートストラップすると、以後の運用は Git への commit に集約され、CLI は必須ではなくなる。

代表操作の end-to-end トレース: `flux bootstrap github`。

1. `bootstrapGitHubCmdRun` (`cmd/flux/bootstrap_github.go:109`) が `GITHUB_TOKEN` を読み (`:115`)、kube クライアントを作り、`install.Options` (`:193`)、`sourcesecret.Options` (`:216`)、`sync.Options` (`:238`) を組み立てる。GitHub provider クライアント (`provider.BuildGitProvider`, `:170`) と gogit クライアント (`:182`) を生成し、`bootstrap.NewGitProviderBootstrapper` (`:296`) でブートストラッパを作る。
2. `bootstrap.Run` (`pkg/bootstrap/bootstrap.go:98`) が順に呼ぶ。`ReconcileRepository` (provider 実装のときだけ、リモートに Git リポジトリを作る) → `ReconcileComponents` → `ReconcileSourceSecret` → `ReconcileSyncConfig` → 各種 `Report*Health`。
3. `ReconcileComponents` (`pkg/bootstrap/bootstrap_plain_git.go:119`):
    - リポジトリを clone (`:121-151`、`retry(1, 2s, ...)` で 1 回リトライ)。
    - `install.Generate(options, manifestsBase)` で `gotk-components.yaml` を生成 (`:155`、実体 `pkg/manifestgen/install/install.go:40`)。
    - 生成ファイルを stage して commit (`:179`、メッセージ `Add Flux <version> component manifests`)。署名は `resolveSigner` (`:162`、GPG/SSH 対応)。
    - 変更があれば push (`:190`)。`git.ErrNoStagedFiles` のときは "up to date" 扱い (`:193-195`)。
    - `mustInstallManifests` (`pkg/bootstrap/bootstrap.go:140`) が true のときだけ命令的に `utils.Apply` でクラスタへ適用 (`:198-215`)。初回判定は flux-system Kustomization の `Status.LastAppliedRevision == ""`。
4. `ReconcileSyncConfig` は `sync.Generate` (`pkg/manifestgen/sync/sync.go:36`) で `gotk-sync.yaml` を生成。中身は `GitRepository` (`:52`) と、それを `sourceRef` に持つ `Kustomization` (`:82`、`spec.path` = `TargetPath`) の 2 オブジェクト。名前は両方 `flux-system` (`pkg/manifestgen/sync/options.go:44-47`)。これを commit/push する。
5. 適用後、`objectReconciled` (`bootstrap.go:222`) でポーリングしヘルスを待つ。`hasRevision` (`bootstrap.go:268`) が Source 系は `status.artifact.revision`、Kustomization は `status.lastAttemptedRevision` を見て期待リビジョン一致を確認する (`sourcev1b2.TransformLegacyRevision` でレガシー形式を正規化)。

埋め込みマニフェスト: CLI は `//go:embed manifests/*.yaml` でバージョン付きマニフェストを同梱 (`cmd/flux/manifests.embed.go:27-28`)。ネットワーク無しでも base を組める。`install.Generate` 側は不足時に GitHub Releases の `manifests.tar.gz` を fetch するフォールバックも持つ (`pkg/manifestgen/install/manifests.go:35` 付近の `fetch`)。

## 内部実装の素材

中核データ構造。

1. `install.Options` (`pkg/manifestgen/install/options.go:21`): インストールするコンポーネント、namespace (`flux-system`)、registry (`ghcr.io/fluxcd`)、watch 範囲、NetworkPolicy、`ManifestFile` (`gotk-components.yaml`) などインストール全体の入力。デフォルトは `MakeDefaultOptions` (同ファイル)。
2. `sync.Options` (`pkg/manifestgen/sync/options.go`): `Interval` / `URL` / `Branch` / `Tag` / `SemVer` / `Commit` / `Secret` / `TargetPath` / `SparseCheckout` など、自己同期する GitRepository + Kustomization の入力。
3. `sourcesecret.Options`: Git/OCI 認証 secret の生成入力 (SSH 鍵アルゴリズム、token 認証、CA、known_hosts)。`bootstrap_github.go:216-235` で token 認証か deploy key かを分岐。
4. `provider.Config` + `GitProviderBootstrapper` (`pkg/bootstrap/provider/`, `pkg/bootstrap/bootstrap_provider.go`): GitHub/GitLab/Gitea/BitBucket のリモートリポジトリ作成・deploy key 登録・team 権限付与を抽象化 (`go-git-providers` ベース)。
5. `Reconciler` インタフェース (`pkg/bootstrap/bootstrap.go:56-81`): `ReconcileComponents` / `ReconcileSourceSecret` / `ReconcileSyncConfig` / `Report*Health`。`PlainGitBootstrapper` と `GitProviderBootstrapper` が実装し、`Run` は型アサーションで `RepositoryReconciler` / `ReconcilerWithSyncCheck` の有無を見て分岐する (`:103`, `:120`)。

非自明な設計判断: Flux は「自分自身を GitOps 管理下に置く」。bootstrap は自分のコントローラ・マニフェスト (`gotk-components.yaml`) と、同じリポジトリ/パスを指す `GitRepository` + `Kustomization` (`gotk-sync.yaml`、名前 `flux-system`) を Git に commit する。初回だけ `mustInstallManifests` ゲート (`bootstrap.go:140-150`) で命令的 apply するが、それ以降はクラスタ内の kustomize-controller が Git から Flux 自身のコンポーネントを継続リコンサイルする。つまりアップグレードは「新しい `gotk-components.yaml` を commit するだけ」で完了し、`flux bootstrap` の再実行も CLI も day-1 以降は不要。`mustInstallManifests` が `LastAppliedRevision == ""` を初回判定に使うのがこの自己ブートストラップの肝。

## 採用事例の素材

CNCF グラジュエーション発表で名指しされた利用者・プロバイダ ([CNCF announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/)): Volvo (Volvo Cars), SAP, RingCentral が利用、AWS / D2iQ / Microsoft / Red Hat / VMware / Weaveworks が Flux を自社の顧客向け GitOps 提供に採用。

公式 ADOPTERS ページ ([fluxcd.io/adopters](https://fluxcd.io/adopters/)) に自己申告で掲載されている組織 (抜粋): Cisco, Grafana Labs, Kong, Maersk, Cookpad, BlaBlaCar, Sonatype, UiPath, Replicated, Giant Swarm, Scaleway, Infomaniak, Orange, MediaMarktSaturn, Pets at Home, Tchibo, Tietoevry, Trifork, TrueLayer, Volvo Cars, SAP SE, RingCentral, J.B. Hunt, University of Bordeaux, Virginia Tech, William & Mary。捏造はしない。これ以上の組織はページ参照。

## 代替・エコシステム

- 直接の代替は Argo CD (同じく CNCF Graduated、2022-11-30 同時グラジュエート)。本質的な差: Argo CD はハブ&スポーク型の中央コントロールプレーン + 一級の `Application` 抽象 + リッチな Web UI。Flux は各クラスタ内で自律動作する分散エージェント型 + 専用コントローラ群 (source/kustomize/helm/notification) + CLI ファースト。Helm の扱いも違い、Argo CD は `helm template` でマニフェスト化、Flux は `HelmRelease` CRD で Helm を一級のデリバリ機構として扱う。Secrets は Flux が SOPS をネイティブ統合。フットプリントが軽くエッジ/制約環境や強いマルチテナンシ向けという評価。([Northflank comparison](https://northflank.com/blog/flux-vs-argo-cd))
- エコシステム/統合: Kustomize, Helm, OCI アーティファクト + Cosign 署名検証, HashiCorp Vault, SOPS, Flagger (プログレッシブデリバリの姉妹プロジェクト), Weave GitOps (OSS Web UI), Terraform/Crossplane との併用, 各クラウドのマネージド提供 (EKS/AKS など)。([CNCF: What is Flux CD](https://www.cncf.io/blog/2023/09/15/what-is-flux-cd/))
- インストール / 最小構成: CLI を入れて (`brew install fluxcd/tap/flux` など) `flux check --pre` でクラスタ前提を確認、`export GITHUB_TOKEN=...` のうえ `flux bootstrap github --owner=<org> --repository=<repo> --path=clusters/my-cluster` を実行すると、リポジトリ作成・`flux-system` への controller インストール・自己同期 `Kustomization` 作成まで一気通貫で完了する (`cmd/flux/bootstrap_github.go:39-69` の Example、デフォルト `--interval=1m`)。

## 採用シグナル (数値)

- GitHub `fluxcd/flux2`: stars 8,208 / forks 765 / watchers 68 / contributors 約 210 (anon 含むページネーション最終 page=210) — 2026-06-22 時点、`gh api repos/fluxcd/flux2`。
- 最新リリース: `v2.8.8` (2026-05-20)。
- CNCF Incubator 在籍中 (2021-03〜2022-11) にユーザベース・統合・利用・コントリビューションが 200-500% 成長と CNCF 発表。([CNCF announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/))

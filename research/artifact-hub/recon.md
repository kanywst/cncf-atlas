# recon: Artifact Hub

調査メモ。出典は URL と `path:line` を必ず添える。捏造しない。

## 基本情報

- repo: `artifacthub/hub` (<https://github.com/artifacthub/hub>)
- pinned commit: `0d8b1c0b9f6b660a815e5481059ce900cd245588` (author date 2026-05-12) / 近いタグ: `v1.22.0` (2025-10-21 リリース)。HEAD は v1.22.0 より後の `master` 上にある。shallow clone のため正確な「タグからの距離」は取れない。タグ付き直近リリースは v1.22.0。
- 言語 / ビルド: バックエンドは Go (`go 1.26.1`、`go.mod:3`)。`hub` / `tracker` / `scanner` / `ah` の 4 バイナリ。フロントは TypeScript + React 19 (`web/package.json:22`、`widget/`)。データ層は PostgreSQL の PL/pgSQL 関数群。ビルドは `go build` と Docker (`scripts/docker-build.sh`)、フロントは yarn、配備は Helm chart (`charts/artifact-hub`)。Makefile は無い。
- ライセンス: Apache-2.0。`LICENSE` に標準 Apache 2.0 本文を確認。`gh repo view` の `licenseInfo.key` も `apache-2.0`。
- CNCF 成熟度: Incubating。Sandbox 受理 2020-06-25、TOC が Incubating 化を可決したのが 2024-05-30、CNCF 公式アナウンスが 2024-09-17。
- カテゴリ (指定どおり厳密に): App Definition & GitOps
- メイン entrypoint: `cmd/hub/main.go`(HTTP API サーバ本体)。他に `cmd/tracker/main.go`、`cmd/scanner/main.go`、`cmd/ah/ah.go`(CLI)。

## 歴史の素材

- 起源は 2019 年 KubeCon + CloudNativeCon NA(San Diego)。CNCF 初代 ED の Dan Kohn が「cloud native アーティファクトの発見性が悪い」問題で関係者を集めた。Helm Hub(現在 deprecated)や汎用検索に頼っていた体験を改善するのが狙い。maintainer Matt Farina のコメントが CNCF ブログに残る。出典: <https://www.cncf.io/blog/2024/09/17/artifact-hub-becomes-a-cncf-incubating-project/>
- リポジトリ作成は 2020-01-14(`gh repo view` の `createdAt`)。CNCF Sandbox 受理 2020-06-25。
- 2024-05-30 に TOC が Incubating を可決、2024-09-17 に公式アナウンス。当初は Helm 中心に近かったが、対象を広げて「あらゆる CNCF アーティファクトのインデックス」へミッション拡大したうえで Incubating 入りした。出典: <https://www.cncf.io/projects/artifact-hub/>、<https://thenewstack.io/cncf-artifact-hub-a-one-stop-shop-for-cloud-native-config/>
- 設計思想: アーティファクト自体はホストせず索引のみ。検索・フィルタ・ブラウズを提供し、リンクは元ソースへ返す。出典: 上記 The New Stack 記事、`README.md:11`。

## アーキテクチャの素材

`docs/architecture.md` が層構造を明記している。内側から外へサービスを提供する 5 層。

- Database 層: PostgreSQL。スキーマと「API として振る舞う関数群」を migration(Tern)で管理。`database/migrations/functions/` 配下。
- Internal APIs 層: Go の各 Manager(`internal/repo`, `internal/pkg`, `internal/org`, `internal/user` ...)。DB 関数を呼び、上位に高レベル Go API を出す。
- Backend applications 層: `hub` / `tracker` / `scanner` の 3 バイナリ。
- Web / widget 層: React SPA。`hub` の HTTP API を叩く。
- CLI: `ah`(`docs/cli.md`)。`ah lint` でリポジトリメタデータを検証(`cmd/ah/lint.go`)。

出典: `docs/architecture.md:1-60`。

`cmd/hub/main.go` の構成(`cmd/hub/main.go:35-161`):

- `util.SetupDB`(`cmd/hub/main.go:48`)で pgx プール、`authz.NewAuthorizer`(`cmd/hub/main.go:56`、OPA ベースの認可)。
- `handlers.Services`(`cmd/hub/main.go:65-79`)に全 Manager を注入。`OrganizationManager` / `UserManager` / `RepositoryManager` / `PackageManager` / `SubscriptionManager` / `WebhookManager` / `APIKeyManager` / `StatsManager` / `ImageStore`(画像は Postgres 格納、`img/pg`)/ `OCIPuller` 等。
- ルータ `h.Router`(`cmd/hub/main.go:91`)で HTTP サーバ。`/metrics` を別ポートで Prometheus 公開(`cmd/hub/main.go:101-113`)。
- 3 つの常駐ゴルーチン: views tracker flusher(`cmd/hub/main.go:118`)、events dispatcher(`cmd/hub/main.go:128-130`)、notifications dispatcher(`cmd/hub/main.go:143-145`)。通知は subscription + webhook を引いてメール / webhook 配信。

`scanner` は Trivy をライブラリとして使い、コンテナイメージの脆弱性レポートを生成する(`internal/scanner/alerts.go:10` で `github.com/aquasecurity/trivy/pkg/types` を import、`BuildAlertDigest` 等)。

## 内部実装の素材

### 代表的な中核オペレーション: リポジトリの tracking(end to end)

1. `cmd/tracker/main.go:93` `tracker.GetRepositories` で登録済みリポジトリを取得。`tracker.concurrency`(既定 1、`cmd/tracker/main.go:147`)で制限しつつリポジトリごとに goroutine(`cmd/tracker/main.go:100-138`)。`tracker.repositoryTimeout`(既定 15 分、`cmd/tracker/main.go:148`)で打ち切り。起動時に外部ツール `opm` の存在を必須チェック(`cmd/tracker/main.go:53`)。
2. `cmd/tracker/main.go:125` `tracker.New(svc, r, logger)` → `cmd/tracker/main.go:126` `t.Run()`。
3. `internal/tracker/tracker.go:34` `Run()`:
   - `internal/tracker/tracker.go:36` `Rm.GetRemoteDigest` でリモート digest 取得。`internal/tracker/tracker.go:41-43` 前回と同じなら何もせず return(`bypassDigestCheck` で無効化可)。これが「変更がなければ処理しない」最適化。
   - `internal/tracker/tracker.go:50` `cloneRepository()`。kind ごとに clone するかが分岐(`internal/tracker/tracker.go:171-217`)。Helm / Container / Kagent は clone せず index.yaml や OCI tags を直接読む。OLM の OCI は `OLMOCIExporter` で export。それ以外の git ベース kind は `Cloner.CloneRepository`。
   - `internal/tracker/tracker.go:64` `Rm.GetPackagesDigest` で「既に登録済みパッケージ」の digest map を取得。
   - `internal/tracker/tracker.go:86` `SetupTrackerSource(i)`(= `internal/tracker/helpers.go:92` `SetupSource`)。kind → 具体 source 実装の dispatch。Helm/Kagent→`helm`、Krew→`krew`、OLM→`olm`、Tekton→`tekton`、Container→`container`、その他多数→`generic`(`internal/tracker/helpers.go:94-138`)。
   - `internal/tracker/tracker.go:87` `source.GetPackagesAvailable()` で利用可能パッケージ一覧。
4. Helm source(`internal/tracker/source/helm/helm.go:119` `GetPackagesAvailable`):
   - `internal/tracker/source/helm/helm.go:124` `getCharts()`(`internal/tracker/source/helm/helm.go:170`)。`http(s)` は `HelmIndexLoader.LoadIndex` で index.yaml をロードし digest 照合(`helm.go:177-183`)。`oci` は `tg.Tags` でタグ列挙(`helm.go:191-212`)。
   - chart version ごとに goroutine + limiter(`helm.go:128-163`)で `preparePackage`(`internal/tracker/source/helm/helm.go:221`)。`hub.Package` を組み立て、未登録 or digest 変化時のみ chart アーカイブを取得して readme / license 等で enrich(`helm.go:259-268`)。map のキーは `pkg.BuildKey(p)`(`helm.go:159`)。
5. tracker.go 側の登録ループ(`internal/tracker/tracker.go:93-125`):
   - `internal/tracker/tracker.go:103` 既登録かつ digest 不変ならスキップ。
   - `internal/tracker/tracker.go:108` `shouldIgnorePackage`(repo メタデータの ignore ルール)。
   - `internal/tracker/tracker.go:113-118` category が Unknown なら ML 分類器 `Pcc.Predict(p)` で推定。`SkipCategoryPrediction` は Unknown 固定。
   - `internal/tracker/tracker.go:122` `Pm.Register(ctx, p)`。
   - `internal/tracker/tracker.go:128-152` 利用可能側に無くなった登録済みパッケージは unregister(`PackagesDeletionProtection` が無い場合)。
   - `internal/tracker/tracker.go:155` `setVerifiedPublisherFlag`、`internal/tracker/tracker.go:160-164` リポジトリ digest 更新。
6. `internal/pkg/manager.go:243` `Register`: 名前 / version(Container 以外は semver 必須、`internal/pkg/manager.go:259-265`)/ ContentURL / repository_id(UUID)/ maintainers / channels / capabilities を Go 側で検証。最後に `internal/pkg/manager.go:313` で `json.Marshal(pkg)` し `internal/pkg/manager.go:317` `db.Exec(ctx, registerPkgDBQ, pkgJSON)`。
7. `registerPkgDBQ = select register_package($1::jsonb)`(`internal/pkg/manager.go:43`)。実体は `database/migrations/functions/packages/register_package.sql`。PL/pgSQL がパッケージ実体の upsert、version snapshot 登録、maintainers の作成 / 更新 / 削除、tsdoc 用配列の組み立てまで担う。

### 中核データ構造(3-5)

- `hub.Package`(`internal/hub/pkg.go:65-118`): 巨大な集約構造体。注目は `hash:"ignore"` タグ。`SetAutoGeneratedDigest`(`internal/hub/pkg.go:121-133`)が `hashstructure` でこの構造体をハッシュし digest を生成。ignore タグ付きフィールド(`PackageID`、`Stats`、`SecurityReportSummary` 等の派生情報)を digest 計算から除外し、不要な再登録を防ぐ。
- `hub.Repository`(`internal/hub/repo.go:290-315`): repository_id / kind / url / branch / digest / 認証情報 / `VerifiedPublisher` / `Official` / `CNCF` / `PackagesDeletionProtection` など。tracker が回す単位。
- `RepositoryKind` 定数群(`internal/hub/repo.go:50` 以降): Helm=0, Falco=1, OPA=2, OLM=3 ... と整数値固定。現在 20 種類超。README は Argo templates / Backstage / Bootc / Container / CoreDNS / Falco / Gatekeeper / Headlamp / Helm / Helm plugin / Inspektor Gadget / Kagent / KCL / KEDA / Keptn / Knative / KubeArmor / Krew / Kubewarden / Kyverno / Meshery / OLM / OpenCost / OPA / Radius / Tekton(task/pipeline/stepaction)/ Tinkerbell を列挙。`docs/*_repositories.md` に kind ごとの仕様がある。
- `hub.TrackerSource` インタフェース(`internal/hub/tracker.go:37-45`): メソッドは `GetPackagesAvailable() (map[string]*Package, error)` の 1 つだけ。kind ごとの取得ロジックを差し替える戦略パターンの軸。`TrackerSourceInput`(`internal/hub/tracker.go:49-55`)で repo / digest / 既登録 map / BasePath / 各種 svc を渡す。
- `PackageCategory`(`internal/hub/pkg.go:136-149`): ML 分類のラベル。ai-machine-learning / database / integration-delivery / monitoring-logging / networking / security / storage / streaming-messaging の 8 種 + Unknown/Skip。

### 非自明な設計判断

ビジネスロジックの相当部分を PostgreSQL の PL/pgSQL 関数に置いている。Go 側は `hub.Package` を JSON 化して `select register_package($1::jsonb)` に渡すだけ(`internal/pkg/manager.go:43,317`)。検索 / 取得も DB が JSON を組み立てて返す方式で、`SearchJSON`(`internal/pkg/manager.go:323`)は `search_packages($1::jsonb)`、`getPkgDBQ` は `get_package($1::jsonb)`(`internal/pkg/manager.go:30,44`)。`docs/architecture.md` が明言するとおり、DB 関数が「外側の層に対する API」として働き、スキーマ詳細を隠蔽する。利点はクエリ最適化と JSON 整形を DB に寄せられる点、欠点はロジックが SQL に散ること。

もう一つは tracking 時の ML カテゴリ推定。`cmd/tracker/main.go:75` で Keras の saved_model(`ml/category/model/saved_model.pb`)を読む `PackageCategoryClassifierML` を生成し、カテゴリ未設定パッケージに対し `internal/tracker/tracker.go:115` で推論する。学習データは `ml/category/data/csv`、学習スクリプトは `ml/category/category.py`。

## 採用事例の素材

- 公開インスタンス <https://artifacthub.io> は CNCF が運用。Helm チャートをはじめ多数の CNCF プロジェクトのアーティファクトを索引している。出典: `README.md:11,47`、<https://www.cncf.io/projects/artifact-hub/>
- メンテナは CNCF と SUSE のエンジニアを中心としたコミュニティ(CNCF ブログ時点で 41 名の community volunteers)。出典: <https://www.cncf.io/blog/2024/09/17/artifact-hub-becomes-a-cncf-incubating-project/>
- リポジトリに `ADOPTERS` ファイルは見当たらず、引用できる個別導入企業名は確認できなかった。捏造はしない。README が「official ステータス」の例として Consul(HashiCorp)や Google を挙げるが、これは説明用の例であり adopter ではない。
- GitHub 指標(`gh`、参照 2026-06-24): stars 2,048 / forks 302 / 名前付き contributor 48 名 / 作成 2020-01-14 / 最終 push 2026-06-23。

## 代替・エコシステム

- 前身: Helm Hub(deprecated)。Artifact Hub はその後継かつ多 kind 化。
- OperatorHub.io / OperatorHub(OLM オペレータ専用): Artifact Hub は OLM も 1 kind として包含するが、対象が広い。
- Harbor / JFrog Artifactory / OCI レジストリ / Docker Hub: これらはアーティファクトを「ホスト」する。Artifact Hub は「索引のみ」でホストしない点が本質的な差(`README.md`、The New Stack 記事)。
- 統合 / エコシステム: Helm / OLM / Tekton / Krew / Kyverno / OPA / Gatekeeper / KEDA / Falco / Backstage / Meshery / Keptn / Radius / KCL など 20 種以上の kind を直接サポート(`docs/*_repositories.md`、`internal/tracker/source/`)。脆弱性スキャンに Trivy、署名検証に cosign / OCI signature(`internal/oci`、`internal/scanner`)。認可に OPA(`internal/authz`)。
- 自己ホスト: `charts/artifact-hub` の Helm chart が推奨手段(`README.md:75`、`docs/architecture.md`)。

## 最小動作セットアップ(install)

- マネージド利用: <https://artifacthub.io> をそのまま使う。リポジトリ登録はサインイン後の control panel から(`docs/repositories.md`)。
- 自己ホスト(Kubernetes、推奨):

  ```bash
  helm repo add artifact-hub https://artifacthub.github.io/helm-charts
  helm install artifact-hub artifact-hub/artifact-hub
  ```

  PostgreSQL が前提。chart の `db-migrator` Job が Tern migration を自動適用する(`docs/architecture.md`、`charts/artifact-hub/templates/db_migrator_install_job.yaml`)。
- CLI: `ah`(`docs/cli.md`)。`ah lint` で公開前にリポジトリメタデータを検証。

## タグライン

- EN: An open, CNCF-hosted index to find, install, and publish Cloud Native packages across more than two dozen artifact kinds.
- JA: Helm チャートから OLM、Tekton まで 20 種類超の Cloud Native アーティファクトを横断で発見・導入・公開できる、CNCF 運営のオープンなインデックス。

# recon: Buildpacks (Cloud Native Buildpacks)

調査メモ。CNCF プロジェクト名は "Buildpacks" / "Cloud Native Buildpacks" (CNB)。OSS 組織は GitHub `buildpacks`。ディープダイブが扱う一次実装リポは CLI の `buildpacks/pack`。実際にビルドを駆動する参照実装は `buildpacks/lifecycle`、契約は `buildpacks/spec`。本 recon は `pack` のコードを pin commit で読んだ結果。

## 基本情報

- repo: `buildpacks/pack` (一次実装の CLI)。関連: `buildpacks/lifecycle` (lifecycle 参照実装), `buildpacks/spec` (仕様), `buildpacks/rfcs` (RFC)
- pinned commit: `2df3b8c3b0955ea41aec010783ddfe70cbc17c56` / タグ: `v0.40.7` (HEAD = タグそのもの)
- 言語 / ビルド: Go (`module github.com/buildpacks/pack`, `go.mod`) / `make build` (出力 `out/pack`)、テストは `make unit` + `make acceptance`
- ライセンス: Apache-2.0 (リポ `LICENSE` 冒頭で確認、`gh` の `license.spdx_id` も `Apache-2.0`)
- CNCF 成熟度: Incubating (2018-10 Sandbox 受理 → 2020-11-18 TOC が Incubation 承認。Graduated には未到達)
- カテゴリ (指定値をそのまま使用): App Definition & GitOps
- main entrypoint: `main.go:15` `func main()` → `cmd.NewPackCommand(logger)` (`main.go:19`)。cobra ルートコマンド。SoftError なら exit 2、それ以外 exit 1 (`main.go:27-30`)

規模 (pin commit, `find` で計測): プロダクションコードの Go ファイル数 `internal/` 168, `pkg/` 85, `cmd/` 2。contributors 約 164 (`gh api .../contributors?anon=true` の last page、2026-06-24)。

## 歴史の素材

- 2011: Heroku が PaaS 向けに buildpack を発明 (言語自動検出 + ビルド、Dockerfile 不要)。出典 3, 4。
- 2012: Heroku が Buildpack API を OSS 化し Heroku 固有要素を除去。以降 Cloud Foundry / Pivotal, Google App Engine, GitLab, Deis, Dokku などが独自に派生 → API が分裂し、同じ言語の buildpack を実装ごとに二重メンテする問題が発生。出典 3, 4。
- 2018-01: Pivotal と Heroku が共同で Cloud Native Buildpacks プロジェクトを立ち上げ。分裂した buildpack エコシステムを platform-to-buildpack contract で再統一するのが目的。OCI イメージフォーマット採用、レジストリの cross-repo blob mount、レイヤ rebase といったモダンなコンテナ標準を前提にした点が旧 v2 との差。出典 1, 3。
- 2018-10: CNCF Sandbox に Apache-2.0 で受理。出典 1。
- 2020-11-18: CNCF TOC が Sandbox → Incubation 昇格を承認。承認理由として 15+ の本番ユーザ、複数組織からの committer、オープンガバナンス策定を挙げている。出典 1。
- 2024-2025: Heroku が次世代基盤 "Fir" で CNB を全面採用 (Fir 世代の全アプリがデフォルトで CNB)。旧 Cedar 世代は classic buildpack。出典 5, 6。

## アーキテクチャの素材

CNB は 3 層に分かれる。`pack` (本リポ、開発者向け CLI / プラットフォーム実装) → `lifecycle` (detect/analyze/restore/build/export を実行するバイナリ群、別リポの参照実装) → 個々の buildpack (言語・フレームワーク固有のビルドロジック)。`pack` 自身はビルドを直接行わず、builder イメージと lifecycle イメージをコンテナとして起動して lifecycle を駆動する「プラットフォーム」実装である。

トップレベル構成 (pin commit):

- `cmd/` — cobra ルートコマンド組み立て (`cmd/cmd.go`)。
- `internal/commands/` — 各サブコマンド (`build.go`, `builder_create.go`, `buildpack_*` など) のフラグ定義と入力検証。CLI 層。
- `pkg/client/` — 公開 API 層。`Client.Build` (`pkg/client/build.go:308`) が `pack build` のオーケストレーション本体。`create_builder.go`, `inspect_*`, `manifest_*` も同層。
- `internal/build/` — lifecycle 実行エンジン。`LifecycleExecutor` / `LifecycleExecution` がフェーズをコンテナとして起動。
- `pkg/dist/` — buildpack / builder のディスクメタデータ型 (`Order`, `ModuleInfo`, `Target`)。
- `pkg/image`, `pkg/cache`, `pkg/blob`, `internal/builder`, `internal/container` — イメージ取得・キャッシュ・builder 表現・Docker コンテナ操作。

代表操作 `pack build <image>` のエンドツーエンドのトレース (path:line):

1. CLI 入口 `internal/commands/build.go:70` `func Build(...)`。`RunE` (`:83`) で image 参照パース、`project.toml` 読み込み (`:91`)、builder 解決 (`:100-110`)、trust 判定 (`:120-134`)、pull policy / lifecycle image / uid/gid / creation-time のパース。
2. `internal/commands/build.go:177` `packClient.Build(ctx, client.BuildOptions{...})` を呼ぶ。フラグを `BuildOptions` に詰め替える層。`TrustBuilder` は `func(string) bool` のクロージャ (`:191`) で渡す点に注意。
3. `pkg/client/build.go:308` `func (c *Client) Build`。app path / builder name / platform target を正規化 (`:323-367`)。buildpack の order 解決 `processBuildpacks` (`:436`)。ephemeral builder 生成 `createEphemeralBuilder` (`:568`)。`build.LifecycleOptions` 組み立て (`:637`)。trusted builder のときは `UseCreator = true` をセット (`:679`)。
4. `pkg/client/build.go:834` `c.lifecycleExecutor.Execute(ctx, lifecycleOpts)`。
5. `internal/build/lifecycle_executor.go:118` `Execute` が tmpDir を作り `NewLifecycleExecution` (`:124`) → `lifecycleExec.Run(ctx, NewDefaultPhaseFactory)` (`:131`)。
6. `internal/build/lifecycle_execution.go:170` `Run`。build cache / launch cache を解決 (`:173-209`)、ephemeral bridge ネットワークを作成 (`:211-238`)。ここで二分岐 (下記の設計判断)。各フェーズ (`Detect` `:482`, `Analyze` `:623`, `Restore` `:520`, `Build` `:773`, `Export` `:843`) は `NewPhaseConfigProvider` でコンテナ設定を組み (例 `Detect` `:490-509`)、`phaseFactory.New(...).Run(ctx)` でコンテナを起動する。

非自明な設計判断: trust の有無でコンテナ実行モデルが変わる。

- builder が trusted (`UseCreator = true`): lifecycle の `creator` バイナリを単一コンテナで実行 (`lifecycle_execution.go:349` `l.Create(...)`)。速いがコンテナ内で root 権限を持つフェーズも同居する。
- builder が untrusted: detect / analyze / restore / build / export を別々のコンテナに分け、root が要るフェーズだけを使い捨ての信頼コンテナで走らせ、それ以外は CNB ユーザに降格して実行 (`lifecycle_execution.go:240-343`)。`build.go:130-134` のデバッグログがこの意図 (信頼境界の分離) を明示している。

もう一つの非自明点: Platform API のバージョンで analyze と detect の順序が入れ替わる。`< 0.7` は DETECT → ANALYZE (`lifecycle_execution.go:241-250`)、`>= 0.7` は ANALYZE → DETECT (`:251-261`)。`pack` は Platform API 0.3〜0.15 を `SupportedPlatformAPIVersions` (`lifecycle_executor.go:24-38`) でサポートし、builder/lifecycle が宣言する API と突き合わせて使用バージョンを決める (`NewLifecycleExecution` `lifecycle_execution.go:48-54`)。image extension (Dockerfile による build/run イメージ拡張) は API 0.10+ で kaniko キャッシュを使い `ExtendBuild` / `ExtendRun` として errgroup で並行実行 (`:319-340`)。

## 内部実装の素材

中核データ構造 (path:line):

- `BuildOptions` (`pkg/client/build.go:85`) — `pack build` の全入力。Image / Builder (どちらも必須)、AppPath、Buildpacks、Extensions、Publish、PullPolicy、TrustBuilder クロージャ、Cache 設定など。CLI 層と client 層の境界契約。
- `LifecycleOptions` (`internal/build/lifecycle_executor.go:72`) — lifecycle 実行の全パラメータ。`UseCreator` / `UseCreatorWithExtensions` (trust 分岐)、`LifecycleImage`、`Cache cache.CacheOpts`、`Network`、uid/gid、`CreationTime` 等。`BuildOptions` から `build.go:637` で組まれる。
- `LifecycleExecution` (`internal/build/lifecycle_execution.go:35`) — 1 回のビルド実行の状態。`platformAPI`、`layersVolume` / `appVolume` (ランダム名のボリューム)、`mountPaths`、`opts`、`tmpDir`。フェーズ群のレシーバ。
- `dist.Order` / `dist.OrderEntry` / `dist.ModuleRef` (`pkg/dist/dist.go:41-59`) — buildpack の検出順序グループ。`Order = []OrderEntry`、`OrderEntry.Group = []ModuleRef`、`ModuleRef` は `ModuleInfo` + `Optional bool`。detect フェーズがこの順序を解決して採用 buildpack を決める。
- `builder.Builder` (`internal/builder/builder.go:71`) — builder イメージのインメモリ表現。`order` / `orderExtensions` (`dist.Order`)、`lifecycleDescriptor`、`additionalBuildpacks` / `additionalExtensions` (`buildpack.ManagedCollection`)、`uid/gid`、`StackID`、`system`。ephemeral builder 生成時にここへ buildpack を足してから保存する。

追う価値のあるパス: `Run` の二分岐 (`lifecycle_execution.go:240-349`) と `Detect` のコンテナ組み立て (`:482-514`)。`Detect` では `EnsureVolumeAccess` と `CopyDir` (uid/gid 指定で app をボリュームへコピー) を `WithContainerOperations` で前段に挟み、extension があるときは `analyzed.toml` と `generated/` を post-container で `CopyOutToMaybe` で吸い出す (`:504-507`)。コンテナ起動は `internal/build/phase.go` の `Phase.Run`。

驚いた点:

- `pack` は「ビルドツール」ではなく lifecycle を回す「プラットフォーム」。実ビルドロジックは別リポ (`buildpacks/lifecycle`) のバイナリで、`pack` は builder/lifecycle イメージをコンテナとして orchestrate しているだけ。`internal/build/lifecycle_executor.go` が `github.com/buildpacks/lifecycle/api` と `lifecycle/platform/files` をインポート (`:9-11`) しているのは、自分でビルドするのではなく lifecycle との契約 (Platform API / ファイルフォーマット) を共有するため。
- ビルドごとに ephemeral な bridge ネットワーク (`pack.local-network-<rand>`) と layers/app ボリュームを使い捨てで作る (`:217`)。クリーンアップは defer + リトライ (`:224-232`)。
- trusted builder の警告ロジックが security-sensitive。コンテナ内 root とボリュームマウントの組み合わせを警告 (`internal/commands/build.go:136-138`)。

## 採用事例の素材 (出典付きのみ)

- Heroku (Salesforce): 次世代プラットフォーム "Fir" が CNB を全面採用、Fir 世代アプリはデフォルトで CNB。Heroku は専任メンテナチームを CNB に投資。出典 5, 6。
- DigitalOcean App Platform: ビルド方式として CNB を採用 (Dockerfile が無ければ言語検出して buildpack でビルド)。Heroku からの移行パスとして CNB を位置づけ。出典 7。
- CNCF 昇格時 (2020) の本番ユーザとして Greenhouse, Salesforce, VMware を明記。OSS 統合として Cloud Foundry on K8s, Google Skaffold, HashiCorp Waypoint, kpack。商用として DigitalOcean App Platform, Google Cloud, VMware。出典 1。
- Paketo Buildpacks: CNB 仕様準拠の主要 buildpack 群 + builder (`paketobuildpacks/builder-jammy-base` 等)。出典 8。

数値シグナル (2026-06-24, `gh api`): `buildpacks/pack` stars 2,939 / forks 345 / open issues 169 / 作成 2018-06-25。contributors 約 164。出典 9。

## 代替・エコシステム

エコシステム / 統合:

- `buildpacks/lifecycle` (参照実装), `buildpacks/spec` (Buildpack / Platform / Distribution / Image Extension API), `buildpacks/rfcs` (設計プロセス)。出典 9, 10, 13。
- buildpack 提供元: Paketo Buildpacks, Heroku CNB, Google Cloud buildpacks。builder/stack は `paketobuildpacks/builder-jammy-*` 等。出典 8。
- Kubernetes 連携: kpack (CRD で CNB lifecycle を駆動), Tekton 連携 (`buildpacks/tekton-integration`), GitHub Actions (`buildpacks/github-actions`)。出典 1, 9。
- プラットフォーム統合: Heroku Fir, DigitalOcean App Platform, Google Cloud。出典 5, 6, 7。

代替と本質的な差:

- Dockerfile + BuildKit / Docker: 最も汎用だが、ベースイメージのパッチ・レイヤ最適化・SBOM を自前で書く必要。CNB は buildpack が言語検出と依存解決を担い、rebase でベースだけ差し替え可能 (Dockerfile 不要)。
- Google Jib: JVM 特化、Docker デーモン不要でレイヤ化イメージを生成。CNB は多言語で builder/stack を共有する汎用契約。
- ko: Go 専用の高速イメージビルダ。CNB は言語非依存。
- kaniko: Dockerfile をクラスタ内でデーモンレスにビルド。CNB は Dockerfile を書かない (image extension で内部的に kaniko を使うのは別話)。
- OpenShift Source-to-Image (s2i): 思想は近い (ソース → イメージ) が Red Hat / OpenShift 寄りで、OCI 標準・rebase・分散 buildpack エコシステムの面で CNB が広い。
- nixpacks (Railway): 自動検出してイメージ生成という UX は近いが Nix ベースで CNCF 仕様ではない。

差の核心: CNB は「ベンダ中立な platform-to-buildpack 契約 + OCI レイヤ rebase」。OS パッチを run image の rebase だけで全アプリに反映でき、Dockerfile を書かず多言語を同一 builder で扱える点が他にない。出典 1, 3。

## 導入・最小動作セットアップ

前提: Docker が動いていること (`pack build` はローカル Docker デーモンにイメージを生成)。出典 8, 12。

- インストール (macOS / Homebrew): `brew install buildpacks/tap/pack`。出典 8。
- 最小ビルド (Paketo builder): `pack build my-app --builder paketobuildpacks/builder-jammy-base` をアプリのソースディレクトリで実行 → `docker run -d -p 8080:8080 -e PORT=8080 my-app`。出典 8。
- 公式チュートリアル (sample builder): `pack build sample-app --path samples/apps/java-maven --builder cnbs/sample-builder:resolute`、`pack config default-builder <builder>` で既定 builder を設定、`pack builder suggest` で候補表示。出典 12。

## タグライン

- EN: Turn application source code into production-ready OCI images without writing a Dockerfile.
- JA: Dockerfile を書かずに、アプリのソースコードを本番向け OCI イメージへ変換する。

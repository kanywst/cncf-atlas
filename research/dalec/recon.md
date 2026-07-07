# recon: Dalec

調査メモ。自分用の密度。出典は URL を添える。アクセス日は 2026-06-26。

## 基本情報

- repo: `project-dalec/dalec`（旧 `Azure/dalec`。GitHub は 301 で `project-dalec` にリダイレクト、`go.mod` の module も `github.com/project-dalec/dalec`）
- pinned commit: `0d888c2e779bcbc61901e8855bed1a7aeb6c104d`（2026-06-26、main HEAD）/ 近いタグ: `v0.21.2`（`a1c95f7`、2026-06-25 リリース。pinned はその数コミット先）
- 言語 / ビルド: Go（`go 1.25.9`、`go.mod:3`）。成果物は BuildKit フロントエンドのコンテナイメージ。エントリポイントは `cmd/frontend/main.go`
- ライセンス: Apache-2.0（`LICENSE` 冒頭 "Apache License Version 2.0"、GitHub API も `spdx_id: Apache-2.0`。verify 済み）
- CNCF 成熟度: Sandbox（2025-10-08 採択。提案 issue は cncf/sandbox #396）
- カテゴリ: Supply Chain

## Dalec とは（一行定義）

LLB（Low-Level Build、BuildKit の中間表現グラフ）を出力する Docker BuildKit フロントエンド。1 枚の宣言的 YAML（spec）から、ソース取得 → ビルド → ネイティブ Linux パッケージ（RPM/DEB）生成 → テスト → 最小コンテナ生成までを実行する。`docker build` 以外のツールは不要。

## 歴史の素材

- Microsoft の Azure Upstream チーム発。Azure 内部のコンプライアンス要件（パッケージ署名・SBOM・provenance を伴う再現可能ビルド）を満たすために使われている。Microsoft 自身は Dalec を製品として提供していない（AKS が upstream Kubernetes の downstream であるのと同じ位置づけ、と提案に記載）。出典: Microsoft Community Hub ブログ、cncf/sandbox #396。
- リポジトリ作成は 2023-06-08（GitHub API `created_at`）。
- CNCF Sandbox 提案: 2025-07-18 に Riya Choudary（@riyac12）が Microsoft Azure Upstream チームを代表して起票（cncf/sandbox #396）。スポンサー連絡先 `bburns@microsoft.com`。サポーターに Jeremy Rickard（TOC member）、Lachie Evenson（GB member）、Bridget Kromhout。
- CNCF 採択: 2025-10-08、Sandbox レベル（cncf.io/projects/dalec）。issue ラベルは `gitvote/passed`。
- 採択後に `Azure/dalec` から `project-dalec/dalec` 組織へ移管（リダイレクト・module 名・MAINTAINERS.md の "Project Dalec" 表記から確認）。
- KubeCon NA 2025 / EU 2026 の Microsoft open source ブログで Dalec が CNCF プロジェクトとして言及。

## アーキテクチャの素材

トップレベル構成（`find . -name '*.go'` のディレクトリ分布より）:

- リポジトリルート（`package dalec`）: spec のデータモデルと共通ロジック。`spec.go`、`load.go`、`source*.go`、`artifacts.go`、`tests.go`、各 generator（`generator_gomod.go` ほか）。
- `cmd/frontend/`: フロントエンドのバイナリ本体。`main.go` が BuildKit gateway クライアントとして起動。
- `frontend/`: ルーター（`router.go`）、ビルドリクエスト処理、ターゲットフォワーディング、署名（`MaybeSign`）。
- `targets/`: ディストロ別ハンドラ。`targets/linux/rpm/distro`（azlinux/almalinux/rockylinux）、`targets/linux/deb/distro`（debian/ubuntu）、`targets/windows`、`targets/plugin`（外部フロントエンド連携）。
- `packaging/linux/rpm`・`packaging/linux/deb`: spec → 実際の `.spec` / `debian/` への変換と rpmbuild/dpkg 実行（LLB 組み立て）。

リクエストの流れ（azlinux3/container を例に）:

1. `docker build` が spec 1 行目の `# syntax=ghcr.io/project-dalec/dalec/frontend:latest` を見て Dalec フロントエンドイメージを pull・実行（`docs/examples/hello.inline.yml:1`）。
2. `cmd/frontend/main.go:99` `grpcclient.RunFromEnvironment` でハンドラを起動。`dalecMain`（`main.go:90`）が `frontendapi.NewRouter`（`main.go:92`）でルーターを構築し、`r.Handler(frontend.WithTargetForwardingHandler)` を呼ぶ（`main.go:96`）。
3. `frontend/router.go:119` `Router.Handle` が `client.BuildOpts().Opts` から `target` を取り出し（`router.go:120-121`）、サブリクエスト（target 一覧 API 等）を処理（`router.go:140`）した後、`lookupTarget`（`router.go:148`）でルートを引き当て、`route.Handler` を呼ぶ（`router.go:158`）。
4. ルートは各ディストロ Config の `Routes` が登録する。RPM の場合 `targets/linux/rpm/distro/distro.go:93` `Config.Routes` が `prefix`（例 `azlinux3`）/`prefix+"/rpm"`/`prefix+"/container"` などを返す。`/container` のハンドラは `linux.HandleContainer(cfg)`（`distro.go:124-125`）。

設計判断（非自明・1 つ）:

- ルーターは「フラットなルートテーブル」。`Router.routes` は `map[string]Route` で、キーは `azlinux3/container` のような完全修飾パス（`frontend/router.go:73-75`）。コメントに「階層的な BuildMux を、より単純なディスパッチモデルに置き換えた」とある（`router.go:71-72`）。さらに `Add` は同一 `FullPath` を上書きでき（`router.go:79-85`）、これを使って `WithTargetForwardingHandler`（`router.go:399`）が spec 内 `frontend:` で指定された外部フロントエンドのルートでビルトインを上書きする。プラグイン的拡張をルート上書きで実現している点が読みどころ。

## 内部実装の素材

中核データ構造（3〜5 個）:

1. `Spec`（`spec.go:20`）: spec YAML 全体のルート。`Name`/`Version`/`Revision`（`spec.go:22,29,32`）、`License`（`spec.go:75`）、`Sources map[string]Source`（`spec.go:56`）、`Patches map[string][]PatchSpec`（`spec.go:63`）、`Build ArtifactBuild`（`spec.go:66`）、`Artifacts`（`spec.go:82`）、`Targets map[string]Target`（`spec.go:85`）、`Dependencies *PackageDependencies`（`spec.go:89`）、`Image *ImageConfig`（`spec.go:95`）、`Tests []*TestSpec`（`spec.go:103`）を持つ。
2. `Source`（`source.go:31`）: ソースの埋め込み union。`DockerImage`/`Git`/`HTTP`/`Context`/`Build`/`Inline`/`LLB` のうち厳密に 1 つだけ非 nil（`source.go:36-42`、コメント "Exactly one must be non-nil"）。`Path`/`Includes`/`Excludes`（`source.go:46,50,52`）でフィルタ、`Generate []*SourceGenerator`（`source.go:65`）で gomod/cargohome/pip キャッシュ生成。`UnmarshalYAML`（`source.go:70`）で YAML ノードから sourceMap を保持。
3. `Router` / `Route`（`frontend/router.go:73`, `49`）: ディスパッチの中核。`Route.FullPath`（`router.go:51`）/`Handler gwclient.BuildFunc`（`router.go:54`）/`Info Target`（`router.go:57`）/`Forward *Forward`（`router.go:61`）。
4. `distro.Config`（`targets/linux/rpm/distro/distro.go:14`）: ディストロ 1 個分の設定。`FullName`/`ImageRef`（`distro.go:15-16`）、`ReleaseVer`（`distro.go:20`）、`BuilderPackages`（`distro.go:23`）、`BasePackages []dalec.Spec`（`distro.go:26`）、`InstallFunc PackageInstaller`（`distro.go:31`）、`CacheName`/`CacheDir`（`distro.go:35,41`）。azlinux/almalinux/rockylinux はこの Config を値で構成する。
5. RPM spec テンプレート `specTmpl`（`packaging/linux/rpm/template.go:23`）: `text/template`。`Name`/`Version`/`Release`/`License`/`Summary`（`template.go:25-29`）と `%description`/`PrepareSources`/`BuildSteps`/`Install`/`Post`/`Files`/`Changelog`（`template.go:44-54`）を生成。

代表的な 1 オペレーションを端から端まで（azlinux3/container = spec → RPM → 最小コンテナ）:

1. ルートのハンドラ `linux.HandleContainer(cfg)`（`distro.go:125`）が最終的に `Config.BuildContainer` を呼ぶ（`targets/linux/rpm/distro/container.go:17`）。
2. パッケージのビルドは `Config.BuildPkg`（`targets/linux/rpm/distro/pkg.go:47`）。worker イメージを用意しビルド依存を入れ（`pkg.go:50-51`）、`spec.Preprocess` で generator を実行（`pkg.go:54`）、`rpm.BuildRoot` で rpmbuild ツリーを作り（`pkg.go:58`）、`.spec` のパスを `SPECS/<name>/<name>.spec` に決定（`pkg.go:60`）、`rpm.Build` で rpmbuild を LLB として実行（`pkg.go:70`）。
3. `.spec` の中身は `packaging/linux/rpm/template.go:23` の `specTmpl` から生成される（spec → RPM スペックファイルへの変換の実体）。
4. 署名: `frontend.MaybeSign`（`pkg.go:72`）が spec の署名設定に応じて署名済み state を作り、`st.File(llb.Copy(signed, "/", "/"))` で未署名物に上書きマージ（`pkg.go:76`）。
5. コンテナ化: `BuildContainer`（`container.go:17`）が `spec.GetSingleBase(targetKey)` でベースイメージを決め（`container.go:23`）、install 時リポジトリ（`container.go:31-37`）をマウント、worker 上で `cfg.Install(pkgs, ...)` を実行して RPM を `/tmp/rootfs` にインストール（`container.go:68-74`）、`post.Symlinks` があれば `InstallPostSymlinks` を適用（`container.go:76-78`）し rootfs state を返す。
6. これら全ては即時実行ではなく LLB グラフの組み立て。BuildKit が並列・キャッシュ付きで solve する。

ビルド/エントリポイント補足:

- `cmd/frontend/main.go:34` `main`。引数なしなら `dalecMain`（`main.go:90`）でフロントエンド本体、引数ありなら `lookupCmd`（`main.go:64`）で内部サブコマンド（plugin set 経由、`internal/commands` を blank import: `main.go:22`）。
- panic recover をルーターのトップで実装（`router.go:91-97`）。

## 採用事例の素材

- 実在ソースで名指しできる外部 adopter は確認できず。リポジトリに `ADOPTERS.md` は存在しない（GitHub API 404）。
- 提供元の利用: Microsoft / Azure の内部チームがコンプライアンス目的で使用（Microsoft Community Hub ブログ、cncf/sandbox #396 提案）。ベンダーセルフユースのため「第三者 adopter」としては弱い。
- GitHub シグナル（2026-06-26 時点、GitHub API）: stars 310、forks 54、contributors 約 38、open issues 95、watchers/subscribers 12。最新リリース v0.21.2（2026-06-25）。リリースは v0.21 系まで活発。
- メンテナは全員 Microsoft（`MAINTAINERS.md`: Brian Goff @cpuguy83、Jeremy Rickard @jrrickard、Peter Engelbert @pmengelbert。Emeritus に Sertac Ozercan @sozercan）。単一ベンダー支配。

## ガバナンス / ライセンス素材

- `GOVERNANCE.md` あり（"Dalec Project Governance"）。Values / Maintainers / Becoming a Maintainer / Meetings / CNCF Resources / Security Response Team / Voting / Modifications を定義。
- DCO（Developer Certificate of Origin）必須。`git commit -s` 必要、CNCF の `dco-2` GitHub App が PR ごとに強制（README）。
- CNCF Code of Conduct 採用。OpenSSF Best Practices（project 10703）と OpenSSF Scorecard バッジを掲示（README）。
- 「Dalec a Series of LF Projects, LLC」として確立（README 末尾の著作権表記）。

## 代替・エコシステム

- BuildKit フロントエンド機構が前提（`moby/buildkit`）。spec → LLB → BuildKit solve。Docker のみで動く点が最大の差別化。
- nfpm: ビルド済み成果物から DEB/RPM/APK を組むだけ。Dalec は「ソースからビルド + パッケージ + テスト + コンテナ + 署名/SBOM/provenance」まで含む点が違う。
- GoReleaser: リリースオーケストレータ。内部で nfpm/BuildKit を呼ぶ。スコープが「リリース自動化」で、ネイティブ distro パッケージのソースビルドは主目的でない。
- 素の Dockerfile / Buildx Bake: 汎用イメージビルド。RPM spec / `debian/` / 自前スクリプトを書く必要があり、Dalec はそれを 1 枚の YAML に置換。
- OpenSUSE Build Service (OBS): ホスト型マルチディストロビルド基盤。Dalec はローカル/CI の Docker で完結するクライアント側フロントエンドという性格差。
- 隣接 CNCF: SBOM/provenance では in-toto / SLSA、署名では Notary Project / sigstore と組み合わせ可能。最小 CVE コンテナという文脈で Copa（copacetic、同じ Microsoft 系）とも近い。

## 出典

- Microsoft Community Hub: <https://techcommunity.microsoft.com/blog/linuxandopensourceblog/dalec-declarative-package-and-container-builds/4465290>
- cncf/sandbox #396: <https://github.com/cncf/sandbox/issues/396>
- CNCF project page: <https://www.cncf.io/projects/dalec/>
- repo README: <https://github.com/project-dalec/dalec/blob/main/README.md>
- Dalec docs: <https://project-dalec.github.io/dalec/>
- KubeCon NA 2025 MS blog: <https://opensource.microsoft.com/blog/2025/11/10/whats-new-with-microsoft-in-open-source-and-kubernetes-at-kubecon-north-america-2025/>

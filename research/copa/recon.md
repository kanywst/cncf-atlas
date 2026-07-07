# recon: copa (Copacetic)

調査メモ。出典は URL を添える。コードの主張は `file:line` で固定する。`src/` は `research/copa/src/` 配下のクローン。

## 基本情報

- repo: `project-copacetic/copacetic`
- pinned commit: `0f6f0ab2c3ee4590530a621094502047fad127cf` (2026-06-24) / 近いタグ: `v0.14.1` (2026-05-18 リリース、HEAD はその後のメイン)
- 言語 / ビルド: Go (`go 1.25.11`, `src/go.mod:3`) / `make build` (Makefile)。CLI エントリは `src/main.go:53` の `main()`。
- ライセンス: Apache License 2.0 (`src/LICENSE` 冒頭、`gh repo view` の `licenseInfo.key=apache-2.0` で確認)
- CNCF 成熟度: Sandbox (2023-09-19 受理。[CNCF projects/copa](https://www.cncf.io/projects/copa/))
- カテゴリ: Security & Compliance (CNCF Landscape の Provisioning > Security & Compliance に分類)

用語: BuildKit は Docker のビルドエンジン。LLB (Low-Level Build) は BuildKit が解く中間表現グラフ。VEX (Vulnerability Exploitability eXchange) は「この脆弱性が影響するか」を機械可読で示す文書。EOL (End Of Life) はサポート終了。Kubernetes の CRD のような要素はこのツールには無い (CLI 単体)。

## 何をするツールか

`copa` はコンテナイメージの脆弱パッケージを再ビルドなしで直接パッチする CLI。Trivy などのスキャナが出した脆弱性レポートを読み、修正版パッケージだけを取得して、BuildKit で既存イメージの上に追加レイヤーとして適用する (`src/README.md:38-42`)。設計三原則は「既存イメージをそのままパッチ」「既存のスキャナ/パッケージマネージャ エコシステムと協調」「イメージ発行者でなくても (DevSecOps が) パッチ可能」(`src/README.md:46-54`)。

## 歴史の素材

- 起源: Microsoft 発。Microsoft Open Source チームが維持。([Microsoft Open Source Blog, 2024-09-18](https://opensource.microsoft.com/blog/2024/09/18/project-copacetic-quick-and-efficient-container-image-patching/))
- repo 作成: 2023-01-11 (`gh repo view` の `createdAt`)。
- CNCF Sandbox 受理: 2023-09-19 (TOC 投票後のオンボーディング。[cncf/sandbox issue #152](https://github.com/cncf/sandbox/issues/152)、応募は [issue #41](https://github.com/cncf/sandbox/issues/41))。
- マイルストーン: 2024-09 に Docker Desktop Extension を発表しコマンドライン未経験者でも scan/tag/patch 可能に (Microsoft Blog 同上)。直近 `v0.14.x` で `--oci-dir` によるローカル OCI 出力、`--exit-on-eol` / `--eol-api-url` の EOL チェック、再パッチ時のレイヤー単一化を追加 (リリースノート群)。
- 名称: 旧称 Copacetic、CNCF 上は短縮名 Copa。repo は今も `copacetic`。

## アーキテクチャの素材

トップレベル (`src/` ディレクトリ、`src/CLAUDE.md` のレポジトリマップと突き合わせ済み):

- `pkg/cmd/`: Cobra コマンド配線とフラグ/検証 (`src/pkg/cmd/cmd.go`)。
- `pkg/patch/`: 単一アーキ/マルチプラットフォームのパッチ オーケストレーション (`patch.go`, `single.go`, `multi.go`, `core.go`)。
- `pkg/pkgmgr/`: OS パッケージマネージャ アダプタ (apk/dpkg/rpm/pacman)。
- `pkg/langmgr/`: 言語ライブラリ パッチ (実験的)。
- `pkg/report/`: 脆弱性レポート解析とスキャナ プラグイン interface (Trivy 内蔵)。
- `pkg/buildkit/`: BuildKit クライアント、ドライバ、プラットフォーム探索。
- `pkg/imageloader/`: Docker/Podman へのイメージ ロード。
- `pkg/frontend/` + `cmd/frontend/`: BuildKit フロントエンド経路 (`src/cmd/frontend/main.go:22`)。
- `pkg/vex/`: OpenVEX 出力。`pkg/bulk/`: 設定ファイルによる一括パッチ。`pkg/types/`: 共有 Options/エラー/API 型。

コマンドツリー: `main.go:42-43` の `newRootCmd` が `patch` (`cmd.NewPatchCmd`) と `generate` を登録。`patch` の RunE が `--config` 指定時は `bulk.PatchFromConfig`、それ以外は `patch.Patch` を呼ぶ (`src/pkg/cmd/cmd.go:120-133`)。`ErrNoUpdatesFound` は exit 0 扱い (`src/main.go:58-61`)。

## 代表的コア操作のトレース: `copa patch -i IMAGE -r report.json -t TAG` (単一アーキ)

1. CLI 入口。`NewPatchCmd` の RunE がフラグを `types.Options` に詰め、SIGINT/SIGTERM で cancel される context を作る (`src/pkg/cmd/cmd.go:71-72`)。レポートファイル指定の単一イメージなので `patch.Patch(ctx, opts)` (`src/pkg/cmd/cmd.go:133`)。
2. タイムアウト枠付与。`Patch` が `opts.Timeout` (既定 5m, `cmd.go:149`) で `context.WithTimeout` し、`patchWithContext` を goroutine で回して timeout/cancel を select で監視 (`src/pkg/patch/patch.go:41-79`)。
3. ルーティング。`patchWithContext` は report がファイルなら単一アーキ判定し `patchSingleArchImage` を呼ぶ (`src/pkg/patch/patch.go:194-204`)。report がディレクトリ、または report 無しでマルチプラットフォーム検出時は `patchMultiPlatformImage`。
4. レポート解析。`patchSingleArchImage` 内で `report.TryParseScanReport(reportFile, scanner, pkgTypes, libraryPatchLevel)` (`src/pkg/patch/single.go:121`)。scanner=="trivy" は内蔵 `TrivyParser`、それ以外は `copa-<scanner>` プラグイン バイナリを exec する (`src/pkg/report/report.go:33-37`, `52-55`)。結果は `unversioned.UpdateManifest`。pkg-types でフィルタし、OS/lang 両方 0 件なら `ErrNoUpdatesFound` を返す (`src/pkg/patch/single.go:149-153`)。
5. BuildKit クライアント生成と export 形式決定。`bkNewClient` (`single.go:160`)。OCI/Docker メディアタイプ判定 (`shouldExportAsOCI`, `single.go:173`)。同一タグ再利用による mutable-tag レースを避けるため、パッチ前に元マニフェストの annotation を取得 (`single.go:186-194`)。
6. ビルド実行。`executePatchBuild` が `bkClient.Build(...)` のコールバック内で `ExecutePatchCore` を呼ぶ (`src/pkg/patch/single.go:520-541`)。成功パッケージのみで `validatedManifest` を組み、VEX 文書を出力 (`single.go:553-587`)。
7. コア パッチ ロジック。`ExecutePatchCore` (`src/pkg/patch/core.go:91`):
   - `buildkit.InitializeBuildkitConfig` で対象イメージの LLB state を得る (`core.go:99`)。
   - OS 更新が無く lang 更新だけなら langOnlyMode (distroless/scratch の Go バイナリ等) で OS パッケージマネージャをスキップ (`core.go:108-117`)。
   - 通常は `setupPackageManager` で OS を判定し (`core.go:120`)、`manager.InstallUpdates(ctx, updates, ignoreError)` を呼ぶ (`core.go:127`)。
   - lang 更新があれば `langmgr.GetLanguageManagers` を順に適用 (`core.go:136-172`)。
   - 最終 state を `patchedImageState.Marshal(...)` し `c.Solve(...)` で解いて結果イメージ化 (`src/pkg/patch/core.go:209-219`)。設定を対象プラットフォーム向けに正規化して付与 (`core.go:226-231`)。
8. パッケージマネージャ選択。`setupPackageManager` が report の OS メタデータ (`Updates.Metadata.OS.Type/Version`) を使い `pkgmgr.GetPackageManager` で apk/dpkg/rpm/pacman を分岐 (`src/pkg/patch/core.go:304-311`, `src/pkg/pkgmgr/pkgmgr.go:37-74`)。OS メタデータ欠落はエラー (`core.go:308-310`)。
9. dpkg の実装。`(*dpkgManager).InstallUpdates` がツールイメージを解決し (`getAPTImageName`)、`probeDPKGStatus` で通常イメージか distroless かを判定 (`src/pkg/pkgmgr/dpkg.go:136-140`)。distroless は `unpackAndMergeUpdates`、通常イメージは `installUpdates` (`dpkg.go:175-185`)。最後に `validateDebianPackageVersions` で要求バージョン以上かを検証 (`dpkg.go:188`)。
10. ロード/プッシュ。`--push` 無しなら `loadImageToRuntime` でパイプ経由 Docker/Podman に load (`src/pkg/patch/single.go:257-259`, `392-415`)。push 時はレジストリへ。

## 内部実装の素材: 中核データ構造 (3-5)

- `types.Options` (`src/pkg/cmd/cmd.go:86-113` で構築、本体は `pkg/types`): CLI フラグを集約した全パッチ動作の入力。Image/Report/PatchedTag/Platforms/Push/PkgTypes/Progress/OCIDir/ExitOnEOL など。
- `unversioned.UpdateManifest` (`src/pkg/types/unversioned/types.go:10-16`): スキャナ非依存の「適用すべき更新」の正規形。`Metadata` (OS/Config/NodeVersion) + `OSUpdates` + `LangUpdates` + 内部 summary。スキャナ プラグインはこの形に変換する。
- `unversioned.UpdatePackage` (`src/pkg/types/unversioned/types.go:59-67`): 1 パッケージの更新指示。Name / InstalledVersion / FixedVersion / VulnerabilityID / Type / Class / PkgPath。
- `pkgmgr.PackageManager` interface (`src/pkg/pkgmgr/pkgmgr.go:32-35`): `InstallUpdates(ctx, *UpdateManifest, bool) (*llb.State, []string, error)` と `GetPackageType()`。OS ごとのアダプタの共通契約。返す `*llb.State` が BuildKit グラフ。
- `patch.Result` / `patch.Options` (`src/pkg/patch/core.go:23-63`): コア層の入出力。`Result` は BuildKit gateway result、PackageType、ErroredPackages、ValidatedUpdates、保存した `PatchedState`/`ConfigData` を持つ。

## 非自明な設計判断

distroless / パッケージマネージャ非搭載イメージのパッチ方法。対象イメージ内で `apt`/`apk` を実行できない (バイナリが無い) ため、Copa は対象 OS に一致する「ツールイメージ」(apt を持つ通常 Debian など) を別途解決し、そこで修正版 `.deb` をダウンロードして展開し、その成果物だけを対象イメージの filesystem にマージする。通常イメージの `installUpdates` に対し distroless は `unpackAndMergeUpdates` 経路 (`src/pkg/pkgmgr/dpkg.go:146-152`, `175-185`)。判定は `probeDPKGStatus` が dpkg status の形 (`status.d` 等) を見て行う (`src/pkg/pkgmgr/dpkg.go:199`)。これにより「対象イメージにシェルもパッケージマネージャも無い」状況でも OS パッチを成立させている。

もう一つ: OS パッケージ名はシェルコマンドへ補間されるため、`ValidateOSPackageNames` が正規表現とメタ文字チェックでサニタイズし、スキャナ由来の名前による command injection を防ぐ (`src/pkg/pkgmgr/pkgmgr.go:80-100`)。

## 採用事例の素材

公式 adopters ページに記載 ([Copacetic adopters](https://project-copacetic.github.io/copacetic/website/adopters)、2026-06-28 参照):

- CLI 採用: Kubescape (CNCF、Grype 連携でイメージをパッチ)、Devtron (CI/CD、Copacetic プラグイン)、Helmper (Helm チャート内イメージのパッチ)、Verity。
- GitHub Actions 採用: AKS Periscope、Azure Workload Identity、AI Kit、Unoplat。

捏造はしない。組織は上記 adopters ページ記載分のみ。

## 採用シグナル (数値)

- Stars: 1,652 / Forks: 120 (`gh repo view project-copacetic/copacetic`、2026-06-28)。
- Contributors: 約 48 名 (GitHub contributors API のページネーション last page、2026-06-28)。
- OpenSSF Best Practices バッジ (project 8031) と OpenSSF Scorecard バッジを掲示 (`src/README.md:5-6`)。

## 代替・エコシステム

- 統合スキャナ: Trivy (内蔵パーサ)。`copa-<scanner>` プラグインで Grype 等も連携可 (`src/pkg/report/report.go:52-55`)。
- 関連リポ: `project-copacetic/copa-action` (GitHub Action)、Docker Desktop Extension。
- 隣接/代替: 従来は「ベースイメージ更新を待って full rebuild」または Dockerfile で `apt upgrade` し再ビルド。Copa の差は (a) 既存イメージへ追加レイヤーのみ適用しレイヤーキャッシュを壊しにくい、(b) イメージ発行者でなくても DevSecOps がパッチできる、(c) スキャナのレポート駆動で対象パッケージだけ更新。Chainguard/Wolfi の「常に最新ベースで再ビルド」思想とは逆方向の延命アプローチ (`src/README.md:29-54`)。

## インストールと最小動作

前提: Docker か BuildKit、(レポート駆動時は) Trivy。

インストール (Homebrew):

```bash
brew install copa
```

ソースから:

```bash
git clone https://github.com/project-copacetic/copacetic
make -C copacetic build
```

最小ワークフロー (レポート駆動、ローカル Docker に load):

```bash
export IMAGE=docker.io/library/nginx:1.21.6
trivy image --vuln-type os --ignore-unfixed -f json -o nginx-report.json "$IMAGE"
copa patch -i "$IMAGE" -r nginx-report.json -t 1.21.6-patched
trivy image --vuln-type os --ignore-unfixed "${IMAGE%:*}:1.21.6-patched"
```

包括更新 (レポート無し、全 outdated パッケージ):

```bash
copa patch -i docker.io/library/nginx:1.21.6
```

出力: 既定で `-patched` サフィックスの新タグをローカルに作る (quick-start ドキュメント、2026-06-28 参照)。

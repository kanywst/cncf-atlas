# 内部実装

> コミット `0f6f0ab` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `pkg/cmd/` | Cobra のコマンド配線、フラグ解析、検証 (`src/pkg/cmd/cmd.go`) |
| `pkg/patch/` | パッチ オーケストレーション: `patch.go`, `single.go`, `multi.go`, `core.go` |
| `pkg/pkgmgr/` | OS パッケージマネージャ アダプタ: apk, dpkg, rpm, pacman |
| `pkg/langmgr/` | 言語ライブラリ/ツールチェーンのパッチ (実験的) |
| `pkg/report/` | レポート解析とスキャナ プラグイン インターフェース (Trivy 内蔵) |
| `pkg/buildkit/` | BuildKit クライアント、ドライバ選択、プラットフォーム探索 |
| `pkg/imageloader/` | 解いたイメージを Docker/Podman へロード |
| `pkg/frontend/`, `cmd/frontend/` | BuildKit フロントエンドの入口 (`src/cmd/frontend/main.go:22`) |
| `pkg/vex/`, `pkg/bulk/`, `pkg/types/` | OpenVEX 出力、設定ファイルによるバッチパッチ、共有の Options/エラー/API 型 |

## 中核データ構造

`types.Options` はパッチ操作全体の入力で、CLI フラグから `src/pkg/cmd/cmd.go:86-113` で構築される (型自体は `pkg/types`)。Image, Report, PatchedTag, Platforms, Push, PkgTypes, Progress, OCIDir, ExitOnEOL など、フラグ一式を保持する。

`unversioned.UpdateManifest` (`src/pkg/types/unversioned/types.go:10-16`) は「何を更新すべきか」のスキャナ非依存な正規形である。`Metadata` (OS, config, node version)、`OSUpdates`、`LangUpdates`、内部の summary を持つ。各スキャナ プラグインは自前のレポートをこの形へ変換する。これがパーサより下でスキャナに依存しない理由である。

`unversioned.UpdatePackage` (`src/pkg/types/unversioned/types.go:59-67`) は 1 パッケージの更新指示である。Name, InstalledVersion, FixedVersion, VulnerabilityID, Type, Class, PkgPath を持つ。

`pkgmgr.PackageManager` (`src/pkg/pkgmgr/pkgmgr.go:32-35`) は各 OS アダプタが満たす契約である。`InstallUpdates(ctx, *UpdateManifest, bool) (*llb.State, []string, error)` と `GetPackageType()`。返る `*llb.State` が修正をインストールする BuildKit グラフである。

`patch.Result` と `patch.Options` (`src/pkg/patch/core.go:23-63`) はコア層の入出力である。`Result` は BuildKit gateway result、パッケージ種別、エラーになったパッケージ、検証済み更新、保存したパッチ済み state と config data を持つ。

## 追う価値のあるパス

非自明なコードは、パッケージマネージャをイメージ内に持たない (distroless や scratch の) イメージを Copa がどうパッチするかである。`setupPackageManager` はレポートの OS メタデータを読んで正しいアダプタへ振り分け、メタデータが欠けていればエラーにする (`src/pkg/patch/core.go:304-311`)。Debian 系イメージなら dpkg アダプタに着地する。

`(*dpkgManager).InstallUpdates` は `apt` を持つツールイメージを解決し (`getAPTImageName`)、`probeDPKGStatus` を呼んで対象が通常イメージか distroless かを判定する (`src/pkg/pkgmgr/dpkg.go:136-140`)。この probe は dpkg status データの形 (例えば `status.d` ディレクトリ) を見て両者を区別する (`src/pkg/pkgmgr/dpkg.go:199`)。

```text
InstallUpdates
  getAPTImageName        -> apt を持つツールイメージを解決
  probeDPKGStatus        -> 通常イメージか distroless か?
    通常     -> installUpdates          (イメージ内で apt を実行)
    distroless-> unpackAndMergeUpdates   (ツールイメージで .deb を取得し成果物をマージ)
  validateDebianPackageVersions -> インストール済み >= 要求 を検証
```

通常イメージの場合、アダプタは `installUpdates` でパッケージマネージャをその場で実行する。distroless イメージの場合は `unpackAndMergeUpdates` 経路を取り、ツールイメージで修正済み `.deb` をダウンロードして展開し、その成果物だけを対象ファイルシステムにマージする。対象にはシェルもパッケージマネージャも無いためである (`src/pkg/pkgmgr/dpkg.go:146-152`, `src/pkg/pkgmgr/dpkg.go:175-185`)。最後に `validateDebianPackageVersions` が各インストール済みパッケージが要求バージョン以上かを検証する (`src/pkg/pkgmgr/dpkg.go:188`)。

## 読んで驚いた点

スキャナレポート由来のパッケージ名はシェルコマンドへ補間されるため、悪意ある名前や不正な名前が injection の攻撃面になる。`ValidateOSPackageNames` は各名前を正規表現とメタ文字チェックでサニタイズしてからコマンドに渡す (`src/pkg/pkgmgr/pkgmgr.go:80-100`)。信頼境界はスキャナの出力にあり、Copa はそれがクリーンだと仮定しない。

distroless 経路は通常の思考モデルを反転させる。パッチ対象のイメージ内では何も実行しない。apt の作業は別のツールイメージで行われ、対象は展開済みファイルだけを受け取る。これがシェルもパッケージマネージャも無いイメージのパッチを成立させている (`src/pkg/pkgmgr/dpkg.go:175-185`)。

適用可能な更新が 0 件になるレポートは失敗ではない。`patchSingleArchImage` は OS と言語の更新がともに空のとき `ErrNoUpdatesFound` を返し (`src/pkg/patch/single.go:149-153`)、`main` はそのエラーを exit code 0 に対応づける (`src/main.go:58-61`)。だからクリーンなイメージがパイプラインを壊すことはない。

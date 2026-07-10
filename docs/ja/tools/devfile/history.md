# 歴史

## 起源

devfile フォーマットは Eclipse Che の中で始まった。Che は Red Hat と Che コミュニティが Kubernetes 向けに作ったブラウザベースの IDE である。Che はワークスペース (開発者が必要とするコンテナ・ツール・コマンド) を記述する方法を必要としており、プロジェクトが自分の環境定義を持ち運べるようにしたかった。この最初のフォーマットが、今でいう devfile 1.0 である。

`devfile/api` リポジトリは 2019-12-05 に作成された (GitHub `created_at`)。その目的は 1.0 フォーマットとは異なる。クラスタが実行環境へと reconcile できる Kubernetes API `DevWorkspace` を定義することであった。devfile 2.0 フォーマットは、その API のサブセットとして設計され、ファイルフォーマットとクラスタリソースが同じ Go 型を共有するようになった。README はこの関係を直接記録している。ここで定義される devfile 2.0 の構造は `DevWorkspace` API のサブセットである (`README.md:26-28`)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | `devfile/api` リポジトリ作成 (2019-12-05)。Kubernetes ネイティブな `DevWorkspace` API の作業開始 |
| 2021 | `v2.0.0` リリース (2021-01-18)。続いて `v2.1.0` (2021-05) |
| 2022 | CNCF Sandbox 受理 (2022-01-11)。`v2.2.0` リリース (2022-10) |
| 2023 | `v2.2.1` (2023-10)、`v2.2.2` (2023-11) リリース |
| 2024 | `v2.3.0` リリース (2024-06)。リポジトリ現行のスキーマバージョン |

## どう進化したか

決定的な転換は、Che 固有のワークスペースファイル (1.0) から Kubernetes ネイティブな API (2.0) への移行だった。2.x の設計では仕様が Go コードを起点とする。CRD・JSON スキーマ・TypeScript モデルはすべて `pkg/apis/workspaces/v1alpha2/` の型から生成され、手書きされない (`README.md:11-24`)。旧 API バージョン `v1alpha1` もツリーに残っており、手書きの変換コード (`*_conversion.go` 群) が `v1alpha2` へ写像するため、CRD は複数の格納バージョンを出力する。

スコープも 1 つではなく複数リポジトリへと落ち着いた。`devfile/api` は仕様と、override・merge・union・validation のランタイムライブラリを持つ。パーサ本体 (`devfile.yaml` を読み、`parent` を解決し、レジストリから取得する処理) は `devfile/library` にある。関連リポジトリはレジストリ (`devfile/registry`、`devfile/registry-support`)、Kubernetes コントローラ (`devfile/devworkspace-operator`)、ソース検出 (`devfile/alizer`) をカバーする。ここでのディープダイブは `devfile/api` だけを読む。

pinned commit の時点で、リポジトリは JSON スキーマバージョン 2.3.0、Kubernetes API バージョン `v1alpha2` を宣言している (`schemas/latest/jsonSchemaVersion.txt`、`schemas/latest/k8sApiVersion.txt`)。

## 現在地

Devfile は CNCF Sandbox プロジェクトである (2022-01-11 受理。CNCF プロジェクトページ)。リリースは 2.0 以降おおむね年次で、2.3.0 が現行系列である。`MAINTAINERS.md` のメンテナ一覧は Red Hat と AWS の所属で構成され、これはプロジェクトの出自 (Red Hat の Che 開発) と AWS が CodeCatalyst でフォーマットを使ってきたことに符合する。掲げる方向性は当初の前提と一貫している。Go 型を単一の真実に保ち、消費可能な成果物はすべてそこから生成する。

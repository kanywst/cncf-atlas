# History

## 起源

Apicurio コミュニティは 2016 年、Red Hat がスポンサーする API デザインツール Apicurio Studio から始まった。Apicurio Registry は 2019 年に別プロジェクトとして開始し、API のデザインではなくランタイムでのスキーマ保存・バージョン管理に焦点を当てた（出典 6）。GitHub リポジトリは 2019-07-16 に作成された（出典 3）。最初の公開リリース `1.0.4.Final` と `1.1.0.Final` はともに 2020-02-03 にリリースされた（出典 7）。

## タイムライン

| 年 | マイルストーン |
| --- | --- |
| 2016 | Apicurio Studio（API デザインツール）が Apicurio コミュニティを始動（出典 6） |
| 2019 | Apicurio Registry が別プロジェクトとして開始、repo 作成 2019-07-16（出典 3, 出典 6） |
| 2020 | 最初の公開リリース `1.0.4.Final` と `1.1.0.Final`（出典 7） |
| 2021 | `2.0.0.Final` を 2021-04-16 にリリース（出典 7） |
| 2023 | CNCF Sandbox 申請を issue #72 として提出（出典 4） |
| 2024 | 3.0 系開始、最古の 3.0 マイルストーン `3.0.0.M3` が 2024-06-17（出典 7） |
| 2025 | `3.1.0`（2025-10-07）が Apicurio Studio のデザイン機能を opt-in で吸収（出典 6, 出典 7） |
| 2026 | `3.3.0`（2026-06-08）が実験的 GitOps ストレージを追加（出典 6, 出典 7） |

## どう進化したか

2024 年の 3.0 リリースが最大の再構成だった。それ以前はストレージバックエンドごとに別のコンテナイメージを出していた。3.0 はこれらを起動時にストレージ種別を選ぶ単一のデプロイ可能 artifact に統合し、REST API を再設計し、階層型ルールエンジンを導入した（出典 1）。README は単一 artifact モデルを明記する。「Starting with Apicurio Registry 3.0, we now produce a single artifact suitable for running any storage variant」（出典 1）。

`3.1.0` は旧 Apicurio Studio のデザイン編集機能を opt-in で registry に戻し、スタンドアロンの Studio を deprecated にした。AI agent artifact 対応も追加された（出典 6, 出典 7）。`3.3.0` は実験的 GitOps ストレージを追加し、Git リポジトリを source of truth にして registry をそれに対して read-only で動かす（出典 6, 出典 7）。

## 現状

プロジェクトは Semantic Versioning に従う。マイナーリリース（3.3.0, 3.4.0）は機能とバグ修正を含み、パッチリリースは CVE（Common Vulnerabilities and Exposures）とセキュリティ修正のみを含む（出典 1）。サポート対象は直近 2 つのマイナーバージョン（出典 1）。Apicurio Registry は 2024 年に CNCF Sandbox に受理され、Red Hat ダウンストリームビルドが存在するにもかかわらず `GOVERNANCE.md` は vendor-neutral 原則を明記する（出典 4）。後続の CNCF issue #461（2026-02）は Strimzi・CloudEvents・xRegistry とのより深いエコシステム統合を追っている（出典 5）。

# 歴史

## 起源

Chaosblade は Alibaba 社内の障害テスト/演習ツール「MonkeyKing」から生まれた。Alibaba 自身の説明によれば、その背後には約 10 年の故障注入実践があり、マイクロサービスの依存関係問題の検証から始まり、クラウド/クラウドネイティブ環境での定常状態検証へと広がった。プロジェクトは 2019 年に OSS 公開され、当初は 2 つのリポジトリ構成だった。Go の CLI と基本リソース/コンテナ executor を含む `chaosblade` と、JVM 用 executor の `chaosblade-exec-jvm` である。

掲げられた動機は、当時の chaos ツールが「シナリオが散在」「導入が難しい」「実験モデルの標準が無い」「拡張が困難」だったことにある。Chaosblade の答えは実験モデルを標準化し、シナリオを統一的に定義・共有・拡張できるようにすることだった。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | Alibaba が `chaosblade` (Go CLI) と `chaosblade-exec-jvm` を OSS 公開 |
| 2020 | v1.0.0-GA: Linux/Windows/Docker/Kubernetes 対応、Java/Golang/JavaScript/C++ カバー、`chaosblade-box` プラットフォーム追加 |
| 2021 | 2021-04-28 に CNCF Sandbox 入り |
| 2022 | `chaosblade-box` カオスエンジニアリングプラットフォームの新バージョンをリリース |
| 2026 | Python 製 `blade-ai/` エージェント層を追加。mainline は `v1.8.0`、AI 層は `blade-ai-v0.5.1` |

## どう進化したか

プロジェクトは単一ツールからプラットフォームへ移行した。Alibaba は、多クラスタ・多環境・多言語の chaos を管理する `chaosblade-box` を追加したと説明し、v1.0.0-GA 時点で 200+ シナリオ・3000+ パラメータをカバーしたと報告している。アーキテクチャは分割を保った。薄い CLI と、ビルドが clone してパッケージする executor 兄弟リポジトリ群 (`chaosblade-exec-os`、`chaosblade-exec-jvm`、`chaosblade-exec-cplus` 等) であり、新しい障害ドメインは CLI のリライトではなく新規 executor として追加される。

このコミット時点のソースには可視な変更が 2 つある。server コマンドモードは 2023-12-30 に無効化されており、CLI の初期化 (`cli/cmd/cmd.go:58`) のコメントに記録されている。そのため README には残っているものの、CLI は server サブコマンドを登録しない。また `blade-ai/` 配下に Python 製 AI エージェント層が追加された。これは平文の障害記述を受け取り、意図理解・安全審査・注入・検証・回復・レポートを行う orchestration として説明されている。

## 現在地

Chaosblade は引き続き CNCF Sandbox である。同カテゴリの Chaos Mesh と LitmusChaos は一段上の Incubating にある。2025 年の調査論文 (arXiv 2505.13654) は ChaosBlade を Sandbox かつ多数のリリースにわたり継続開発中と位置づけている。LFX Insights は単一 contributor への集中リスクを報告しており、直近の四半期では 1 人の contributor が活動の半分超を占めた。mainline のリリースは `v1.8.0`、新しい AI 層は別系列で `blade-ai-v0.5.1` (2026-06-23) である。Go モジュールは `go 1.25` を対象とする (`go.mod:17`)。

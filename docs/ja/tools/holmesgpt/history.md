# 歴史

## 起源

HolmesGPT は Kubernetes 監視 SaaS を販売する Robusta.Dev が作った。GitHub リポジトリの作成は 2024-05-30 である (GitHub `createdAt`)。README は起源を端的に述べている。「Originally created by Robusta.Dev, with major contributions from Microsoft」(README, `MAINTAINERS.md`)。狙う課題は、アラートが発火した瞬間にオンコール担当者が直面するもの、すなわち複数のツールからログ・メトリクス・リソース状態を集め、それらが何を意味するかを推論することだ。HolmesGPT はその収集と推論を、read-only なツールを駆動する言語モデルに委ねる。だからダッシュボードを人がめくらなくても調査が進む。

Microsoft は単なる利用者ではなく共同メンテナである。`MAINTAINERS.md` は Robusta 所属 10 名と Microsoft 所属 1 名 (Qingchuan Hao, `mainred`) を挙げている。CNCF の紹介記事も、Robusta 発でありクラウドネイティブ向けの agentic troubleshooting に Microsoft が共同メンテナとして関わる、という位置づけで説明している (CNCF ブログ, 2026-01-07)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2024 | Robusta.Dev が GitHub リポジトリを作成 (2024-05-30) |
| 2025 | CNCF に Sandbox として採択 (2025-10-08)。申請とオンボーディングは cncf/sandbox #392・#411 で追跡 |
| 2026 | CNCF 紹介ブログ (2026-01-07)。本書は `84cb39c`、リリース `0.35.0` (2026-07-01) の近傍で記述 |

## どう進化したか

大きな転換点は 2 つある。1 つ目は CNCF への参加だ。TOC は 2025-10-08 に HolmesGPT を Sandbox プロジェクトとして受理し、申請とオンボーディングは cncf/sandbox リポジトリで追跡された (issue #392・#411; CNCF プロジェクトページ)。続く CNCF 紹介ブログは、単機能の Kubernetes analyzer ではなく、クラウドネイティブ運用のために作られた agentic troubleshooting として位置づけた (CNCF ブログ, 2026-01-07)。

2 つ目はリポジトリの移管だ。プロジェクトは `robusta-dev/holmesgpt` から専用 org の `HolmesGPT/holmesgpt` に移り、現在はそこが canonical である。git remote は `https://github.com/HolmesGPT/holmesgpt.git` を返し、README の見出しも「HolmesGPT, The CNCF SRE Agent」になっている (README)。コードはそのまま移り、住所だけが CNCF の地位に合ったプロジェクト名の org に変わった。

ガバナンスと名称の変化に加え、掲げる方向性はインタラクティブな CLI から常駐の「Operator Mode」へと広がっている。README 冒頭は今、継続的に動いて問題を検知し、Slack に投稿し、修正を GitHub のプルリクエストとして出せるモードを前面に出している (README)。中核の調査ループはどちらのモードでも同じで、変わるのはいつ動くかと出力がどこへ行くかだ。

## 現在地

HolmesGPT は活発な CNCF Sandbox プロジェクトである。リリースは `pyproject.toml` の version フィールド (`0.0.0` のまま) ではなくタグで管理される。基準コミット時点の最新リリースは `0.35.0` (2026-07-01) で、同日に `0.36.0-alpha` もタグされており、固定コミット `84cb39c` (2026-07-06) は `0.35.0` の直後に位置する。ガバナンスは `MAINTAINERS.md` のメンテナ集合を通じて Robusta と Microsoft で共有される。ビルドとテストは Poetry で行い (`poetry install`、`make test-without-llm` は `pytest -m "not llm"` を実行)、ライセンスは Apache-2.0 である (`LICENSE`, リポジトリメタ)。

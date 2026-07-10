# 採用事例・エコシステム

## 誰が使っているか

以下の名前入り採用者 2 組織はプロジェクトの `ADOPTERS.md` に基づく。Microsoft は共同メンテナでもあるため、その項目は利用と開発の両面を反映している。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Microsoft Azure Kubernetes Service (AKS) Team | ノード readiness・Pod スケジューリング・DNS 設定・アップグレードを含むクラスタ障害の調査 | [ADOPTERS.md](https://github.com/HolmesGPT/holmesgpt/blob/main/ADOPTERS.md) |
| Innovaccer (Cloud Infrastructure Team) | 自社の Infrainsights 内で P0/P1 インシデントの RCA/調査、および APM・ログ解析 | [ADOPTERS.md](https://github.com/HolmesGPT/holmesgpt/blob/main/ADOPTERS.md) |

## 採用のシグナル

2026-07-08 時点 (`gh repo view` によるリポジトリメタ): スター 2,814、フォーク 403。リポジトリ作成は 2024-05-30、最新リリースは `0.35.0` (2026-07-01)、主要言語は Python。ガバナンスは 2 ベンダーで共有される。`MAINTAINERS.md` は Robusta 所属 10 名と Microsoft 所属 1 名を挙げており、メンテナ基盤は単一ベンダーではないが、プロジェクトを作り採用した 2 組織に集中している。HolmesGPT は 2025-10-08 に CNCF Sandbox として受理された (CNCF プロジェクトページ)。

## エコシステム

HolmesGPT は LiteLLM の上に載る。だから 1 本のコードパスで OpenAI・Anthropic・Azure・Bedrock・Gemini を対象にできる。データソースへの到達は 46 個の toolset と Model Context Protocol 統合から来る。GitHub・GitLab・各クラウドプロバイダといったツールは専用コードではなく MCP 経由で接続する (README)。アラートは Prometheus AlertManager・PagerDuty・OpsGenie・Jira から取り込み、一部には findings を書き戻せる。創業元の Robusta は、自社の UI・マルチクラスタビュー・履歴データを `robusta` toolset を通じて HolmesGPT と組み合わせる SaaS プラットフォームを提供している (README)。

## 代替候補

HolmesGPT の特徴は推論がモデルのものである点にある。固定のチェック集合を走らせるのではなく、任意の read-only toolset をあらゆるインフラに対して agentic ループで駆動する。最も近い CNCF Sandbox の代替は、重なる領域を別のやり方で扱う。

| 代替 | 違い |
| --- | --- |
| K8sGPT | Kubernetes に絞った analyzer + LLM 説明型。固定 analyzer がクラスタリソースを走査し、モデルはその要約を担うため、モデルの駆動は少ない。HolmesGPT は特定プラットフォームに縛られず、モデルに任意の toolset を agentic に叩かせる |
| kagent | Kubernetes 上で AI エージェントを動かすためのフレームワーク兼ランタイム。HolmesGPT はデータソース統合を備えた完成品のインシデント調査エージェントであって、任意のエージェントを組み立てるプラットフォームではない |

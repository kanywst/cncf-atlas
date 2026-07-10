# HolmesGPT

> HolmesGPT は、大規模言語モデルに制御された tool-calling ループを通じてライブな observability データを取りに行かせ、根本原因分析を書かせる、本番インシデント調査用の OSS AI エージェントである。

- **カテゴリ**: Observability
- **CNCF 成熟度**: Sandbox (2025-10-08 採択)
- **言語**: Python
- **ライセンス**: Apache-2.0
- **リポジトリ**: [HolmesGPT/holmesgpt](https://github.com/HolmesGPT/holmesgpt)
- **ドキュメント基準コミット**: `84cb39c` (タグ `0.35.0` の近傍, 2026-07-06)

## 何をするものか

HolmesGPT は「このアラートはなぜ発火しているのか」に、オンコール担当者と同じデータを読んで答えるエージェントである。アラートや質問を与えると、次のループを回す。言語モデルがツール (Pod ログの取得、Prometheus へのクエリ、ノードの describe など) を 1 つ選び、ツールが実データを返し、モデルが次に何を見るかを決め、根本原因分析を書けるようになるまで続ける。ツールは Kubernetes・Prometheus・Grafana・Datadog・AWS といったデータソースごとの toolset にまとめられ、さらに Model Context Protocol 経由で他のツールにも届く (README)。

このプロジェクトを定義するのは、決定的な Python とモデルの間の切り分けである。Python は制御を担う。ループを回して `max_steps` を強制し、ツール呼び出しをディスパッチし、重複呼び出しを拒否し、承認が要るツールをゲートし、会話が context window を超えたら圧縮し、トレースを記録する。モデルは判断を担う。どのツールをどの引数で呼ぶか、いつ止めるか、分析をどう文章化するかである。診断のためのハードコードされた決定木は存在しない。runbook はプロンプトに差し込まれるテキストなので、ガイド付きの調査であっても推論はモデルに委ねられる (recon; `84cb39c` のソース)。

開発元は Kubernetes 監視 SaaS を提供する Robusta.Dev で、Microsoft が主要な貢献をしている (README, `MAINTAINERS.md`)。Kubernetes は代表的な対象だが必須ではない。toolset とはモデルが呼べる read-only コマンドの集合にすぎないため、同じループが VM・クラウド API・データベース・SaaS ツールに対しても動く。

## いつ使うか

- 自分の observability スタックに対してアラートのトリアージや根本原因分析を自動化したく、HolmesGPT に toolset のあるデータソース (Kubernetes・Prometheus・Grafana・Datadog ほか) を既に運用している場合。
- エージェントのデータアクセスを read-only かつ監査可能に保ちたい場合。ループは重複呼び出しを拒否し、機微なツールの実行前に人間の承認を要求できる。
- インシデント調査を自前のツールに埋め込みたい、あるいは Prometheus AlertManager・PagerDuty・OpsGenie・Jira といったアラート源に接続したい場合。
- 決定的で再現可能な診断が欲しいなら不向き。推論はモデルのものなので、実行はモデルとその context によって毎回変わる。
- 汎用エージェント基盤ではない。データソース統合を備えた完成品のインシデント調査エージェントであって、任意のエージェントを組み立てるためのプラットフォームではない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと調査の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く調査。

## 出典

1. [HolmesGPT/holmesgpt README](https://github.com/HolmesGPT/holmesgpt/blob/main/README.md) (参照 2026-07-08)
2. [HolmesGPT リポジトリメタ (`gh repo view`)](https://github.com/HolmesGPT/holmesgpt) (参照 2026-07-08)
3. [HolmesGPT 開発ガイド (CLAUDE.md)](https://github.com/HolmesGPT/holmesgpt/blob/main/CLAUDE.md) (参照 2026-07-08)
4. [HolmesGPT プロジェクトページ (CNCF)](https://www.cncf.io/projects/holmesgpt/) (参照 2026-07-09)
5. [cncf/sandbox 申請 issue #392・オンボーディング issue #411](https://github.com/cncf/sandbox/issues/392) (参照 2026-07-09)
6. [HolmesGPT MAINTAINERS.md](https://github.com/HolmesGPT/holmesgpt/blob/main/MAINTAINERS.md) (参照 2026-07-08)
7. [CNCF ブログ: HolmesGPT, Agentic troubleshooting built for the cloud native era](https://www.cncf.io/blog/2026/01/07/holmesgpt-agentic-troubleshooting-built-for-the-cloud-native-era/) (参照 2026-07-09)
8. [HolmesGPT ADOPTERS.md](https://github.com/HolmesGPT/holmesgpt/blob/main/ADOPTERS.md) (参照 2026-07-08)

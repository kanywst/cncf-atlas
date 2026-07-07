# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS` ファイルは無い。README は GitHub issue 経由で企業に採用登録を依頼する方式である。出典を示せる本番採用企業は、Alibaba 自身のプラットフォーム解説記事から得られるもののみで、その記事は 40 社以上が登録し、以下の各社が本番で利用したと述べている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| ICBC (中国工商銀行) | 本番のカオスエンジニアリング | [Alibaba Cloud ブログ](https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663) |
| China Mobile | 本番のカオスエンジニアリング | [Alibaba Cloud ブログ](https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663) |
| Xiaomi | 本番のカオスエンジニアリング | [Alibaba Cloud ブログ](https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663) |
| JD.com | 本番のカオスエンジニアリング | [Alibaba Cloud ブログ](https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663) |

この 4 社以外に出典を示せる採用企業は見つからなかった。「40 社以上」という数字はベンダ自身の集計として扱うこと。

## 採用のシグナル

2026-06-27 に GitHub API (`gh api repos/chaosblade-io/chaosblade`) で測定: スター 6,358、フォーク 1,001、open issue 348、contributor 約 52。CNCF はこのプロジェクトを Sandbox 成熟度 (2021-04-28 受理) として掲載している。LFX Insights は集中リスクを報告しており、直近の四半期ではアクティブ contributor 約 15 のうち 1 人が活動の半分超を占める単一メンテナ依存がある。2025 年の調査論文 (arXiv 2505.13654) は ChaosBlade を、リリース履歴全体にわたり継続開発中の Sandbox プロジェクトと説明している。

## エコシステム

Chaosblade は、リポジトリ群の中心に位置する CLI である。

- `chaosblade-exec-os`・`chaosblade-exec-jvm`・`chaosblade-exec-cplus` 等の `chaosblade-exec-*` リポジトリ: ドメイン別の executor バイナリとその YAML スペック。CLI のビルドが clone してパッケージする。
- `chaosblade-spec-go`: `spec.ExpModel`・`spec.Executor` と CLI が使う YAML 解釈を定義する実験モデル SDK。
- `chaosblade-operator`: chaos 実験を Custom Resource Definition (CRD) として公開する Kubernetes operator。
- `chaosblade-box`: プラットフォーム UI。Helm でデプロイし、Prometheus 連携や LitmusChaos 実験のホスティングも可能。
- `blade-ai`: 平文の障害記述から実験を駆動する新しい Python エージェント層。

## 代替候補

Chaosblade の際立った特徴は幅である。1 つの CLI と 1 つの実験モデルで、ホスト・JVM・C++・Docker・CRI・Kubernetes・クラウドを横断し、強力なアプリケーション層注入 (JVM は Java エージェント、C++ は GDB) を備える。Kubernetes ネイティブな代替は、カスタムリソース駆動のクラスタレベル chaos に集中する。

| 代替 | 違い |
| --- | --- |
| Chaos Mesh (CNCF Incubating) | Kubernetes ネイティブで CRD 駆動。PingCAP 発。多プラットフォーム CLI ではなくクラスタ chaos が中心 |
| LitmusChaos (CNCF Incubating) | Kubernetes の chaos ワークフローと実験ハブ。単一 CLI より宣言的パイプライン寄り |
| Gremlin | ホスト型コントロールプレーンを持つ商用 SaaS。OSS ではない |
| AWS Fault Injection Service (FIS) | AWS リソースにスコープされたマネージド障害注入 |
| Chaos Toolkit | プラグインエコシステムを持つ拡張可能な JSON/YAML 実験フォーマット。プロバイダ非依存だが組み込み injector は軽量 |

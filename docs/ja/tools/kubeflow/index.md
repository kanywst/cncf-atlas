# Kubeflow

> Kubeflow Pipelines は、パイプライン定義を Argo Workflows にコンパイルし、すべての実行を ML Metadata で追跡することで、エンドツーエンドの機械学習ワークフローを Kubernetes 上でオーケストレーションする。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Incubating
- **言語**: Go (バックエンド), Python (SDK), TypeScript (フロントエンド)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [kubeflow/pipelines](https://github.com/kubeflow/pipelines)
- **ドキュメント基準コミット**: `5beeae1` (2026-06-24, タグ 2.16.1 付近)

## 何をするものか

Kubeflow は Kubernetes 上で機械学習ワークロードを動かすための CNCF Incubating プロジェクトである。これはアンブレラであり、CNCF が追跡するリポジトリ [kubeflow/kubeflow](https://github.com/kubeflow/kubeflow) は現在ゲートウェイ化していて、README には開発は個々のサブプロジェクトのリポジトリで行われると書かれている。実装は Pipelines、Katib、Trainer、Spark Operator といったサブプロジェクトに存在する。

このディープダイブはオーケストレーションの中核である Kubeflow Pipelines (KFP) を扱う。README は「End to end orchestration: enabling and simplifying the orchestration of end to end machine learning pipelines」で始まる (`README.md:17`)。KFP は Python の `kfp` SDK で記述されたパイプラインを protobuf の中間表現にコンパイルし、それを Kubernetes が実行する Argo Workflow カスタムリソースに変換する。API サーバが run・experiment・recurring run を管理する。Persistence Agent が Workflow の status を watch し、データベースに書き戻す。ML Metadata (MLMD) がすべての execution と artifact を記録し、リネージとキャッシュを支える。

すでに Kubernetes を運用していて、ML パイプラインをアドホックなスクリプトではなく再現性・キャッシュ・追跡を備えた一級のワークロードとして扱いたいチーム向けである。

## いつ使うか

- Kubernetes を運用していて、ML パイプラインをコンテナ化ステップの DAG として、artifact リネージとステップキャッシュ付きで表現したい。
- コンパイル結果が GCP Vertex AI Pipelines などのマネージドバックエンドでも動く Python SDK が欲しい。
- 冪等なトリガーを持つスケジュール実行・周期実行 (recurring run) が必要。
- Kubernetes を使っていない場合、あるいは ML ネイティブな artifact / metadata 追跡が価値を生まない汎用データオーケストレーションが対象の場合は避ける。汎用オーケストレータの方が合う。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと run の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [kubeflow/pipelines リポジトリ](https://github.com/kubeflow/pipelines), コミット `5beeae1` で固定, 参照 2026-06-24。
2. [kubeflow/kubeflow リポジトリ](https://github.com/kubeflow/kubeflow), アンブレラのゲートウェイ, 参照 2026-06-24。
3. [CNCF プロジェクトページ: Kubeflow](https://www.cncf.io/projects/kubeflow/), 参照 2026-06-24。
4. [Kubeflow ブログ: CNCF incubating プロジェクトへの申請](https://blog.kubeflow.org/kubeflow-applied-cncf-incubating/), 参照 2026-06-24。
5. [Kubernetes ブログ: Announcing Kubeflow 0.1](https://kubernetes.io/blog/2018/05/04/announcing-kubeflow-0.1/), 参照 2026-06-24。
6. [Google Cloud: What's new in Kubeflow Pipelines v2](https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/), 参照 2026-06-24。
7. [Wikipedia: Kubeflow](https://en.wikipedia.org/wiki/Kubeflow), 参照 2026-06-24。
8. [kubeflow/pipelines ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md), 参照 2026-06-24。
9. [KFP standalone インストールガイド](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/), 参照 2026-06-24。
10. [Kubeflow Pipelines overview](https://www.kubeflow.org/docs/components/pipelines/overview/), 参照 2026-06-24。
11. [GitHub REST API: repos/kubeflow/pipelines](https://api.github.com/repos/kubeflow/pipelines), 参照 2026-06-24。

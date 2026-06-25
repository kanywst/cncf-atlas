# 採用事例・エコシステム

## 誰が使っているか

以下の採用企業はプロジェクトの [ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md) に記載された組織のみである。出典のある採用企業だけを含む。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| [Capital One](https://www.capitalone.com/) | ML/AI ワークフロー・オーケストレーション | [ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md) |
| [IBM Research Foundation Model Data Engineering Team](https://www.research.ibm.com/) | Foundation Model のデータエンジニアリング | [ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md) |
| [Red Hat](https://www.redhat.com/) | ML/AI とデータのオーケストレーション (OpenShift AI のパイプラインは KFP ベース) | [ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md) |
| [Sophotech](https://sopho.tech/) | ML/AI とワークフローのオーケストレーション | [ADOPTERS.md](https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md) |

これとは別に、GCP Vertex AI Pipelines は KFP DSL を採用している ([Google Cloud ブログ](https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/))。これは KFP のオーサリング面の上に構築された製品であり、ADOPTERS のエントリとは別枠である。

## 採用のシグナル

2026-06-24 時点、[GitHub REST API](https://api.github.com/repos/kubeflow/pipelines) より:

- `kubeflow/pipelines`: 4,157 stars, 2,009 forks, open issues 457, コントリビュータ約 554。
- アンブレラの `kubeflow/kubeflow`: 15,742 stars。
- 最新リリースは 2.16.1 (2026-05-05 公開)。

CNCF は Kubeflow の health metrics を LFX Insights で追跡している ([CNCF プロジェクトページ](https://www.cncf.io/projects/kubeflow/))。

## エコシステム

KFP v2 は実行エンジンとして Argo Workflows にコンパイルして動き、リネージに ML Metadata (MLMD)、artifact に MinIO や S3 などのオブジェクトストア、メタデータに MySQL を使う (`README.md` の compatibility matrix)。Kubeflow 内の兄弟サブプロジェクトには Katib (ハイパーパラメータ調整と AutoML)、Trainer / Training Operator (分散学習)、KServe (推論、現在は独立)、Spark Operator がある。KFP DSL を消費するマネージド提供には GCP Vertex AI Pipelines がある。

## 代替候補

| 代替 | 違い |
| --- | --- |
| [Flyte](https://flyte.org/) | 最も近い競合。Kubernetes ネイティブで強い型付けと再現性。KFP は Argo に依存し、リネージに MLMD を使い、SDK を Vertex と共有する点が差 |
| [Apache Airflow](https://airflow.apache.org/) | 汎用ワークフロー/データ・オーケストレーション。タスク = コンテナ前提ではなく、ML ネイティブな artifact・リネージ・metadata 追跡が弱い |
| [Metaflow](https://metaflow.org/) | データサイエンティスト体験重視、当初 AWS 寄り |
| [Prefect](https://www.prefect.io/) / [Dagster](https://dagster.io/) | 汎用データオーケストレーション。KFP は Kubernetes 上の per-step コンテナ実行と MLMD リネージが差 |
| [Tekton](https://tekton.dev/) | CI/CD パイプライン。KFP はかつて Tekton backend を持ったが現在は Argo が主 (`kfp-tekton` は archived) |

KFP を選ぶのは、Kubernetes 上で、artifact リネージ・ステップキャッシュ・マネージドバックエンドでも動く DSL を備えた ML パイプラインが欲しいとき。ML ではなくデータエンジニアリングが対象で metadata モデルが価値を生まないときは汎用オーケストレータを選ぶ。

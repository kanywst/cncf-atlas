# 歴史

## 起源

Kubeflow は 2017 年に Google 社内で、TensorFlow を Kubernetes 上で動かしやすくするプロジェクトとして始まった。KubeCon NA 2017 で David Aronchick、Jeremy Lewi、Vishnu Kannan が公開発表した ([Wikipedia](https://en.wikipedia.org/wiki/Kubeflow))。最初の広いリリースである Kubeflow 0.1 は KubeCon EU 2018 で発表された ([Kubernetes ブログ, 2018-05-04](https://kubernetes.io/blog/2018/05/04/announcing-kubeflow-0.1/))。

このディープダイブが扱うオーケストレーション・サブプロジェクトである Kubeflow Pipelines は [kubeflow/pipelines](https://github.com/kubeflow/pipelines) にある。リポジトリは 2018-05-12 に作成された ([GitHub API](https://api.github.com/repos/kubeflow/pipelines))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2017 | KubeCon NA 2017 で Kubeflow を発表 ([Wikipedia](https://en.wikipedia.org/wiki/Kubeflow)) |
| 2018 | KubeCon EU で Kubeflow 0.1 を発表、`kubeflow/pipelines` リポ作成 ([Kubernetes ブログ](https://kubernetes.io/blog/2018/05/04/announcing-kubeflow-0.1/)) |
| 2019 | Pipelines が DAG ベースの MLOps オーケストレーション・コンポーネントとして独立 ([Google Cloud ブログ](https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/)) |
| 2020 | Kubeflow 1.0 リリース、production readiness を示す |
| 2022 | KServe (serving) が LF AI & Data 配下の独立プロジェクトとしてスピンアウト |
| 2023 | 2023-07-25 に CNCF Incubating プロジェクトとして受理 ([CNCF](https://www.cncf.io/projects/kubeflow/)) |
| 2026 | KFP 2.16.1 を 2026-05-05 にリリース ([GitHub API](https://api.github.com/repos/kubeflow/pipelines)) |

## どう進化したか

Pipelines の最大の転換は v1 から v2 への移行である。KFP v2 はパイプラインを protobuf 中間表現 (PipelineSpec) にコンパイルし、中央コントローラに DAG を解釈させるのではなく、各 Argo Workflow タスクに driver と launcher のコンテナを注入する ([Google Cloud ブログ](https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/))。v2 が現行の default エンジンである。同じ SDK の DSL はマネージドバックエンドでも消費され、GCP Vertex AI Pipelines は KFP DSL を採用した。

Kubeflow はサブプロジェクトが成熟するにつれてスコープを絞ってもいった。Serving は 2022 年に KServe として独立した。その結果が今日のアンブレラ構造で、CNCF が追跡する `kubeflow/kubeflow` リポジトリはゲートウェイであり、稼働するコードは Pipelines のようなサブプロジェクトのリポジトリにある。

ガバナンスは 2023 年に変化した。Google が Project Steering Group の支援のもと CNCF incubation を申請し ([Kubeflow ブログ](https://blog.kubeflow.org/kubeflow-applied-cncf-incubating/))、CNCF は 2023-07-25 に Kubeflow を Incubating として受理した ([CNCF](https://www.cncf.io/projects/kubeflow/))。

## 現在地

Kubeflow は CNCF Incubating プロジェクトで、health metrics は LFX Insights で追跡されている ([CNCF](https://www.cncf.io/projects/kubeflow/))。Pipelines は定期的にリリースしており、執筆時点の最新は 2.16.1 (2026-05-05 公開) である ([GitHub API](https://api.github.com/repos/kubeflow/pipelines))。v2 が default の実行エンジンで、プロジェクトが掲げる方向性は、Python SDK を主要なオーサリング面とした Kubernetes 上のエンドツーエンド ML パイプライン・オーケストレーションである。

# KServe

> モデルを autoscaling な InferenceService CRD に変える、Kubernetes ネイティブでマルチフレームワークの推論基盤。予測 AI と生成 AI を 1 つのプラットフォームで扱う。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Incubating
- **言語**: Go (control plane)、Python (data plane)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [kserve/kserve](https://github.com/kserve/kserve)
- **ドキュメント対象コミット**: `58d137d` (master、`v0.19.0` リリース後、2026-06-23)

## 概要

KServe は機械学習モデルを Kubernetes 上のサービスとして動かす。オブジェクトストレージ上のモデルアーティファクトとモデルフォーマットを渡せば、推論 pod・ネットワークルート・autoscaler を自動でプロビジョンする。作業単位は `InferenceService` カスタムリソース (`isvc`) で、`pkg/apis/serving/v1beta1/inference_service.go:147` に定義される。

構成は 2 面にきれいに分かれる。Go の control plane である `kserve-controller-manager` は controller-runtime バイナリで、CRD を素の Kubernetes オブジェクト (Deployment / Service / HPA、または Knative Service) に reconcile する。Python の data plane は Open Inference Protocol を喋るモデルサーバを提供する。両者はコンテナイメージとワイヤープロトコルだけで結合するので、それぞれ独立に進化できる。

KServe は Kubeflow 内の KFServing として始まり、いまは予測モデル (scikit-learn、XGBoost、PyTorch、Triton) と、新しい `LLMInferenceService` CRD (`pkg/apis/serving/v1alpha1/llm_inference_service_types.go:60`) 経由の生成モデルの両方を扱う。2025 年に CNCF Incubating プロジェクトになった。

## 使いどころ

- Kubernetes 上でモデルを動かし、S3 / GCS / PVC / Hugging Face のモデルアーティファクトを、モデルごとに専用イメージを作らずに稼働するエンドポイントへ変えたい。
- 推論ワークロードに scale-to-zero を含むリクエスト駆動の autoscaling が要る。
- 予測と生成の serving を 1 つの API で扱い、オプションで canary ロールアウトとトラフィック分割をしたい。
- Kubernetes を使わない場合や、1 台の VM で 1 モデルだけで足りる場合は不向き。CRD とコントローラのオーバーヘッドに見合わない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用とエコシステム](./adoption): 誰が動かし、周辺に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [入門](./getting-started): インストールと最初の動く構成。

## 出典

1. [kserve/kserve (GitHub)](https://github.com/kserve/kserve)
2. [GitHub API repos/kserve/kserve](https://api.github.com/repos/kserve/kserve)
3. [KServe becomes a CNCF incubating project (CNCF)](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)
4. [KServe (CNCF projects)](https://www.cncf.io/projects/kserve/)
5. [KServe: The next generation of KFServing (Kubeflow)](https://blog.kubeflow.org/release/official/2021/09/27/kfserving-transition.html)
6. [Announcing KServe v0.15 (CNCF)](https://www.cncf.io/blog/2025/06/18/announcing-kserve-v0-15-advancing-generative-ai-model-serving/)
7. [KServe joins CNCF as an incubating project (Red Hat)](https://www.redhat.com/en/blog/kserve-joins-cncf-incubating-project)
8. [The journey to build Bloomberg's ML Inference Platform Using KServe (Bloomberg)](https://www.bloomberg.com/company/stories/the-journey-to-build-bloombergs-ml-inference-platform-using-kserve-formerly-kfserving/)
9. [ML model serving tools comparison: KServe, Seldon Core, BentoML (GetInData/Xebia)](https://medium.com/@getindatatechteam/machine-learning-model-serving-tools-comparison-kserve-seldon-core-bentoml-2c6b87837b1f)
10. [BentoML vs Seldon Core vs KServe (Reintech)](https://reintech.io/blog/bentoml-vs-seldon-core-vs-kserve-model-serving-framework-comparison)
11. [KServe Quickstart Guide](https://kserve.github.io/website/docs/getting-started/quickstart-guide)
12. [KServe Joins CNCF To Standardize AI Model Serving on Kubernetes (The New Stack)](https://thenewstack.io/kserve-joins-cncf-to-standardize-ai-model-serving-on-kubernetes/)

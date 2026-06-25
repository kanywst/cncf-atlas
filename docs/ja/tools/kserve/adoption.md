# 採用とエコシステム

## 誰が使っているか

リポに `ADOPTERS.md` は無い。以下の組織は CNCF Incubating アナウンスと Bloomberg のエンジニアリング記事に基づく。出典のある採用事例のみを載せる。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Bloomberg | 自社の ML 推論基盤を KServe 上に構築。元の共同制作者でもある | [Bloomberg story](https://www.bloomberg.com/company/stories/the-journey-to-build-bloombergs-ml-inference-platform-using-kserve-formerly-kfserving/) |
| Red Hat | 採用組織。自社 AI プラットフォームに KServe を同梱 | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |
| Cloudera | 採用組織 | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |
| CyberAgent | 採用組織 | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |
| Nutanix | 採用組織 | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |
| SAP | 採用組織 | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |
| NVIDIA | 採用組織。元の共同制作者でもある | [CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/) |

## 採用シグナル

`kserve/kserve` の GitHub API から、2026-06-24 時点: stars 5,611、forks 1,542、watchers (subscribers) 70、open issues + PRs 636。リポ作成は 2019-03-27 ([GitHub API](https://api.github.com/repos/kserve/kserve))。contributors API は匿名を含めおよそ 360 エントリまでページネーションするので、コントリビュータ層はその規模。

CNCF Incubating アナウンスはアナウンス時点の独自の値を公表している: stars 4,600 以上、PR 2,400 以上、コントリビュータ 300 以上、メンテナ 19、採用企業 30 以上 ([CNCF blog](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/))。KServe は 2025-09-29 に CNCF Incubation へ入り、TOC スポンサーは Faseela K と Kevin Wang。

## エコシステム

KServe は複数のプロジェクトの上に、また並んで位置する:

- サーバレス (`Knative`) デプロイモード向けの Knative。
- ingress と `VirtualService` ルーティング向けの Istio。
- autoscaling 向けの KEDA と Kubernetes HPA。
- 元の親であり、今もディストリに KServe を同梱する Kubeflow。
- 高密度な多モデルサービング向けの ModelMesh。
- ランタイムバックエンド: vLLM (生成 AI)、Hugging Face、NVIDIA Triton、TorchServe。`ServingRuntime` リソースとして組み込む。

## 代替

KServe は、Kubernetes ネイティブな CRD API、Open Inference Protocol、ルーティング/autoscaling/ストレージダウンロードの自動プロビジョンが欲しい時の選択肢になる。他はトレードオフが異なる。

| 代替 | 違い |
| --- | --- |
| [Seldon Core](https://medium.com/@getindatatechteam/machine-learning-model-serving-tools-comparison-kserve-seldon-core-bentoml-2c6b87837b1f) | ROUTER/COMBINER による inference graph で multi-armed-bandit やアンサンブルを組む。KServe は isvc CRD と V2 プロトコルを軸にインフラを自動プロビジョンする |
| [BentoML](https://reintech.io/blog/bentoml-vs-seldon-core-vs-kserve-model-serving-framework-comparison) | 任意の Python フレームワークの code-first なパッケージング。KServe と併用が定番 (BentoML で packaging、KServe でデプロイ) |
| [NVIDIA Triton](https://medium.com/@getindatatechteam/machine-learning-model-serving-tools-comparison-kserve-seldon-core-bentoml-2c6b87837b1f) | 競合ではなく GPU 最適化サーバ。KServe が `ServingRuntime` として上に載せる |
| Ray Serve / vLLM / MLflow / SageMaker / Vertex AI | 分散サービング、LLM エンジン、クラウドマネージドのプラットフォーム。KServe は統合するか、self-managed Kubernetes で置き換える |

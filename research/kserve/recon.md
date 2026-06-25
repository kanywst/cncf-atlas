# recon: kserve

調査メモ。`kserve/kserve` がメインの実装リポ。Go 製の controller-manager + 各種サイドカー (agent/router/batcher/logger) と、Python 製の推論ランタイム群 (`python/`) を 1 つのモノレポに収める。website / kserve-controller の追加コンポーネントは別リポだが、deep-dive の主対象はこのリポ。出典は URL を添える。`file:line` は pinned commit のもの。

## 基本情報

- repo: kserve/kserve
- pinned commit: `58d137d8c69cc08bf3d53eaa594af1e483a9e80b` (2026-06-23, `master` 先端、commit `fix(llmisvc): scope InferencePool readiness to gw refs (#5691)`)。shallow clone のため `git describe` 不可。直近のリリースタグは `v0.19.0` (`python/kserve/kserve/VERSION` が `0.19.0`、`python/kserve/pyproject.toml` も `version = "0.19.0"`)。HEAD は v0.19.0 リリース後の開発版 (次は v0.20 系)。タグは `git ls-remote --tags` で確認 (`v0.19.0`, `v0.19.0-rc0` が最新)。
- 言語 / ビルド: Go (`go.mod` は `module github.com/kserve/kserve` / `go 1.25.8`) が control plane。Python (`python/kserve` ほか) が data plane の推論サーバ。ビルドは Makefile (controller は `controller-runtime` ベース、`make manager` 等)。コンテナは各 `*.Dockerfile` (`Dockerfile` = controller, `router.Dockerfile`, `agent.Dockerfile`, `llmisvc-controller.Dockerfile`, `python/*.Dockerfile`)。
- ライセンス: Apache-2.0。`LICENSE` は Apache License 2.0 全文、各 Go ソース冒頭は `Licensed under the Apache License, Version 2.0`。GitHub API も `spdx_id: Apache-2.0` を返す (gh API `repos/kserve/kserve` 2026-06-24)。
- CNCF 成熟度: Incubating。TOC が受理したのは 2025-09-29、公開アナウンスは 2025-11-11 (KubeCon NA に合わせて)。出典: [CNCF blog 2025-11-11](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/), [CNCF projects/kserve](https://www.cncf.io/projects/kserve/)。
- カテゴリ (tools.ts の CATEGORY_ORDER から): Orchestration & Scheduling
- エントリポイント: controller-manager は `cmd/manager/main.go:97` の `main()`。`manager.New(cfg, ...)` で controller-runtime の Manager を構築し、scheme 登録 (`kservescheme.AddAll`)、`InferenceServiceReconciler` / `TrainedModelReconciler` / `InferenceGraphReconciler` を `SetupWithManager` で登録、最後に mutating/validating webhook を `mgr.GetWebhookServer()` に登録する。バイナリ名は `kserve-controller-manager` (leader lock `kserve-controller-manager-leader-lock`, `cmd/manager/main.go:55`)。他に `cmd/agent`, `cmd/router`, `cmd/llmisvc`, `cmd/localmodel`, `cmd/localmodelnode` の main がある。

## 歴史の素材

- 起点は 2018。IBM が KubeCon + CloudNativeCon NA 2018 で「Knative を使ったサーバレスな ML モデルサービング」を提案。同時期に Bloomberg も Knative での推論を実験していた。両者が Kubeflow Contributor Summit 2019 (Sunnyvale) で合流。当時 Kubeflow にモデルサービングコンポーネントが無かったため、任意の ML フレームワーク向けの標準的かつ簡素なサービング基盤として sub-project を立ち上げた。出典: [CNCF blog 2025-11-11](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)。
- KFServing は 2019 に Google・IBM・Bloomberg・NVIDIA・Seldon の協働で開発され OSS 公開。KubeCon NA 2019 でデビューしエンドユーザの関心を集めた。出典: [CNCF blog 2025-11-11](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/), [Kubeflow blog: KServe the next generation of KFServing (2021-09-27)](https://blog.kubeflow.org/release/official/2021/09/27/kfserving-transition.html)。
- 2021-09: コントリビュータ層を広げるため Kubeflow Serving WG が `kubeflow/kfserving` リポを独立 org `kserve` に移管し、KFServing から KServe へ改名。移管作業は Bloomberg が主導。出典: [Kubeflow blog 2021-09-27](https://blog.kubeflow.org/release/official/2021/09/27/kfserving-transition.html)。
- 2022-02: LF AI & Data Foundation へ寄贈。2022-09: KFServing から standalone な KServe へリブランドし Kubeflow から「卒業」。出典: [CNCF blog 2025-11-11](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)。
- 2025-09-29 CNCF が Incubating として受理、2025-11-11 公開アナウンス。TOC スポンサーは Faseela K と Kevin Wang。v0.15 (2025-06) で生成 AI 向け (vLLM バックエンド強化、`LLMInferenceService`) を前進。出典: [CNCF blog 2025-11-11](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/), [CNCF blog: Announcing KServe v0.15 (2025-06-18)](https://www.cncf.io/blog/2025/06/18/announcing-kserve-v0-15-advancing-generative-ai-model-serving/), [Red Hat blog: KServe joins CNCF](https://www.redhat.com/en/blog/kserve-joins-cncf-incubating-project)。

## アーキテクチャの素材

2 面構成。control plane は Go の `kserve-controller-manager` (controller-runtime) が CRD を reconcile して K8s リソース (Deployment / Knative Service / HPA / Service / Ingress または VirtualService 等) を生成する。data plane は実際に推論する pod 群 (Python ランタイム or Triton/TorchServe 等) に、モデル取得用の `storage-initializer` init container と agent/router/batcher/logger サイドカーが付く。

中核 CRD:

- `InferenceService` (isvc): メインの API。`v1beta1` が storage version (`pkg/apis/serving/v1beta1/inference_service.go:148` の `+kubebuilder:storageversion`)。`Predictor` 必須、`Transformer` / `Explainer` は任意 (`inference_service.go:24`)。
- `ServingRuntime` / `ClusterServingRuntime` (`pkg/apis/serving/v1alpha1/servingruntime_types.go:222` / `:248`): モデルフォーマット (sklearn, pytorch, triton, huggingface 等) ごとのサーバ pod テンプレート。
- `InferenceGraph` (`pkg/apis/serving/v1alpha1/inference_graph.go`): 複数モデルのルーティング/アンサンブルを DAG で記述。
- `TrainedModel` (`pkg/controller/v1alpha1/trainedmodel`): ModelMesh (multi-model serving) 向け。
- `LLMInferenceService` (`pkg/apis/serving/v1alpha1/llm_inference_service_types.go:60`, `v1alpha2` にも存在): 生成 AI 向けの新 CRD。disaggregated serving と prefix caching を扱う。出典: [CNCF blog 2025-11-11](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)。

デプロイモード (`pkg/constants/constants.go:547-571`):

- `Standard` (旧 `RawDeployment`): 素の K8s Deployment + Service + HPA/KEDA。現在のデフォルト (`DefaultDeployment = Standard`, `constants.go:554`)。Knative 非依存で軽量だが canary とリクエストベースの scale-to-zero は無い。
- `Knative` (旧 `Serverless`): Knative Serving でサーバレス。scale-to-zero とリビジョン/トラフィック分割。
- `ModelMesh`: 高密度・多モデルサービング。

`LegacyServerless` を `Knative` に、`LegacyRawDeployment` を `Standard` に改名 (`constants.go:550-553`、`ParseDeploymentMode` `constants.go:559-`)。旧名は deprecated。デフォルトが Knative から Standard に倒れたのが効く。Knative を前提にしなくなった。

### 中核オペレーションを端から端まで: InferenceService の reconcile から model pod 起動まで

`kubectl apply -f isvc.yaml` から推論 pod が立つまでを追う。

1. reconcile 入口。`InferenceServiceReconciler.Reconcile` (`pkg/controller/v1beta1/inferenceservice/controller.go:121`)。`r.Get` で isvc を取得 (NotFound なら finalizer による GC 任せで return)。
2. 設定とモード解決。`v1beta1.GetInferenceServiceConfigMap` で `inferenceservice-config` ConfigMap を読み (`controller.go:133`)、`NewInferenceServicesConfig` / `NewDeployConfig` でパース。`isvcutils.GetDeploymentMode(isvc.Status.DeploymentMode, annotations, deployConfig)` でモードを決める (`controller.go:155`)。
3. finalizer 処理。`inferenceservice.finalizers` が無ければ merge patch で付与 (`controller.go:178-187`)。DeletionTimestamp があれば `deleteExternalResources` 後に finalizer を外して return (`controller.go:193-211`)。
4. component reconciler 列の構築。`Standard`/`Knative` なら `components.NewPredictor` を追加、Transformer/Explainer が spec にあればそれぞれ追加 (`controller.go:270-279`)。各 `reconciler.Reconcile(ctx, isvc)` を順に呼ぶ (`controller.go:280-294`)。
5. Predictor の分岐。`Predictor.Reconcile` (`pkg/controller/v1beta1/inferenceservice/components/predictor.go:85`)。`p.deploymentMode == constants.Standard` なら `reconcileRawDeployment` から `raw.NewRawKubeReconciler` (`predictor.go:204-208`, `:771`) で Deployment+Service+HPA を作る。Knative なら `knative.NewKsvcReconciler` (`predictor.go:836`) で Knative Service を作る。
6. ingress。`reconcilers.NewReconcilerFactory()` の `CreateIngressReconciler(deploymentMode, ...)` でモード別の ingress reconciler を生成し `Reconcile` (`controller.go:350-405`)。Istio VirtualService CRD が無く `disableIstioVirtualHost=false` の場合は warning event を出してスキップ (`controller.go:355-361`)。
7. modelConfig と status。`modelconfig.NewModelConfigReconciler(...).Reconcile` (`controller.go:393`)、最後に `r.updateStatus(ctx, isvc, deploymentMode)` (`controller.go:404`) で `URL` / conditions / components を書く。

### data plane 側: storage-initializer 注入 (非自明な肝)

サーバ pod のスケジュール時、`pod` mutating webhook が動く。`pod.Mutator.Handle` (`pkg/webhook/admission/pod/mutator.go`) が `StorageInitializerInjector.InjectStorageInitializer` を呼ぶ (`mutator.go:133`)。`InjectStorageInitializer` (`pkg/webhook/admission/pod/storage_initializer_injector.go:668`) は `storageUri` から init container を組み立て `params.PodSpec.InitContainers = append(...)` (`storage_initializer_injector.go:441`, `:499`) で挿入し、`emptyDir` を `/mnt/models` にマウントしてモデル本体のコンテナと共有する (`storage_initializer_injector.go:483` のコメント `Pvc will be mount to /mnt/models`)。これでモデルアーティファクトがサーバイメージから切り離される。

## 内部実装の素材

中核データ構造:

1. `InferenceService` / `InferenceServiceSpec` (`pkg/apis/serving/v1beta1/inference_service.go:148`, `:24`)。`Predictor PredictorSpec` 必須、`Transformer *TransformerSpec` / `Explainer *ExplainerSpec` 任意。`Status InferenceServiceStatus` は `+kubebuilder:pruning:PreserveUnknownFields`。printcolumn に `URL` / `Ready` / traffic 各種を持つ (`inference_service.go:140-147`)。
2. `ComponentExtensionSpec` (`pkg/apis/serving/v1beta1/component.go:82`)。全コンポーネント共通のスケーリング/運用ノブ。`MinReplicas *int32` (0 で scale-to-zero)、`MaxReplicas`、`ScaleMetric` (concurrency/rps/cpu/memory)、`AutoScaling *AutoScalingSpec` (HPA or KEDA backed)、`ContainerConcurrency`、`CanaryTrafficPercent`、`Logger`、`Batcher`、`DeploymentStrategy` (Standard モードのみ)。
3. `ServingRuntimeSpec` + `SupportedModelFormat` (`pkg/apis/serving/v1alpha1/servingruntime_types.go:128`, `:31`)。`SupportedModelFormats[].Name/Version/AutoSelect/Priority` でモデルフォーマットからランタイムへの自動選択を表現。`ProtocolVersions` (`v1`/`v2`/`grpc-v1`/`grpc-v2`)、`MultiModel`、`WorkerSpec` (multi-node/multi-gpu)。
4. `InferenceServiceStatus` (`pkg/apis/serving/v1beta1/inference_service_status.go:34`)。`duckv1.Status` (Knative の condition duck type) を inline、`URL *apis.URL`、`Address`、`Components map[ComponentType]ComponentStatusSpec`、`ModelStatus`、`DeploymentMode`、`ServingRuntimeName`。
5. `DeploymentModeType` (`pkg/constants/constants.go:547`)。`Standard` / `Knative` / `ModelMesh` と legacy 別名。reconcile 全体の分岐の軸。

非自明な設計判断:

- storage-initializer を mutating webhook で注入する方式。モデル本体はサーバイメージに焼かず、pod 起動時に `storageUri` (s3/gcs/pvc/hf 等) から init container が `/mnt/models` (`emptyDir` 共有) に落とす (`storage_initializer_injector.go:441/483/668`)。汎用ランタイムイメージ 1 つで任意のモデルを配れる。CRD 側 (`StorageSpec` / `LoggerStorageSpec`, `inference_service.go:39-60`) で path/key/parameters を override 可能。
- ServingRuntime の自動選択。isvc がモデルフォーマット (例 `sklearn`) を指定すると、`SupportedModelFormat.AutoSelect=true` かつ `Priority` 最大のランタイムが選ばれる (`servingruntime_types.go:31-54`)。ユーザはランタイムイメージを直接指定しなくてよい。
- デプロイモードのデフォルトが `Standard` (素の K8s)。Knative は scale-to-zero/canary が要る時だけ。`DefaultDeployment = Standard` (`constants.go:554`)。Knative 必須という初期の前提を外した。
- status の condition に Knative の `duckv1.Status` を採用 (`inference_service_status.go:42`)。KFServing が Knative 上に作られた歴史の名残で、`PropagateCrossComponentStatus` で `RoutesReady` / `LatestDeploymentReady` を集約する (`controller.go:330-345`、Knative モード時のみ)。
- Python data plane は別パッケージ (`python/kserve/kserve/model_server.py`, `model.py` ほか)。`V1`/`V2` (Open Inference Protocol) を喋るサーバの基底クラスとフレームワーク別実装 (sklearn/xgboost/lightgbm/huggingface 等) を提供し、Go controller とはイメージとプロトコルだけで結合する。

## 採用事例の素材

CNCF Incubating アナウンスに列挙される採用組織のみ (出典付き): Bloomberg, Red Hat, Cloudera, CyberAgent, Nutanix, SAP, NVIDIA。Bloomberg は元の共同制作者でもあり、自社の ML 推論基盤を KServe 上に構築。出典: [CNCF blog 2025-11-11](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/), [Bloomberg: The journey to build Bloomberg's ML Inference Platform Using KServe](https://www.bloomberg.com/company/stories/the-journey-to-build-bloombergs-ml-inference-platform-using-kserve-formerly-kfserving/)。

採用シグナル (GitHub `kserve/kserve`, gh API 取得 2026-06-24): stars 5,611 / forks 1,542 / watchers (subscribers) 70 / open issues+PRs 636、created 2019-03-27。contributors API のページネーション末尾は `page=362` (per_page=1, anon 含む) なのでコントリビュータはおよそ 360 規模。CNCF アナウンスは別途「4.6k+ stars / 2400+ PR / 300+ contributors / 19 maintainers / 30+ company adopters」と公表 (アナウンス時点の値)。出典: [GitHub API repos/kserve/kserve](https://api.github.com/repos/kserve/kserve), [CNCF blog 2025-11-11](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/)。

ガバナンス: メンテナ/オーナーはリポの `MAINTAINERS.md` / `OWNERS` に列挙。CNCF Incubating として中立ガバナンス下に入った。TOC スポンサーは Faseela K と Kevin Wang。出典: [CNCF blog 2025-11-11](https://www.cncf.io/blog/2025/11/11/kserve-becomes-a-cncf-incubating-project/), リポ同梱の `MAINTAINERS.md`。

## 代替・エコシステム

- Seldon Core: K8s 上の MLOps。inference graph の ROUTER/COMBINER で Multi-Armed-Bandit やアンサンブルが組みやすい。KServe との差は、KServe が isvc CRD と Open Inference Protocol (V2) を軸にインフラ (LB/autoscaler/監視) を自動プロビジョンする点。出典: [GetInData/Xebia: KServe vs Seldon Core vs BentoML](https://medium.com/@getindatatechteam/machine-learning-model-serving-tools-comparison-kserve-seldon-core-bentoml-2c6b87837b1f), [Reintech: BentoML vs Seldon Core vs KServe](https://reintech.io/blog/bentoml-vs-seldon-core-vs-kserve-model-serving-framework-comparison)。
- BentoML: code-first なパッケージング/デプロイ。任意の Python フレームワークを custom class で包める。軽量。KServe とは「BentoML で packaging、KServe で K8s デプロイ」のハイブリッドが定番。出典: [Reintech](https://reintech.io/blog/bentoml-vs-seldon-core-vs-kserve-model-serving-framework-comparison)。
- NVIDIA Triton Inference Server: GPU 最適化の高性能サーバ。競合というより KServe が ServingRuntime として上に載せる関係 (`SupportedModelFormat` に triton)。出典: [GetInData/Xebia](https://medium.com/@getindatatechteam/machine-learning-model-serving-tools-comparison-kserve-seldon-core-bentoml-2c6b87837b1f)。
- その他: Ray Serve (分散サービング)、vLLM (LLM 推論エンジン、KServe の生成 AI バックエンド)、MLflow Model Serving、クラウドマネージド (SageMaker / Vertex AI)。
- 統合先/エコシステム: Knative (serverless モード)、Istio (ingress/VirtualService)、KEDA / HPA (autoscaling)、Kubeflow (元の親、今も Kubeflow ディストリに同梱)、ModelMesh (多モデル)、vLLM / Hugging Face / Triton / TorchServe (ランタイム)。

最小セットアップ (quickstart, 実験用): `kind create cluster` でローカルクラスタを作り、リリース同梱の quick-install スクリプトを実行する (例: `kserve-standard-mode-full-install-with-manifests.sh` を `curl ... | bash`)。その後 `kubectl apply` で sklearn iris などの `InferenceService` を作り、`curl` でエンドポイントに推論リクエストを投げる。本番は Standard / Knative / ModelMesh いずれかを Admin Guide に沿って入れる。出典: [KServe Quickstart Guide](https://kserve.github.io/website/docs/getting-started/quickstart-guide), リポ `README.md:47-58`, `hack/kserve-install.sh`。write 段でバージョン整合を再確認のうえ反映する。

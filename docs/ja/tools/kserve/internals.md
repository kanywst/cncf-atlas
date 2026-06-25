# 内部実装

> コミット `58d137d` のソースから読んだ。ここでの主張はすべて file:line を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/manager/main.go` | controller-manager のエントリポイント。Manager を構築し reconciler と webhook を登録 (`:99`) |
| `pkg/apis/serving/v1beta1` | `InferenceService`、`PredictorSpec`、`ComponentExtensionSpec`、status 型 |
| `pkg/apis/serving/v1alpha1` | `ServingRuntime`、`InferenceGraph`、`TrainedModel`、`LLMInferenceService` |
| `pkg/controller/v1beta1/inferenceservice` | isvc reconcile ループと component reconciler |
| `pkg/webhook/admission/pod` | pod mutating webhook と storage-initializer 注入 |
| `pkg/constants/constants.go` | デプロイモードとデフォルト (`:547`) |
| `python/kserve/kserve` | Python data plane のモデルサーバ (V1/V2 プロトコル) |

## 中核データ構造

- `InferenceService` / `InferenceServiceSpec` (`pkg/apis/serving/v1beta1/inference_service.go:147`, `:24`)。`Predictor PredictorSpec` 必須、`Transformer` / `Explainer` は任意のポインタ (`:27`, `:31`, `:35`)。`Status` は `+kubebuilder:pruning:PreserveUnknownFields` を持つ。
- `ComponentExtensionSpec` (`pkg/apis/serving/v1beta1/component.go:82`)。全コンポーネント共通のスケーリング/運用ノブ。`MinReplicas *int32` (0 で scale-to-zero, `:85`)、`MaxReplicas` (`:88`)、`ScaleMetric` (`:98`)、`CanaryTrafficPercent` (`:114`)。
- `ServingRuntimeSpec` と `SupportedModelFormat` (`pkg/apis/serving/v1alpha1/servingruntime_types.go:128`, `:31`)。`SupportedModelFormats[].Name/Version/AutoSelect/Priority` がランタイム自動選択を駆動する。
- `InferenceServiceStatus` (`pkg/apis/serving/v1beta1/inference_service_status.go:34`)。conditions として Knative の `duckv1.Status` を inline する (`:42`)。
- `DeploymentModeType` (`pkg/constants/constants.go:547`)。`Standard` / `Knative` / `ModelMesh` と legacy 別名。reconcile 全体が分岐する軸。

## たどる価値のあるパス

デプロイモード解決は下流すべてが依存する分岐。`ParseDeploymentMode` は reconcile 判断の前に legacy 名を正規化する:

```go
// pkg/constants/constants.go:559
func ParseDeploymentMode(mode string) DeploymentModeType {
    if mode == "" {
        return DefaultDeployment
    }
    deploymentMode := DeploymentModeType(mode)
    switch deploymentMode {
    case LegacyRawDeployment:
        return Standard
    case LegacyServerless:
        return Knative
    default:
        return deploymentMode
    }
}
```

`DefaultDeployment = Standard` (`constants.go:554`) なので、モード注釈の無い `isvc` は素の Kubernetes に落ちる。reconcile ループでは解決済みのモードが `Predictor.Reconcile` に届き、`predictor.go:204` で分岐する:

```text
Predictor.Reconcile (predictor.go:85)
  -> if p.deploymentMode == constants.Standard (predictor.go:204)
       -> reconcileRawDeployment (predictor.go:744)
            -> raw.NewRawKubeReconciler  => Deployment + Service + HPA (predictor.go:771)
  -> else (Knative)
       -> knative.NewKsvcReconciler      => Knative Service (predictor.go:836)
```

## 驚いた点

モデルはサーバイメージの中に入らない。重い仕事は pod mutating webhook がやる。`Mutator.Handle` (`pkg/webhook/admission/pod/mutator.go:46`) が `InjectStorageInitializer` を呼び (`mutator.go:133`)、`StorageInitializerInjector.InjectStorageInitializer` (`pkg/webhook/admission/pod/storage_initializer_injector.go:668`) が `params.PodSpec.InitContainers = append(...)` で init container を追加する (`:441`, `:499`)。その init container は `storageUri` から `/mnt/models` にマウントした `emptyDir` へモデルを落とし (`:483`、コメント `Pvc will be mount to /mnt/models rather than /mnt/pvc.`)、モデルコンテナがそれを読む。serving ランタイムはモデル非依存のままになる。

もう 1 つの驚きは status 型に残る Knative の名残。`Standard` モードでも status は `duckv1.Status` を inline する (`inference_service_status.go:42`)。KFServing から引き継いだ Knative の condition duck type だ。`PropagateCrossComponentStatus` によるコンポーネント横断の集約 (`controller.go:339-340`) は Knative モード時のみ発火する。

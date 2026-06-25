# 内部実装

> コミット `658499d` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/` | コンポーネントごとの cobra バイナリ。各 `main` が `app.NewXxxCommand` を呼ぶ。 |
| `pkg/detector` | テンプレートを監視し、マッチしたポリシーを主張し、`ResourceBinding` を構築する。 |
| `pkg/scheduler` | binding に反応し、filter/score/select/assign パイプラインを動かす。 |
| `pkg/scheduler/core` | スケジューリングアルゴリズム本体: `Schedule`, `SelectClusters`, `AssignReplicas`。 |
| `pkg/controllers/binding` | スケジュール済み binding をクラスタごとの `Work` に変換する。 |
| `pkg/controllers/execution` | `Work` のマニフェストをメンバークラスタに適用する。 |
| `pkg/apis` | CRD 型: `ResourceBinding`, `Work`, `PropagationPolicy`, `Cluster`。 |
| `pkg/resourceinterpreter` | インタプリタフレームワークと、カスタム CRD 用の Lua VM。 |
| `pkg/karmadactl` | CLI。コントロールプレーンを構築する `init` を含む。 |
| `operator/` | Karmada インスタンスを `Karmada` CRD で管理する。 |

## 中核データ構造

- `workv1alpha2.ResourceBindingSpec` (`pkg/apis/work/v1alpha2/binding_types.go:71`) はスケジューリングの作業台。`Resource` 参照、`Replicas`、`ReplicaRequirements`、`Placement`、そしてスケジュール結果 `Clusters []TargetCluster` (`binding_types.go:100`) を持つ。新しめの `Components []Component` フィールド (`binding_types.go:89`) はマルチ pod テンプレート (分散学習) 向けで、`MultiplePodTemplatesScheduling` feature gate で有効化される。
- `workv1alpha2.TargetCluster` (`binding_types.go:287`) は 1 クラスタと割当レプリカ数の組で、スケジュール結果の単位。
- `workv1alpha1.Work` / `WorkSpec` (`pkg/apis/work/v1alpha1/work_types.go:44,57`) はメンバークラスタへ届ける封筒。`WorkloadTemplate` (`work_types.go:77`) が `Manifests []Manifest` (`work_types.go:84`) を持ち、各々は任意の Kubernetes リソースを包む `runtime.RawExtension`。
- `policyv1alpha1.PropagationSpec` (`pkg/apis/policy/v1alpha1/propagation_types.go:62`) は `ResourceSelectors []ResourceSelector` (`propagation_types.go:223`) で対象を選び、`Placement` (`propagation_types.go:471`) で配置する。

## 追う価値のあるパス

スケジュール済み binding が `Work` になる過程を追う。binding コントローラの `Reconcile` (`pkg/controllers/binding/binding_controller.go:70`) が `syncBinding` (`binding_controller.go:110`) を呼び、それが `ensureWork` (`pkg/controllers/binding/common.go:53`) を呼ぶ。対象クラスタごとに `ensureWork` は workload を clone し、テンプレートを信用せずレプリカ数をスケジュール結果で上書きする:

```go
// When syncing workloads to member clusters, the controller MUST strictly adhere to the scheduling results
```

このコメントは `pkg/controllers/binding/common.go:80` にある。レプリカ改訂は workload 型に対して行われ (`common.go:86`)、次に override ポリシーが適用され (`ApplyOverridePolicies`, `common.go:109`)、`Work` オブジェクトが per-cluster の `ObjectMeta` (`common.go:134`) で namespace `karmada-es-<cluster>` (`pkg/util/names/names.go:80,92`) に構築される。続いて execution コントローラが引き継ぐ: `Reconcile` (`pkg/controllers/execution/execution_controller.go:82`) から `syncToClusters` (`execution_controller.go:266`) で各マニフェストを unmarshal し、`tryCreateOrUpdateWorkload` (`execution_controller.go:311`) を呼び、`ObjectWatcher.Create`/`Update` (`execution_controller.go:324,332`) に至る。

## 読んで驚いた点

真に非自明な設計判断は **Lua ベースの Resource Interpreter Framework** である。ワークロード型ごとの扱いをハードコードする代わりに、Karmada は解釈ロジックを Lua スクリプトとして Go を再コンパイルせず注入させる。`pkg/resourceinterpreter/interpreter.go:50` のインターフェースが `GetReplicas`、`ReviseReplica`、`AggregateStatus` などの operation を宣言する。declarative 実装は `New` (`pkg/resourceinterpreter/customized/declarative/luavm/lua.go:46`) で gopher-lua VM のプールを作り、`RunScript` (`lua.go:74`) でユーザ定義関数を呼ぶ。型付きエントリは `GetReplicas` (`lua.go:129`) と `ReviseReplica` (`lua.go:185`)。スクリプトは `ResourceInterpreterCustomization` CRD に載る。リポジトリには `default/native` と `default/thirdparty/resourcecustomizations` 配下に Flux, Argo, Ray, Kubeflow, Flink 向けのビルトインインタプリタも同梱される。これが「アプリ無改造」を任意の CRD (`FlinkDeployment`, `RayJob`, `PyTorchJob` など) まで広げる肝で、それらのレプリカ分割や status 集約は Go ではなく Lua で記述される。

2 つ目の驚きは、テンプレート自身のレプリカフィールドを意図的に信用しない点である。スケジューラはレプリカをスケジュール対象の希少資源として計上し、`ensureWork` は同期のたびにテンプレート値を上書きする (`pkg/controllers/binding/common.go:80-96`)。ワークロードが自前のレプリカ数を設定してスケジューラの quota や queue 計上を静かに迂回できないようにするためである。

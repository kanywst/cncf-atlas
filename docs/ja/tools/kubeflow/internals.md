# 内部実装

> コミット `5beeae1` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `backend/src/apiserver/` | REST/gRPC コントロールプレーン: run・pipeline・experiment・recurring run |
| `backend/src/agent/persistence/` | Argo Workflow の status を watch し API サーバに報告する |
| `backend/src/crd/controller/scheduledworkflow/` | cron で Workflow CR を作る SWF CRD コントローラ |
| `backend/src/v2/driver/` | タスクごとの driver: 入力解決、キャッシュ判定、MLMD execution |
| `backend/src/v2/cmd/launcher-v2/` | ユーザコンテナを実行し artifact を MLMD とオブジェクトストアに publish |
| `backend/src/cache/` | ステップ結果キャッシュサーバ |
| `backend/src/common/util/` | `ExecutionSpec` などエンジン中立な抽象 |
| `api/v2alpha1/` | SDK とバックエンドが共有する protobuf IR (PipelineSpec) |
| `sdk/python/` | Python の `kfp` オーサリング SDK |

## 中核データ構造

- **`model.Run`** (`backend/src/apiserver/model/run.go`): API サーバが永続化する run レコード。`PipelineSpec`、run の詳細 (state, conditions, manifests)、`RecurringRunId` を束ねる。`ResourceManager.CreateRun` (`backend/src/apiserver/resource/resource_manager.go:651`) が組み立てて永続化する。
- **`ExecutionSpec`** (`backend/src/common/util/execution_spec.go:77`): `RunWorkflow` が返すエンジン中立な Workflow 抽象。実体は Argo Workflow をラップするが、呼び出し側には interface (`SetServiceAccount`, `OverrideParameters`, `ExecutionStatus`, `ToStringForStore`, `GenerateRetryExecution`) しか見えない。
- **`Template` interface と `TemplateType`** (`backend/src/apiserver/template/template.go:118`, `:40`): 保存済み pipeline spec を `ExecutionSpec` に変換する戦略。`V1` パスは旧来の Argo YAML を、`V2` パスは IR をコンパイルする。`tmpl.GetTemplateType()` が `backend/src/apiserver/resource/resource_manager.go:713` で分岐を駆動する。
- **`driver.Execution`** (`backend/src/v2/driver/driver.go:152`): タスクごとの driver 実行の結果。`ExecutorInput`、`Condition` (trigger 判定)、`Cached`、`PodSpecPatch`、`IterationCount` を持つ。v2 オーケストレーションの単位。
- **`pipelinespec.PipelineSpec` IR** (`api/v2alpha1/pipeline_spec.proto:50`): SDK が Python DSL からコンパイルする protobuf。バックエンドと SDK の契約。

## 追う価値のあるパス

run 作成を、gRPC ハンドラから永続化レコードまで:

```text
RunServer.CreateRun                        run_server.go:514
  -> ResourceManager.CreateRun             resource_manager.go:651
       fetchTemplateFromPipelineSpec       resource_manager.go:665
       tmpl.RunWorkflow -> ExecutionSpec   resource_manager.go:696
       executionSpec.Validate              resource_manager.go:700
       OnBeforeRunCreation (plugin hook)   resource_manager.go:750
       workflowClient.Create (Argo CR)     resource_manager.go:769
       runStore.CreateRun (DB)             resource_manager.go:799
```

`ResourceManager.CreateRun` はまず Template を読み込み `ExecutionSpec` にレンダリングする:

```go
tmpl, manifest, err := r.fetchTemplateFromPipelineSpec(&run.PipelineSpec)
executionSpec, err := tmpl.RunWorkflow(run, runWorkflowOptions)
err = executionSpec.Validate(false, false)
```

続いて Argo Workflow カスタムリソースを作成し、run を永続化する:

```go
newExecSpec, err := r.getWorkflowClient(k8sNamespace).Create(ctx, executionSpec, v1.CreateOptions{})
newRun, err := r.runStore.CreateRun(run)
```

run は `Pending` で記録され、status はあとから Persistence Agent が `ReportWorkflow` (`backend/src/agent/persistence/worker/workflow_saver.go:72`) で Workflow の進行を報告するときに収束する。

## 読んで驚いた点

- **アンブレラ repo に実装コードが無い**。`kubeflow/kubeflow` はゲートウェイで、実コードはサブプロジェクト (Pipelines, Katib, Trainer, Spark Operator) に分散している。CNCF の 1 ロゴが 1 コードベースに対応するという前提はここでは崩れる。
- **v2 でオーケストレーション・ロジックが中央コントローラからタスクコンテナに移った**。DAG を解釈するコントローラの代わりに、v2 は各 Argo Workflow ステップに driver (init) と launcher を注入する。オーケストレーションの賢さは Workflow CR 自体に埋め込まれる。
- **キャッシュは launcher を丸ごとスキップする**。driver はユーザコンテナを実行する前に MLMD でキャッシュヒットを判定する (`backend/src/v2/driver/container.go:173`, `:216`)。ヒット時は過去の出力を `Execution_CACHED` として再 publish し (`:234`)、ユーザコンテナを起動しない。
- **recurring run の重複排除は決定論的 UUID**。`NewDeterministicUUID(recurringRunId + "/" + displayName)` (`backend/src/apiserver/resource/resource_manager.go:682`) により、並行する SWF replica は同じ primary key で衝突し、重複 insert は store 側で冪等に解決される。
- **kubernetes-platform op には launcher が無い**。dummy image のタスク (`isKubernetesPlatformOp`, `backend/src/v2/driver/container.go:103`, `:136`) では driver 自身が MLMD への publish とキャッシュを行う。K8s リソース操作専用ステップの特殊扱いである。

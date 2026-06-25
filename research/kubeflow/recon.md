# recon: kubeflow

調査メモ。自分用の密度。出典は URL 付き。path:line は pinned commit に対して有効。

## リポジトリ解決 (重要)

CNCF プロジェクトとしての "Kubeflow" はアンブレラ（複数サブプロジェクトの集合）。CNCF が追跡する公式リポは [`github.com/kubeflow/kubeflow`](https://github.com/kubeflow/kubeflow) (15,742 stars) だが、現在の HEAD は実装コードを持たない。tracked file は 11 個だけで、README に `This repository serves primarily as a gateway to Kubeflow subprojects ... Kubeflow development happens in the individual subproject repositories.` とある（`src` を一度 clone して確認、commit `59d0326`）。

したがってコードのディープダイブが成立する「主要実装リポ」は別。今回のカテゴリは "Orchestration & Scheduling" 固定なので、Kubeflow のワークフロー・オーケストレーション中核である **Kubeflow Pipelines (`github.com/kubeflow/pipelines`)** を対象にする。KFP は ML ワークフロー DAG を Argo Workflows にコンパイルして実行する、Kubeflow の中で最も「オーケストレーション」に該当する実装。README 冒頭が `End to end orchestration: enabling and simplifying the orchestration of end to end machine learning pipelines` と明言（`src/README.md:18`）。

## 基本情報

- repo: `kubeflow/pipelines`
- pinned commit: `5beeae1a86b14be2b141a459d92ea2dd01d0aa17` (2026-06-24) / 近いタグ: `2.16.1`（backend）, `sdk-2.16.1`（SDK）。最新リリースは 2.16.1 (2026-05-05)
- 言語 / ビルド: Go (backend, 約 252k 行 / 843 files), Python (SDK, 約 166k 行), TypeScript+TSX (frontend React 19, 約 149k 行), Protobuf (API IR, 約 9k 行)。ビルドは `make -C backend`、SDK は `pip install -e sdk/python`、frontend は `npm`。Go module は `github.com/kubeflow/pipelines`（`src/go.mod:1`）
- ライセンス: Apache-2.0（`src/LICENSE` 冒頭が `Apache License Version 2.0`、GitHub API も `Apache-2.0`）
- CNCF 成熟度: Incubating（2023-07-25 受理、後述）
- カテゴリ (tools.ts の CATEGORY_ORDER から): Orchestration & Scheduling
- main entrypoint: API server は `backend/src/apiserver/main.go`（gRPC を `:8887` で listen `main.go:340`、grpc-gateway の REST proxy を `:8888` `main.go:74`）。他に persistence agent / scheduledworkflow controller / v2 driver / v2 launcher / cache server がそれぞれ `main.go` を持つ

## 歴史の素材

- 2017: Kubeflow は Google 社内で TensorFlow on Kubernetes を簡単にするプロジェクトとして発足し、KubeCon NA 2017 で David Aronchick / Jeremy Lewi / Vishnu Kannan が公開発表（[Wikipedia](https://en.wikipedia.org/wiki/Kubeflow)）。
- 2018-05: Kubeflow 0.1 を KubeCon EU 2018 で発表（[Kubernetes blog 2018-05-04](https://kubernetes.io/blog/2018/05/04/announcing-kubeflow-0.1/)）。`kubeflow/pipelines` リポは 2018-05-12 作成（GitHub API `created_at`）、最初のコミット群は 2018-05-31。
- 2019: Kubeflow Pipelines が DAG ベースの MLOps ワークフロー・オーケストレーション・コンポーネントとして独立（[Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/)）。
- 2020-03-02: Kubeflow 1.0 リリース（production readiness）。
- 2022: Kubeflow Serving が KServe として独立スピンアウト（LF AI & Data 配下）。
- KFP v2: パイプラインを protobuf IR (PipelineSpec) にコンパイルし、タスクごとに driver+launcher コンテナを注入する新エンジンに刷新（v2 が現行 default、[Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/)）。GCP Vertex AI Pipelines は KFP DSL を採用。
- 2023: Google が PSG 支援のもと CNCF Incubation 申請を発表（[Kubeflow blog](https://blog.kubeflow.org/kubeflow-applied-cncf-incubating/)）。CNCF は 2023-07-25 に Incubating で受理（[CNCF project page](https://www.cncf.io/projects/kubeflow/)）。

## アーキテクチャの素材

トップレベル・コンポーネント（`src/backend/src/` 配下）:

- `apiserver/`: REST/gRPC のコントロールプレーン。run / pipeline / experiment / recurring-run を管理し、run 作成時に pipeline spec を Argo Workflow にコンパイルして CR を作る。
- `agent/persistence/`: Persistence Agent。Argo Workflow CR を watch し、status を API server (DB) に書き戻す。
- `crd/controller/scheduledworkflow/`: ScheduledWorkflow (SWF) CRD コントローラ。cron で recurring run の Workflow CR を生成。
- `crd/controller/viewer/`: Viewer CRD コントローラ（TensorBoard 等）。
- `cache/`: ステップ結果のキャッシュサーバ。
- `v2/driver/`, `v2/cmd/launcher-v2/`, `v2/compiler/argocompiler/`: KFP v2 エンジン。compiler が IR を Argo Workflow に変換し、各タスクは driver（入力解決・キャッシュ判定・pod spec patch 生成）と launcher（ユーザコンテナ実行・成果物 I/O・MLMD publish）に分かれる。
- 外部: `frontend/`（React UI）, `sdk/`（Python `kfp`）, `api/`（IR の protobuf 定義）。実行基盤は Argo Workflows (v3.7 / v4.0) と MySQL v8（`src/README.md` の compatibility matrix）、メタデータは ML Metadata (MLMD)。

代表オペレーション「run を1本作る」を端から端まで（path:line）:

1. gRPC `RunServer.CreateRun`（`backend/src/apiserver/server/run_server.go:514`）→ `createRun`（同 `:138`）→ `ResourceManager.CreateRun`。
2. `ResourceManager.CreateRun`（`backend/src/apiserver/resource/resource_manager.go:651`）。`fetchTemplateFromPipelineSpec`（`:665`）で保存済み pipeline spec から Template を得る → `tmpl.RunWorkflow(...)` が ExecutionSpec（= Argo Workflow）を生成（`:696`）→ `executionSpec.Validate`（`:700`）→ namespace / OwnerReference 設定 → plugin hook `OnBeforeRunCreation`（`:750`）→ workflow client で **Argo Workflow CR を作成**（`:769`）→ `runStore.CreateRun` で DB 永続化（`:799`）。State は `Pending`。
3. Argo が DAG を実行。各タスクは init で driver、その後 launcher。`driver.Container`（`backend/src/v2/driver/container.go:47`）が MLMD から pipeline/DAG を引き（`:66`,`:70`）、`resolveInputs`（`:79`）→ 出力を provision（`:116`）→ cache fingerprint と過去実行 ID を算出（`getFingerPrintsAndID` `:173`）→ MLMD に Execution を作成（`mlmd.CreateExecution` `:190`）。
4. cache ヒット時（global+task で有効かつ `CachedMLMDExecutionID != ""`、`:216`-`:240`）は `reuseCachedOutputs` で過去成果物を再利用し `PublishExecution(..., Execution_CACHED)`（`:234`）して **launcher をスキップ**。ミス時は PodSpecPatch を作って launcher にユーザコンテナを実行させる。
5. launcher（`backend/src/v2/cmd/launcher-v2/main.go`）がユーザコンテナを実行し、入出力 artifact を object store と MLMD に publish。
6. Persistence Agent が Workflow CR の変化を検知し `pipelineClient.ReportWorkflow(wf)`（`backend/src/agent/persistence/worker/workflow_saver.go:72`）で API server に status を書き戻し、DB の run 状態を更新。
7. recurring run は SWF コントローラ `syncHandler`（`backend/src/crd/controller/scheduledworkflow/controller.go:433`）が cron 評価して Workflow CR を周期生成。`ResourceManager.CreateRun` 側は SWF 由来 run を決定論的 UUID（`NewDeterministicUUID(recurringRunId + "/" + displayName)` `resource_manager.go:682`）で冪等化し、複数コントローラ replica による二重 run を防ぐ。

設計判断:

- **push 型のコントロールプレーン + watch 型の status 同期**。API server が Workflow CR を能動的に作り、Persistence Agent が watch して DB を後追い更新する非同期2段構え（`resource_manager.go:670`-`675` の TODO コメントが意図を説明）。
- **実行エンジン中立の抽象 `ExecutionSpec`**（`backend/src/common/util/execution_spec.go:77`）。Argo Workflow を直接触らせず interface 越しに扱う。CLAUDE.md の Architectural boundary policy も「`*util.Workflow` への downcast 禁止、Argo 固有挙動を common に入れない」と明文化。
- **MLMD を実行状態とリネージの真実の源にする**。Argo は単なる実行基盤で、タスクの実行記録・キャッシュ判定・成果物リネージは MLMD の Execution / Context が握る。

## 内部実装の素材

中核データ構造 (3-5):

1. `model.Run`（`backend/src/apiserver/model/run.go`）: API server が DB に持つ run レコード。`PipelineSpec`, `RunDetails`(State/Conditions/manifests), `RecurringRunId` などを束ねる。`resource_manager.go:651`-`809` が主にこれを組み立て永続化。
2. `ExecutionSpec` interface（`backend/src/common/util/execution_spec.go:77`）: 実行エンジン中立な Workflow 抽象。`RunWorkflow` の戻り値で、`SetServiceAccount` / `OverrideParameters` / `ExecutionStatus` / `ToStringForStore` / `GenerateRetryExecution` 等を持つ。実体は Argo Workflow のラッパ。
3. `template.Template` interface + `TemplateType`（`backend/src/apiserver/template/template.go:118`,`:40`）: 保存済み pipeline spec を ExecutionSpec に変換する戦略。`V1`（旧 Argo YAML 直書き）と `V2`（IR コンパイル）を切り替える。`tmpl.GetTemplateType()` による分岐が `resource_manager.go:713`,`:783`-`:790` に出る。
4. `driver.Execution`（`backend/src/v2/driver/driver.go:152`）: per-task driver の結果。`ExecutorInput`, `Condition`（trigger 判定）, `Cached`, `PodSpecPatch`, `IterationCount` を持つ。v2 オーケストレーションの単位。
5. `pipelinespec.PipelineSpec` IR（`api/v2alpha1/pipeline_spec.proto:50`、他 `ComponentSpec:86` `DagSpec:103` `PipelineTaskSpec:492` `PipelineDeploymentConfig:730` `ExecutorInput:1013`）: SDK が Python DSL からコンパイルする protobuf 中間表現。backend と SDK の契約。

驚いた点・非自明な選択:

- **アンブレラ repo にコードが無い**。`kubeflow/kubeflow` は gateway 化済みで、実装は pipelines / katib / trainer / spark-operator 等のサブプロジェクトに分散。CNCF の1ロゴ＝1コードベースという素朴な前提が崩れる。
- **v1 から v2 でオーケストレーション・ロジックがコントローラからタスク内コンテナに移った**。v2 は中央コントローラではなく、Argo Workflow の各ステップに driver(init) + launcher を注入する。オーケストレーションの賢さが Workflow CR の中（sidecar/init step）に埋め込まれる。
- **キャッシュは driver が launcher 実行前に MLMD で判定して丸ごとスキップする**（`container.go:190`,`:216`-`:240`）。fingerprint が一致すれば過去 Execution の成果物を `Execution_CACHED` として publish し、ユーザコンテナを起動しない。
- **recurring run の二重起動防止が決定論的 UUID で実装**（`resource_manager.go:653`-`661`,`:682`）。複数 SWF コントローラ replica が同時 trigger しても同一 primary key に収束し、2本目の insert は store 側で冪等に解決される。
- **`kubernetesPlatformOps`（dummy image）には launcher が無い**ため、driver 自身が MLMD publish とキャッシュを行う（`container.go:103`,`:136`）。K8s リソース操作専用タスクの特殊扱い。

## 採用事例の素材

リポの `ADOPTERS.md`（`src/ADOPTERS.md`、出典として citable）に記載の組織のみ:

- [Capital One](https://www.capitalone.com/) — ML/AI Workflow orchestration
- [IBM Research Foundation Model Data Engineering Team](https://www.research.ibm.com/) — Foundation Model Data Engineering
- [Red Hat](https://www.redhat.com/) — ML/AI & Data orchestration（OpenShift AI のパイプライン機能が KFP ベース）
- [Sophotech](https://sopho.tech/) — ML/AI & Workflow orchestration

加えて GCP Vertex AI Pipelines が KFP DSL を採用（[Google Cloud blog](https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/)）。これは「Kubeflow を使う製品」であり ADOPTERS とは別枠。

採用シグナル（2026-06-24 時点、GitHub API）:

- `kubeflow/pipelines`: 4,157 stars, 2,009 forks, open issues 457, contributors 約 554（匿名込み、`per_page=1` の last page=554）。
- アンブレラ `kubeflow/kubeflow`: 15,742 stars。
- CNCF が LFX Insights で health metrics を追跡（[CNCF project page](https://www.cncf.io/projects/kubeflow/)）。

## 代替・エコシステム

- 実行基盤/隣接: Argo Workflows（KFP v2 はここにコンパイルする実行エンジン。代替ではなく土台）、ML Metadata（MLMD、リネージ）、MinIO/S3 等 object store、MySQL（メタデータ DB）。Kubeflow 内の兄弟: Katib（HPO/AutoML）、Trainer/Training Operator（分散学習）、KServe（推論、現在は独立）、Spark Operator。
- 主な代替（ML/ワークフロー・オーケストレータ）と本質的な差:
  - **Flyte**（LF AI & Data, incubating）: 最も近い競合。K8s ネイティブで強い型付けと再現性。KFP は Argo に依存し MLMD でリネージ、SDK が Vertex で共有される点が差。
  - **Apache Airflow**: 汎用ワークフロー/データパイプライン。タスク＝コンテナ前提ではなく ML ネイティブな artifact/lineage/metadata の一級扱いが弱い。
  - **Metaflow**（Netflix）: データサイエンティスト体験重視、当初 AWS 寄り。
  - **Prefect / Dagster**: 汎用データオーケストレーション。K8s/コンテナ・per-step 実行と MLMD リネージが KFP の差。
  - **Tekton**: CI/CD パイプライン。KFP はかつて Tekton backend を持ったが現在は Argo が主（`kfp-tekton` は archived）。
  - マネージド: GCP Vertex AI Pipelines（KFP DSL 互換）、AWS SageMaker Pipelines、Azure ML Pipelines。

## インストール / 最小動作

- standalone（KFP 単体、認証なし）を Kustomize で:

```bash
export PIPELINE_VERSION=2.16.1
kubectl apply -k "github.com/kubeflow/pipelines/manifests/kustomize/cluster-scoped-resources?ref=$PIPELINE_VERSION"
kubectl wait --for condition=established --timeout=60s crd/applications.app.k8s.io
kubectl apply -k "github.com/kubeflow/pipelines/manifests/kustomize/env/dev?ref=$PIPELINE_VERSION"
```

- ローカル Kind での開発デプロイは `make -C backend kind-cluster-agnostic`（`src/CLAUDE.md` の Local cluster deployment）。
- UI/API は `kubectl -n kubeflow port-forward svc/ml-pipeline-ui 8080:80` で `localhost:8080`。
- SDK でパイプライン作成・投入:

```python
from kfp import dsl, compiler, Client

@dsl.component
def say(msg: str): print(msg)

@dsl.pipeline(name="hello")
def hello_pipeline(text: str = "hi"):
    say(msg=text)

compiler.Compiler().compile(hello_pipeline, "hello.yaml")
Client(host="http://localhost:8080").create_run_from_pipeline_package("hello.yaml")
```

- 公式手順: [KFP standalone installation](https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/)。

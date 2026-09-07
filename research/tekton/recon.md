# recon: Tekton

Tekton Pipelines (`tektoncd/pipeline`) の調査メモ。Internals / Architecture の記述は下記の pinned commit に対してのみ有効。

## 基本情報

- repo: `tektoncd/pipeline`
- pinned commit: `9dec5e4b1530cb040eb2edbfcdc1f4a0985ce25f` (2026-09-04) / 近いタグ: `v1.16.0` (`git describe` = `v1.16.0-4-g9dec5e4b1`)
- 言語 / ビルド: Go 1.26.4 (`go.mod`) / `make` + `ko`。非テストの Go は約 116k 行、Go ファイル 1001 個 (vendor 除く)
- ライセンス: Apache-2.0
- CNCF 成熟度: **Incubating** (landscape.yml の `extra.accepted` / `extra.incubating` ともに `2026-03-13`、発表は 2026-03-24)
- カテゴリ (tools.ts の CATEGORY_ORDER): **App Definition & GitOps**
- slug: `tekton` / 表示名: `Tekton`

補足: 「Tekton」はファミリ名で、この repo は中核の Pipelines。他に Triggers / Chains / Results / CLI (tkn) / Dashboard / Operator / Hub がある。CNCF に入ったのはファミリ全体 [1]。

## 歴史の素材

日付のうち、タグとコミットは pinned した clone の git から直接引いた。それ以外は出典番号を添える。

- 2018-08-29: 初コミット (Mark Chmarny)。当時は `knative/build-pipeline`。Knative Build から派生したもので、Knative のビルド機構を CI/CD 一般に広げるのが狙い [2], [3]
- 2018-08-31 / 2018-09-05: `Add pipeline strawman example` と最初の PR マージ (Christie Wilson)。設計は strawman から始まっている
- 2019-02-20: `v0.1.0`
- 2019-03: Google が Continuous Delivery Foundation (CDF) 発足に合わせて Tekton に改名し寄贈。CDF の創立プロジェクトは Jenkins / Jenkins X / Spinnaker / Tekton [3], [4]
- 2020-03-30: `v0.11.0`。beta API (`v1beta1`) 期。beta 移行の解説が Google Open Source Blog にある [5]
- 2021-11-03: `v0.30.0`
- 2022-06-29: `pkg/apis/pipeline/v1/task_types.go` が追加される (v1 API 型の最初)。2022-08-08 に `pipelinerun_types.go`
- 2022-10-26: CDF で Graduated [6]
- 2022-10-31: `v0.41.0`。最初の LTS リリース (`releases.md`。以降 1・4・7・10 月が LTS、月次リリース)
- 2023-01-19 〜 2023-03: PipelineResources の削除 (`6ba1c48ed` PullRequest, `81876e6bc` Git/Storage/Generic, `3ca844439` Image)。初期の目玉概念が v1 では丸ごと消えている
- 2025-02-27: `v1.0.0`
- 2026-03-13: CNCF が incubating として受け入れ (landscape の `extra`)。TOC 申請は `cncf/toc#1310` [7]、発表は 2026-03-24 [1]、CDF 側の見送りも同日 [8]
- 2026-08-21: `v1.16.0`

「Typed resources」を謳う README 冒頭の記述 (`README.md:22-28`) は PipelineResources 時代の名残で、v1 の実態と合っていない。歴史セクションで触れる価値がある。

## アーキテクチャの素材

### CRD とプロセス

`config/300-crds/` が配る CRD は 8 個。

| CRD | 役割 |
| --- | --- |
| `Task` | step (コンテナ) の並びの定義 |
| `TaskRun` | Task の 1 回の実行。Pod に 1:1 対応 |
| `Pipeline` | Task の DAG 定義 |
| `PipelineRun` | Pipeline の 1 回の実行。TaskRun を生む |
| `StepAction` | step 単体を再利用可能にした新しめの型 |
| `CustomRun` | Tekton 以外のコントローラに実行を委譲する型 |
| `ResolutionRequest` | リモート解決の要求 (後述) |
| `VerificationPolicy` | 取得したリソースの署名検証ポリシー |

`cmd/` のバイナリ: `controller` / `webhook` / `events` / `resolvers` / `entrypoint` / `sidecarlogresults` / `nop` / `workingdirinit`。reconciler は Knative の `knative.dev/pkg` フレームワークに乗っている。

### TaskRun の流れ

1. `pkg/reconciler/taskrun/taskrun.go:137` `ReconcileKind`
2. `:531` `prepare` : Task の解決 (ローカル参照かリモート解決) と検証
3. `:729` `reconcile`
4. `:1082` `createPod`
5. `pkg/pod/pod.go:166` `Builder.Build` : TaskSpec から Pod を組み立てる

### PipelineRun の流れ

1. `pkg/reconciler/pipelinerun/pipelinerun.go:191` `ReconcileKind`
2. `:390` `resolvePipelineState`
3. `:545` `reconcile`
4. `:989` `runNextSchedulableTask`
5. `:1315` `createTaskRuns` / `:1477` `createCustomRuns` / `:1134` `createChildPipelineRuns` (pipeline in pipeline)

DAG:

- `pkg/reconciler/pipeline/dag/dag.go:73` `Build` : `runAfter` と result 参照から依存グラフを組む
- `:103` `GetCandidateTasks` : 完了済みから次に流せるノードを出す
- `:135` `findCyclesInDependencies` : 循環検出。DAG であることは実行前に検証される
- `pkg/reconciler/pipelinerun/resources/pipelinerunstate.go:459` `DAGExecutionQueue`

つまり「スケジューラ」は独立プロセスではなく、PipelineRun の reconcile 1 回ごとに DAG を評価して次に流せる TaskRun を作る、という形。

### リモート解決

`ResolutionRequest` CRD と `cmd/resolvers` バイナリ。実装は `pkg/resolution/resolver/` に `git` / `bundle` (OCI) / `cluster` / `hub` / `http` / `framework`。Task や Pipeline の定義をクラスタ内に事前登録せず、参照時に外部から引ける。

### 設計判断

- 実行単位は Pod。TaskRun 1 個 = Pod 1 個。step 間のデータ共有は Pod 内のボリューム経由になり、Task をまたぐ共有は workspace (PVC など) が要る。この制約が「trusted artifacts」など後続の設計議論の出発点 [1]
- API の安定度はクラスタ全体のフラグ `enable-api-fields` で切る。既定は `beta` (`pkg/apis/config/feature_flags.go:73` `DefaultEnableAPIFields = BetaAPIFields`)
- ワークフローエンジンとして汎用だが、CI/CD の語彙で API を切っている

## 内部実装の素材

### 目玉: step の直列化 (Kubernetes と真っ向から戦っている箇所)

Kubernetes は Pod 内のコンテナを同時に起動する。Tekton の step は順番に走らなければならない。Tekton はこれを **全 step コンテナの command を自前の entrypoint バイナリに書き換え、共有 emptyDir 上のファイルで直列化する** ことで解決している。

- `pkg/pod/entrypoint.go:127` `orderContainers`。doc comment がそのまま意図を書いている ("modified so that they are executed in order by overriding the entrypoint binary")
- step `i > 0` は `-wait_file /tekton/run/<i-1>/out` を渡される (`:144`)
- 全 step が `-post_file /tekton/run/<i>/out` を渡される (`:148`)。自分の完了をファイルで次に知らせる
- step 0 だけは `-wait_file /tekton/downward/ready` と `-wait_file_content` (`:139`)。ready ファイルは Downward API ボリューム経由の Pod annotation `tekton.dev/ready` (`:57`, `:96-108`)。コントローラが Pod を patch して初めて 1 番目の step が動き出す (`:321` `UpdateReady`)
- 書き換えの実体は `:206-208`。`Command = []string{"/tekton/bin/entrypoint"}`、元の command/args は `-entrypoint` と `--` 以降に押し込まれる
- キャンセルも同じ仕組み。annotation `tekton.dev/cancel` → `/tekton/downward/cancel` (`:63-65`, `:88-93`)
- 定数は `:40-66`。`RunDir = /tekton/run`、`binDir = /tekton/bin`、`terminationPath = /tekton/termination`

entrypoint バイナリの配り方も非自明: init container が **自分自身を `cp` する**。`pkg/pod/pod.go:630` `entrypointInitContainer` の command は `["/ko-app/entrypoint", "init", "/ko-app/entrypoint", "/tekton/bin/entrypoint", <step 名...>]`。共有 emptyDir (`binVolume`, `entrypoint.go:79-82`) に置かれるので、任意のユーザーイメージから実行できる。

ユーザーが step に `command` を書かなかった場合、書き換えのために元の ENTRYPOINT を知る必要がある。そのためレジストリからイメージ設定を引く仕組みがある: `pkg/pod/entrypoint_lookup.go` / `entrypoint_lookup_impl.go`。

### entrypointer 本体

`pkg/entrypoint/entrypointer.go:201` `Go()`。

- `:215` 待ちファイルを順に待つ。待ちで失敗しても `:221` で post file を書く。後続 step も同じ理由で bail するため
- `:267` キャンセルファイル監視の goroutine (`:517` `waitingCancellation`)
- `:272-285` `when` 式が false なら skip として post file を書いて終了 (step は「成功」扱いで飛ばされる)
- `:288-319` 終了処理の分岐。`onError: continue` の場合は exit code を result に書いて post file は正常扱い (`:302-311`)
- `:323-342` result をディスクから読む (`/tekton/results`、step result は `<stepMetadataDir>/results`)
- `:203-207` defer で termination message を書く。ここが結果の返却口

### result の 4KB 制約

結果は Kubernetes の termination message で返るので、上限がそのまま Tekton の制約になる。

- `pkg/termination/write.go:33-35` `MaxContainerTerminationMessageLength = 1024 * 4`
- `:103` 超過チェック

回避策として sidecar 経由でログに出す方式がある: `cmd/sidecarlogresults` と `pkg/pod/pod.go:663` `createResultsSidecar`。`entrypointer.go:55` の `ResultExtractionMethodTerminationMessage` が既定方式の名前。

### 意外だった点

- 直列化・キャンセル・ready 伝達がすべて「Pod annotation → Downward API → ファイル」を経由する。コード内にも `TODO(#1605): Signal sidecar readiness by injecting entrypoint, remove dependency on Downward API` (`entrypoint.go:94-95`) と残っていて、本人たちも仮の姿だと思っている
- 初期の看板だった PipelineResources が v1 では跡形もない。README の冒頭がまだその世界観のまま
- `createChildPipelineRuns` (`pipelinerun.go:1134`) と `detectPipelineRefCycle` (`:1282`) があり、Pipeline を Pipeline から呼べる。循環検出が別途要るのはそのため

## 採用事例の素材

出典なしのものは書かない。以下はすべて出典付き。

- CNCF incubation 申請 `cncf/toc#1310` [7] が挙げるアダプタ: Google, IBM, RedHat, Cloudbees, Nubank, Marriott Vacations Worldwide, OneStock, Solarwinds, Ozone, Kaiju.ci (Apple は「要確認」扱いで載っているので**使わない**)
- CNCF の発表記事 [1] が挙げる名前: Puppet, Ford Motor Company, Red Hat (OpenShift Pipelines), IBM (Cloud Continuous Delivery)
- 指標 (CNCF 発表記事 [1], 2026-03-24 時点): GitHub star 11,000+、PR 5,000+、issue 2,500+、contributor 600+
- 指標 (`cncf/toc#1310` [7]): 直近 6 か月で 10 コミット以上の contributor が 60 人超。ArtifactHub 上の Tekton task が 350 個超。maintainer 数は Pipeline 13 / Results 11 / Triggers 5 / Chains 5 / CLI 5 / Operator 5 / Dashboard 4
- DevStats: <https://tekton.devstats.cncf.io/> (landscape の `extra.dev_stats_url`)

repo に `ADOPTERS` ファイルは無い。上記以外の組織名は足さない。

## 代替・エコシステム

### Tekton ファミリ (同一プロジェクト内)

Triggers (イベント受信して PipelineRun を作る) / Chains (Sigstore で成果物に署名し SLSA provenance を出す) / Results (実行履歴の長期保管) / CLI `tkn` / Dashboard / Operator / Hub。

### 統合先

landscape の `extra.summary_integrations` が挙げるのは Argo CD (GitOps)、SPIFFE/SPIRE (identity)、Sigstore (Tekton Chains 経由の署名・検証)、CloudEvents、OpenTelemetry と Prometheus、Helm (Operator)、ArtifactHub (Catalog)。repo 側にも `pkg/spire` と `pkg/tracing` がある。

### 商用・マネージド

Red Hat OpenShift Pipelines と IBM Cloud Continuous Delivery が Tekton ベース [1]。Red Hat の Pipelines as Code は Tekton の上の開発者向けレイヤ [9]。

### 主な代替

- **Argo Workflows**: 同じく Kubernetes ネイティブのワークフロー。DAG を CRD で書く点は近い。Argo は汎用ワークフロー寄り、Tekton は CI/CD の語彙で API を切っている
- **GitHub Actions / GitLab CI**: SaaS 込みの体験で勝る。Tekton はクラスタを自分で持つ側の選択
- **Jenkins / Jenkins X**: 同じ CDF 出身。Jenkins X は内部で Tekton を使う構成を採った
- **Dagger**: パイプラインをコードで書く方向。Kubernetes CRD ではない
- **Concourse**: 同じくコンテナベースだが Kubernetes CRD ではない

差は「Kubernetes の CRD として CI/CD を表現するか」に集約される。Tekton の主張はポータビリティ (どのクラスタでも同じ YAML) と、そこに供給網セキュリティ (Chains) を載せられること。

## write 段階への申し送り

- Internals は entrypoint の直列化を主役にする。ここが唯一無二で、かつコードを読まないと絶対に書けない
- 採用事例は上記の出典付きの名前だけ。Apple は使わない
- 「Tekton = Pipelines」ではないので、最初にファミリと本 repo の関係を 1 段落で置く
- 歴史は Knative Build → CDF → CNCF の 2 回の引っ越しが軸

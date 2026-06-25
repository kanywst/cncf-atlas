# recon: Volcano

調査メモ。自分用の密度。出典は `sources.md` の番号 + URL、コードは `file:line` で残す。`src/` は gitignored の shallow clone。

## 基本情報

- repo: `volcano-sh/volcano` (<https://github.com/volcano-sh/volcano>)
- pinned commit: `7110813b198e99d0282170ef022f51ceb43d9403` (master, 2026-06-24 commit "fix: use milli-units for scalar in-queue resources (#5391)")
- 近いタグ: `v1.15.0` (2026-06-01 リリース、HEAD はその後の master)
- 言語 / ビルド: Go (`go 1.25.0`, module `volcano.sh/volcano`) / `make` (`make all` → `vc-scheduler` `vc-controller-manager` `vc-webhook-manager` `vc-agent` `vc-agent-scheduler` `vcctl`)。テストは `make unit-test`、lint は `make lint`
- ライセンス: Apache-2.0 (`src/LICENSE` 冒頭 "Apache License Version 2.0"、GitHub API も `Apache-2.0`)。多くのファイルが kube-scheduler 由来のため Copyright に "The Kubernetes Authors" と "The Volcano Authors" が併記される
- CNCF 成熟度: Incubating (Accepted 2020-04-09 / Incubating 2022-03-21、出典 3 と 4)
- カテゴリ (tools.ts CATEGORY_ORDER から): Orchestration & Scheduling
- 主なバイナリ / エントリポイント: `src/cmd/scheduler/main.go` (vc-scheduler)、`src/cmd/controller-manager`、`src/cmd/webhook-manager`、`src/cmd/agent` (ノード QoS/colocation)、`src/cmd/cli` (vcctl)
- CRD は別 module `volcano.sh/apis` (`src/staging/src/volcano.sh/apis` に配置、`go.mod` の replace で参照): `batch.volcano.sh/v1alpha1 Job`、`scheduling.volcano.sh PodGroup`/`Queue`、`flow.volcano.sh JobFlow`/`JobTemplate`、`topology.volcano.sh HyperNode`

## 歴史の素材

- Huawei 発。kube-scheduler を拡張するバッチスケジューラとして 2019 年に登場。GitHub リポジトリ作成は 2019-03-14 (GitHub API `created_at`)。KubeCon Shanghai 2019 (6月) で OSS 化 [3]
- scheduler 部分は Kubernetes SIG-Scheduling の `kube-batch` (`kubernetes-sigs/kube-batch`) をベースにしている。README に明記され、issue [#241] / PR [#288] が出典 (`src/README.md` の NOTE ブロック)
- CNCF Sandbox 受理 2020-04-09。CNCF として最初のバッチコンピューティングプロジェクト (出典 3 と 4)
- CNCF Incubating 昇格 2022-03-21 (TOC 投票)、公式アナウンス 2022-04-07 [3]。Sandbox 参加時から昇格までで contributor 70+ → 350+、参加組織 5 → 50+ (Amazon/HP/Huawei/Google/Oracle 等) と CNCF blog が記載 [3]
- リリースは活発。最新は v1.15.0 (2026-06-01、GitHub Releases API)。1.x 系で Spark が built-in batch scheduler に Volcano を採用したのが普及の転機 [5]

## アーキテクチャの素材

トップレベルのプロセスは 4 つ + CLI。

- **vc-scheduler** (`src/pkg/scheduler/`): 本体。kube-scheduler とは別プロセスとして動き、Pod の `schedulerName` で振り分けて自前で bind する。セッションベースの周期スケジューリング
- **vc-controller-manager** (`src/pkg/controllers/`): CRD の reconcile。`job` (VolcanoJob → Pod/PodGroup 生成)、`podgroup` (通常 Pod → PodGroup 自動生成)、`queue`、`jobflow`/`jobtemplate` (DAG)、`cronjob`、`hypernode`、`garbagecollector`
- **vc-webhook-manager** (`src/pkg/webhooks/admission/`): validating/mutating admission。`jobs` `pods` `podgroups` `queues` `jobflows` `cronjobs` `hypernodes` 各サブパッケージ
- **vc-agent** (`src/cmd/agent`, `src/cmd/network-qos`): ノード常駐の colocation / QoS / network-qos エージェント (オンライン+オフライン混載向け、新しめの機能)
- **vcctl** (`src/cmd/cli`): CLI

### 代表オペレーション: 1 スケジューリングサイクル (allocate) を端から端まで

gang / fair-share を成立させる中核。`file:line` は pinned commit 基準。

1. 起動: `src/cmd/scheduler/main.go:38-40` で `actions` と `plugins` を blank import 登録。
2. ループ: `src/pkg/scheduler/scheduler.go:115` `go wait.Until(pc.runOnce, pc.schedulePeriod, stopCh)`。周期は ServerOption。
3. セッション開始: `scheduler.go:141` `ssn := framework.OpenSession(...)`。`runOnce` は設定された action 列を順に `action.Execute(ssn)` で回す (`scheduler.go:148-152`)。
4. `framework.OpenSession` (`src/pkg/scheduler/framework/framework.go:34-60`): cache のスナップショットから Session を作り、tier 順に各 plugin の `OnSessionOpen(ssn)` を呼んで各種 Fn (QueueOrderFn/JobOrderFn/TaskOrderFn/PredicateFn/NodeOrderFn/Overused/Allocatable/JobReady 等) を Session に登録する。
5. デフォルト設定 (`src/pkg/scheduler/util.go:38`): `actions: "enqueue, allocate, backfill"`、tier1 = `priority, gang, conformance`、tier2 = `overcommit, drf, predicates, proportion, nodeorder`。
6. allocate 本体 `src/pkg/scheduler/actions/allocate/allocate.go:122 Execute`:
   - `buildAllocateContext` (`:142`): Job を queue ごとに `PriorityQueue` へ。Pending Job は enqueue action 無しなら Inqueue に昇格 (`:154-164`)。`JobValid` / queue 存在 / network-topology readiness を確認。各 Job を SubJob/Task 単位の worksheet に整理 (`organizeJobWorksheet :208`、BestEffort と外部 scheduling gate 付き task をスキップ)。
   - `allocateResources` (`:283`): queue を `QueueOrderFn` 順に pop → `ssn.Overused(queue)` で超過 queue をスキップ → Job を `JobOrderFn` 順に pop。hard-topology / subjob policy 無しは `allocateResourcesForTasks` 経路 (`:340`)。
   - `allocateResourcesForTasks` (`:719`): task を `TaskOrderFn` 順に pop。`ssn.Allocatable(queue, task)` でキャパチェック (`:744`) → `PrePredicateFn` (`:779`) → `PredicateHelper.PredicateNodes` で filter (`:805`) → `prioritizeNodes` で idle / future-idle の 2 gradient に分けスコアリングし best node 選択 (`:833`、実装 `:880`)。
   - `allocateResourcesForTask` (`:951`): idle で足りれば `stmt.Allocate(task, node)` (`:955`)、future-idle (releasing) でしか足りなければ `stmt.Pipeline` で予約 (`:972`)。
   - SubJob が `SubJobReady`/`SubJobPipelined` を満たさなければ `stmt.Discard()` で巻き戻し (`:863`)。
7. トランザクション: `src/pkg/scheduler/framework/statement.go:246 Allocate` は **セッション内メモリだけ** を更新 (`job.UpdateTaskStatus(task, api.Allocated)`、`node.AddTask`)。operation を記録するだけで API server には触らない。
8. コミット判定: `allocate.go:314` / `:343` `if stmt != nil && ssn.JobReady(job) { stmt.Commit() }`。gang plugin が登録した `JobReady` が min-member を満たさないと commit しない = gang scheduling の all-or-nothing。
9. `Statement.Commit` (`statement.go:392`): 記録済み operation を実行。Allocate は `statement.go:317 allocate` で `cache.AddBindTask(bindContext)` を呼ぶ。
10. 実バインド: `src/pkg/scheduler/cache/cache.go:984 Bind` → `:231 DefaultBinder.Bind` が `kubeClient` 経由で API server に bind を書き込む。バインドは非同期ワーカー (`cache.go:874 go wait.Until(sc.processBindTask, ...)`) で消化。
11. セッション終了: `framework.CloseSession` (`framework.go:63`) が全 plugin の `OnSessionClose` を呼び、dirty job を cache に flush。

### 設計判断

- **Session + Statement の 2 相 / dry-run トランザクション**: action はまず Session のメモリ状態にだけ tentative な Allocate/Pipeline/Evict を積む。hyperNode (ネットワークトポロジ) ごとに `stmt.Discard()` で試行と巻き戻しを繰り返し、最良解だけ `RecoverOperations` で復元して `Commit` する (`allocate.go:386-458`)。gang の all-or-nothing と topology-aware 配置の両立がこの仕組みの肝。
- **action と plugin の分離**: action (enqueue/allocate/preempt/reclaim/backfill/...) が「いつ何をするか」、plugin (gang/drf/proportion/binpack/capacity/predicates/nodeorder/numaaware/task-topology/...) が比較関数・述語・スコアを提供する拡張点。両方とも ConfigMap で宣言的に有効化、`fsnotify` でホットリロード (`scheduler.go:219 watchSchedulerConf`)。
- **kube-scheduler とは別プロセスで共存**: 自前の cache (informer ベース) と自前 binder を持つ。`Pipeline` は preemption 用に「releasing 中リソース」を将来 idle として予約する概念。

## 内部実装の素材

重要ディレクトリ:

- `src/pkg/scheduler/actions/` : enqueue, allocate, backfill, preempt, reclaim, gangpreempt, gangreclaim, shuffle。`factory.go` で登録。
- `src/pkg/scheduler/plugins/` : 30 近い plugin。gang, drf, proportion, capacity, binpack, predicates, nodeorder, numaaware, task-topology, network-topology-aware, deviceshare, overcommit, tdm, sla, usage, rescheduling, resource-strategy-fit など。`factory.go`/`defaults.go` で登録。
- `src/pkg/scheduler/framework/` : Session/Statement/plugin registry の心臓部。
- `src/pkg/scheduler/api/` : スケジューラ内部のドメインモデル (CRD とは別の in-memory 型)。
- `src/pkg/scheduler/cache/` : informer → 内部 API 型への変換、bind ワーカー。
- `src/pkg/controllers/`, `src/pkg/webhooks/` : CRD 制御と admission。

中核データ構造 (3-5 個):

- `Session` (`src/pkg/scheduler/framework/session.go:65`): 1 サイクルの全状態スナップショット。`Jobs map[JobID]*JobInfo`、`Nodes`、`Queues`、`HyperNodes`、`RealNodesList`、加えて plugin が埋める数十個の関数マップ (`jobOrderFns`, `predicateFns`, `nodeOrderFns`, `preemptableFns`, `allocatableFns`, `jobReadyFns` ...)。寿命はサイクル内のみ。
- `JobInfo` (`src/pkg/scheduler/api/job_info.go:363`): 1 PodGroup に対応。`MinAvailable`、`TaskStatusIndex map[TaskStatus]TasksMap` (状態別 task 索引)、`Allocated`/`TotalRequest *Resource`、`SubJobs`、`NetworkTopology`。gang の min-member 判定はここを見る。
- `TaskInfo` (`src/pkg/scheduler/api/job_info.go:118`): 1 Pod に対応。`Resreq`/`InitResreq *Resource`、`DRAResreq` (Dynamic Resource Allocation)、`TransactionContext` (現在の割当先 NodeName/Status)、`Priority`、`Preemptable`、`BestEffort`、`SchGated`。
- `Resource` (`src/pkg/scheduler/api/resource_info.go:60`): CPU/Memory + ScalarResources (GPU/NPU 等) を保持する量モデル。`LessEqual`/`FutureIdle` 比較がスケジュール判定の基礎。
- `Statement` (`src/pkg/scheduler/framework/statement.go`): tentative operation の列。`Allocate`(:246) `Pipeline`(:140) `Evict` をメモリに積み、`Commit`(:392) / `Discard` / `RecoverOperations` で確定・破棄・復元。dry-run トランザクションの実体。

意外だった / 非自明な点:

- `Statement.Allocate` は API server に一切書かない。実 bind は `Commit` 経由の `cache.AddBindTask` → 非同期 bind ワーカーまで遅延する。スケジューラのほぼ全ロジックは「メモリ上の試行 + 巻き戻し」で完結している。
- hyperNode (ネットワークトポロジ) 探索は gradient 単位の総当りで、各 hyperNode を clone した worksheet で dry-run → スコア比較 → 最良だけ復元、という探索アルゴリズム (`allocate.go:370-463`)。topology-aware と subjob は近年の大きな追加で、TODO コメント上も「いずれ通常経路と統合」とある (`allocate.go:306-307`)。
- `NominatedHyperNode` の fast path (`allocate.go:595 allocateFromNomination`): preempt/reclaim が指名したノードを優先採用し、検証に外れたら指名をクリアして通常経路にフォールバック。
- デフォルトで preempt/reclaim は無効 (`util.go:38` の default conf は enqueue/allocate/backfill のみ)。優先度ベースの退避は ConfigMap で明示的に action を足す必要がある。

## 採用事例の素材

出典は Volcano community の `adopters.md` ([6]、Production 記載分):

- Huawei Cloud, Tencent, Baidu, IQIYI, Xiaohongshu, DiDi, Bosszhipin, Ruitian Capital, iFlytek (IFLYTEK), Kingsoft Cloud, Momenta, Zoom など (Production)
- iFlytek は CNCF End User Case Study でも取り上げられた (要 CNCF ケーススタディ URL の二次確認、現状は adopters.md 起点)
- Spark が built-in の batch scheduler として Volcano を採用 [5]

採用シグナル (2026-06-25 時点、GitHub API):

- stars 5,699 / forks 1,415 / open issues 657
- contributors: GitHub contributors API の last ページ = 447 (匿名含む)、"447+" 規模
- CNCF blog: Sandbox→Incubating で contributor 70+→350+、組織 5→50+ [3]

## 代替・エコシステム

- **エコシステム / 統合**: Spark, Flink, Ray, PyTorch, TensorFlow, MindSpore, PaddlePaddle, Kubeflow, MPI/Horovod, Argo, KubeGene などのバッチ/AI フレームワークと統合 (README)。GPU/NPU 等ヘテロデバイス対応。`volcano-sh/volcano-global` でマルチクラスタ federation スケジューラ。
- **代替**:
  - 標準 `kube-scheduler`: gang/fair-share/queue が無い。Volcano はこれを置換 or 共存して補う。
  - `kube-batch` (`kubernetes-sigs/kube-batch`): Volcano scheduler の前身。現在はほぼ非活発、Volcano が後継。
  - Apache YuniKorn (CNCF): 同じく Kubernetes 向けバッチ/キュー対応スケジューラ。階層キューが中心。Volcano は VolcanoJob CRD によるジョブライフサイクル管理 + 豊富な plugin (NUMA/device/topology) が差別化点。
  - Kueue (Kubernetes SIG): キューイング/クォータに特化。Volcano はスケジューリングアルゴリズム自体まで踏み込む点が異なる。
  - YARN 等の従来 HPC/ビッグデータスケジューラ: Kubernetes ネイティブでない。

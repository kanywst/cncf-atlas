# recon: armada

調査メモ。Armada は複数 Kubernetes クラスタにまたがるバッチジョブの高スループットスケジューラ。G-Research 発、CNCF Sandbox。読んだコードは `research/armada/src` の clone (下記 commit) を参照。

## 基本情報

- repo: `armadaproject/armada` (旧 `G-Research/armada`。CNCF 参加時に org 移動)
- pinned commit: `85b582dedbf1e4a0c049ff3255bf23fda83fd3b4` (commit date 2026-06-25) / 近いタグ: `v0.21.5` (2026-06-17 release、commit はこのタグより後・次タグより前。shallow clone なので `git describe` は不可)。アクセス時点 (2026-06-26) の最新 release は `v0.21.6` (2026-06-26)
- 言語 / ビルド: Go (`go.mod` の `go 1.26.1`) / `mage` ベース (`magefiles/` 配下に `go.go`, `dev.go`, `docker.go` 等)。ローカルは `mage dev:up` で redis/postgres/pulsar を compose 起動 (README:76-81)
- ライセンス: Apache-2.0 (`LICENSE` 冒頭 "Apache License Version 2.0"、GitHub API の `spdx_id` も `Apache-2.0`)
- CNCF 成熟度: Sandbox (受理日 2022-07-25、`cncf.io/projects/armada`)
- カテゴリ: Orchestration & Scheduling
- main entrypoint: 各コンポーネントが `cmd/<component>/main.go` を持つ。例: `cmd/server/main.go:38` の `func main()`。コンポーネントは `cmd/` 配下に server, scheduler, executor, lookout, binoculars, eventingester, scheduleringester, lookoutingester, armadactl, simulator など

## 歴史の素材

- G-Research が社内のバッチ需要 (ML/AI/データ解析、数万ノード) を Kubernetes 上で捌くために開発。repo 作成は 2019-06-19 (gh API)
- 公開紹介: CNCF blog "Armada – how to run millions of batch jobs over thousands of compute nodes using Kubernetes" (2021-01-25)
- CNCF Sandbox 受理: `cncf.io/projects/armada` 記載で 2022-07-25。なお G-Research / CNCF の "Armada: Six months in the sandbox" は 2023-08 公開でタイムラインに差があるため、受理日は CNCF プロジェクトページの記載を一次採用する
- CNCF 参加に伴い repo を `G-Research` org から CNCF 専用の `armadaproject` org へ移動

## アーキテクチャの素材

イベントソーシング型。Apache Pulsar が log-based message broker で、ログが source of truth (`docs/system_overview.md:62-70`)。各サブシステムは「Pulsar からメッセージ受信 → 内部状態更新 / Pulsar へ publish」のサイクルで動く。状態は Pulsar 再生で復旧可能。

control plane のサブシステム (`docs/system_overview.md:54-60`):

- Job submission and control: submit / reprioritise / cancel の API
- Job state querying / streaming: 状態問い合わせと購読
- Scheduler: ジョブをクラスタ・ノードに割り当て
- Lookout: ジョブ状態の Web UI

executor は worker cluster ごとに 1 つ動き、control plane と Kubernetes API の橋渡しをする (`docs/system_overview.md:21`)。ジョブは scheduler が割り当てを決めると leased 状態になり、executor が当該クラスタに pod を起こす (`docs/system_overview.md:45`)。

依存ミドルウェア: Pulsar (イベントログ)、PostgreSQL (scheduler / lookout の永続ストア・dedup)、Redis (ローカル開発 stack に含まれる、README:81)。

### 中核オペレーションを端から端まで: ジョブ投入

ユーザは pod spec + Armada メタデータを `armadactl` または gRPC/REST で submit する。サーバ側ハンドラの実体:

- 入口 `func (s *Server) SubmitJobs(...)` (`internal/server/submit/submit.go:72`)。この `Server` は「旧 Armada submit API を受けて Pulsar にメッセージを publish するサービス」(`internal/server/submit/submit.go:30-31` の型コメント、struct は `:32`)
- 認可: `s.authorize(ctx, req.Queue, permissions.SubmitAnyJobs, queue.PermissionVerbSubmit)` (`internal/server/submit/submit.go:76`)。失敗時 `codes.PermissionDenied`
- バリデーション: `validation.ValidateSubmitRequest(req, s.submissionConfig)` (`:82`)。失敗時 `codes.InvalidArgument`
- 重複排除: `s.deduplicator.GetOriginalJobIds(ctx, req.Queue, req.JobRequestItems)` (`:88`)。`ClientId` 既出なら既存 jobId を返して skip (`:101-106`)。dedup は best-effort で、エラーでも致命ではない (`:90-92`)
- 変換: 非重複の各 `JobRequestItem` を `conversion.SubmitJobFromApiRequest(...)` で `armadaevents` の SubmitJob イベントに変換 (`:109`)。`EventSequence_Event_SubmitJob` として詰める (`:111-116`)
- publish: `EventSequence` を組み立て (`:133-139`)、`s.publisher.PublishMessages(ctx, es)` で Pulsar へ送る (`:141`)。失敗時 `codes.Internal` "Failed to send events to Pulsar"
- publish 成功後に dedup id を保存 (`s.deduplicator.StoreOriginalJobIds`、`:149`)。コメント通り Pulsar 部分失敗時は重複ジョブが起きうる (`:147-148`)

つまり submit はジョブを直接 DB に書かず Pulsar に publish するだけ。以降は scheduler が引き取る。

scheduler は leader だけがスケジュールする (`internal/scheduler/scheduler.go:49-50`、`:56` "Only the leader publishes")。`func (s *Scheduler) Run(...)` (`:147`) が `cyclePeriod` ごとに ticker で回り (`:159`, `:164-169`)、leader になった瞬間は `ensureDbUpToDate` で Pulsar に追いつくまで待つ (`:186-189`)。1 サイクルの本体は `func (s *Scheduler) cycle(...)` (`internal/scheduler/scheduler.go:281`)。

### 非自明な設計判断: インメモリ・トランザクショナル jobdb (copy-on-write)

scheduler は Postgres を source-of-truth にしつつ、スケジューリング判断は全ジョブのインメモリ複製 `JobDb` 上で行う。`JobDb` は永続的イミュータブルデータ構造 (`github.com/benbjohnson/immutable`) で組まれている (`internal/scheduler/jobdb/jobdb.go:7`, `:68-76`)。フィールドは `*immutable.Map` や `immutable.SortedSet` で、queue 別・pool+queue 別・gang 別などのインデックスを持つ (`:69-76`)。

トランザクションモデル:

- `ReadTxn()` は `copyMutex` を取った上で現行の root ポインタをそのまま共有する read-only スナップショット (`internal/scheduler/jobdb/jobdb.go:345-362`)
- `WriteTxn()` は `writerMutex` で単一 writer を保証し、map 系のみ clone してイミュータブル set/map はポインタ共有のコピーを作る (`:367-385`)。"Only a single write transaction may access the db at any given time" (`:365`)
- `Commit()` は `copyMutex` 下で新しい root ポインタ群を JobDb に差し替えて `writerMutex` を解放する (`:459-474`)。読者は古い不変スナップショットを見続けられる
- `DryRunTxn()` は隔離スナップショット上で変更を試し、Commit は no-op (`:387-408`, `:463-466`)。投機的スケジューリング用

要は MVCC (Multi-Version Concurrency Control、多版型同時実行制御) 的スナップショット分離をインメモリで実現し、スケジューリングのホットループを Postgres I/O から切り離している。`Txn` 型コメント "Transactions provide a consistent view of the database, allowing readers to perform multiple actions without the database changing from underneath them" (`:423-426`)。

## 内部実装の素材

### 中核データ構造

1. `JobDb` (`internal/scheduler/jobdb/jobdb.go:68`): scheduler のインメモリ DB。イミュータブル map/set でジョブを多重インデックス化。string interning でメモリ節約 (`:82-83`)、`copyMutex`/`writerMutex` で並行制御 (`:84-86`)
2. `Txn` (`internal/scheduler/jobdb/jobdb.go:427`): JobDb のスナップショットトランザクション。`readOnly` / `dryRun` フラグと各インデックスの root ポインタを保持 (`:427-457`)
3. `Job` (`internal/scheduler/jobdb/job.go:23`): スケジューラ内部のジョブ表現
4. `submit.Server` (`internal/server/submit/submit.go:32`): submit API を Pulsar publish に橋渡しするゲートウェイ。`publisher`, `queueCache`, `deduplicator`, `authorizer` を保持 (`:33-41`)
5. `DominantResourceFairness` (`internal/scheduler/scheduling/fairness/fairness.go:34`): Dominant Resource Fairness (DRF、複数資源下での公平配分) の実装。`UnweightedCostFromAllocation` / `WeightedCostFromAllocation` で割当からコストを算出 (`fairness.go:30-31`)。`NewDominantResourceFairness(totalResources, pool, config)` (`:43`)
6. `NodeDb` (`internal/scheduler/nodedb/nodedb.go:77`): ノードをインメモリ (hashicorp `go-memdb` の `*memdb.MemDB`、`nodedb.go:79`) で保持し、indexed resource / priority / taint でインデックスを張って割当可能ノードを効率検索。doc コメント "NodeDb is the scheduler-internal system used to efficiently find nodes on which a pod could be scheduled" (`nodedb.go:76`、struct `:77`)

### 追う価値のあるパス

- submit → Pulsar: `internal/server/submit/submit.go:72-153`
- scheduler メインループ: `internal/scheduler/scheduler.go:147` (Run) → `:281` (cycle)
- jobdb トランザクション: `internal/scheduler/jobdb/jobdb.go:345`/`367`/`459`
- スケジューリングアルゴリズム群: `internal/scheduler/scheduling/` (preempting_queue_scheduler.go, gang_scheduler.go, fairness/, optimiser/, pricer/, market_*)

### 機能の素材 (WebSearch 由来、コードと整合)

複数ユーザ間の fair queuing/scheduling (DRF ベース)、リソース・レート制限、gang-scheduling (関連ジョブを atomic に)、job preemption。Prometheus 連携の analytics、高失敗率ノードの自動除外、ノードの earmark。出典: README / armadaproject.io overview。

## 採用事例の素材

- ADOPTERS ファイル (`ADOPTERS.md`) に公開記載は **G-Research のみ**。"uses Armada in production to process millions of jobs daily across tens of thousands of nodes"。他組織は ADOPTERS には未記載。捏造しない
- それ以外は GitHub シグナルで代替

GitHub シグナル (gh API、2026-06-26 取得): stars 602、forks 166、open issues 109、contributors 約 102 (contributors API の last page=102, per_page=1)。repo 作成 2019-06-19、最終 push 2026-06-26。最新 release `v0.21.6` (2026-06-26)。

## 代替・エコシステム

- **Volcano** (CNCF Incubating): Kubernetes 上のバッチスケジューラ。ただし単一クラスタ内スケジューラ寄り。Armada はマルチクラスタの meta-scheduler で out-of-cluster キューイングを行う点が本質差
- **Kueue** (Kubernetes SIG): クラスタ内ジョブキューイング。やはり単一クラスタ志向
- **Apache YuniKorn**: バッチ/データ向け K8s スケジューラ
- **Karmada / Open Cluster Management**: マルチクラスタだが汎用ワークロード連携で、バッチ高スループットキューイングが主眼ではない
- Armada の差別化: 数万ノード・複数クラスタを跨ぎ、etcd を経由せず専用ストレージ層で数百万ジョブのキューを保持する点 (CNCF/G-Research blog)。ML/AI/データ解析の大量バッチが主用途
- 統合先: Apache Pulsar (必須の event log)、PostgreSQL、Prometheus (metrics)、Airflow operator (`docs/armada_airflow_operator.md`)、Python/Java/.NET クライアント (`magefiles/python.go`, `java.go`, `dotnet.go`, `docs/client_libraries.md`)

## install / 最小起動 (README:76-81)

ローカル開発スタックは mage で立つ。`research/armada/src` 内で:

```bash
mage dev:up               # redis/postgres/pulsar を compose 起動、DB 作成・migration 適用、goreman で全コンポーネント前面起動
mage dev:up fake-executor # Kubernetes クラスタ不要のフェイク executor 版
mage dev:down             # 後片付け
```

その後 `armadactl` でキュー作成・ジョブ投入。auth 付きは `mage dev:up auth` で Keycloak 経由 OIDC。

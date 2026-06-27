# recon: Cadence Workflow

調査メモ。出典は URL 付き。コード参照は `research/cadence-workflow/src` の `path:line`。

## 基本情報

- repo: `cadence-workflow/cadence` (旧 `uber/cadence`、`go.mod` の module は今も `github.com/uber/cadence`)
- pinned commit: `66dcbafb3089050e436f571eab288f6d51a34993` (2026-06-25) / 近いタグ: `v1.4.1-prerelease31`
- 最新の安定リリース: `v1.4.0` (2026-02-27)
- 言語 / ビルド: Go 1.24 (`go.mod:3`) / `make bins` (全バイナリ)、`make test` (root module 単体テスト)
- ライセンス: Apache-2.0 (`LICENSE` 冒頭が `Apache License Version 2.0`、GitHub API の `spdx_id` も `Apache-2.0`)
- CNCF 成熟度: Sandbox (受理 2025-05-22)
- カテゴリ: Orchestration & Scheduling
- main entrypoint: `cmd/server/main.go:38` の `main()` が `cadence.BuildCLI(...)` を呼ぶ。永続化プラグイン (Cassandra / MySQL / Postgres / SQLite / Kafka / gcloud archiver) は blank import で読み込む (`cmd/server/main.go:27-35`)

DE (durable execution、耐障害な持続実行): プロセスやノードが落ちても、実行履歴 (event history) から状態を復元してワークフローを途中から継続する仕組み。Cadence の中核概念。

## 歴史の素材

- 2015 年に Maxim Fateev と Samar Abbas が Uber Seattle で合流し Cadence を作った。AWS Simple Workflow Service と Azure Durable Functions の思想を別スタックで再実装したもの。出典: [ia40 Temporal Founders interview](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev)。
- 2017 年に OSS 化 (`README.md:8` "open-source platform since 2017"、GitHub `created_at` は 2017-02-21)。Uber 内で 3 年でゼロから 100 ユースケースに成長し、HashiCorp / Coinbase / DoorDash 等が外部採用。出典: 同上。
- 2019 年に創業者 2 人が Uber を離れ Temporal を創業、Cadence を fork (Thrift から protobuf、独自 RPC から gRPC へ移行)。Temporal は MIT。出典: [ia40](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev)、[Amplify Partners](https://www.amplifypartners.com/blog-posts/our-investment-in-temporal)。fork の名残はコード冒頭の著作権表記にも残る (`service/history/engine/engineimpl/start_workflow_execution.go:2` "Portions of the Software are attributed to Copyright (c) 2021 Temporal Technologies Inc.")。
- 2025-05-22 に CNCF Sandbox 受理。出典: [CNCF project page](https://www.cncf.io/projects/cadence-workflow/)、[Uber Blog](https://www.uber.com/us/en/blog/cadence-workflow-joins-the-cloud-native-computing-foundation/)、[cadenceworkflow.io blog](https://cadenceworkflow.io/blog/2025/10/06/cadence-joins-cncf-cloud-native-computing-foundation)。GitHub org は `cadence-workflow` に移行済み、Slack は CNCF ワークスペースの #cadence-users。

## アーキテクチャの素材

サーバは 4 つの role に分かれる (`CLAUDE.md` の Repository layout、`service/` 配下)。

- frontend: 全 API のステートレスな受け口。認証・バリデーション・レート制限・ルーティング。
- history: 中核。ワークフロー実行状態 (mutable state) と event history を所有し、shard 単位で分割。
- matching: task list (task queue) をホストし、decision/activity task を worker に配る。
- worker (system): replicator、archiver、scanner 等の内部システムワークフローを実行。
- 新しめに `service/sharddistributor` も存在 (shard 割当の分散管理)。

永続化は Cassandra / MySQL / PostgreSQL (+ 任意で Kafka + Elasticsearch を可視性に使用)。クライアント worker (Go/Java SDK) はユーザの workflow / activity を実装し、別プロセスで動く (`README.md:13-15`)。

### 代表オペレーションの一気通貫: StartWorkflowExecution

frontend 側 (`service/frontend/api/handler.go`):

- `WorkflowHandler.StartWorkflowExecution` (`handler.go:1650`) がエントリ。shutting down チェック後 (`:1654`)、`validateStartWorkflowExecutionRequest` (`:1658`) で domain/workflowID/RequestID(UUID)/WorkflowType/各種 ID 長を検証 (`:1694` 以降)。
- domain 名から domainID 解決 (`handler.go:1663` `GetDomainCache().GetDomainID`)。
- `common.CreateHistoryStartWorkflowRequest` で history 用リクエストに変換 (`handler.go:1667`)。
- `GetHistoryClient().StartWorkflowExecution` で history service へ転送 (`handler.go:1687`)。

history 側 (`service/history/engine/engineimpl/start_workflow_execution.go`):

- `historyEngineImpl.StartWorkflowExecution` (`start_workflow_execution.go:53`) が domain を引き (`:57`)、`startWorkflowHelper` に委譲 (`:62`)。失敗時は `handleCreateWorkflowExecutionFailureCleanup` で孤立した history branch を後始末 (`:69`、実装 `:354`)。
- `startWorkflowHelper` (`:82`): domain が登録済みか確認 (`:89`)、リクエスト再検証 (`:94`)、decision timeout 上書き (`:98`)。
- 同一 workflowID への並行 start を防ぐため current execution をロック取得 (`:109` `GetOrCreateCurrentWorkflowExecution`、deadline 超過は `ErrConcurrentStartRequest` `:116`)。
- 新しい RunID を採番 (`:124` `uuid.New()`) し `createMutableState` で空の mutable state を構築 (`:126`、実装 `:1001`)。`createMutableState` は active cluster 確認後 `NewMutableStateBuilderWithVersionHistories` (`:1021`) と `SetHistoryTree(runID)` (`:1028`) を呼ぶ。
- `addStartEventsAndTasks` (`:181`、実装 `:866`) が `AddWorkflowExecutionStartedEvent` (`:873`) を積み、`generateFirstDecisionTask` (`:901`、実装 `:1035`) で最初の decision task をスケジュール (子 WF でなければ `AddFirstDecisionTaskScheduled` `:1043`)。
- `CloseTransactionAsSnapshot` で書き込みバッチを確定 (`:204`)、`PersistStartWorkflowBatchEvents` で event history を永続化 (`:211`)。
- `CreateWorkflowExecution` を `CreateWorkflowModeBrandNew` で実行 (`:218`, `:236`)。冪等性: 重複リクエストは `AsDuplicateRequestError` で既存 RunID を返す (`:245`)、既に同一 RequestID で起動済みなら `WorkflowExecutionAlreadyStartedError` を吸収 (`:255`)。`TerminateIfRunning` ポリシーなら既存 run を停止して張り替え (`:289` `shouldTerminateAndStart`、`:296` `terminateAndStartWorkflow`)。
- 成功時 `StartWorkflowExecutionResponse{RunID}` を返す (`:349`)。

この後の実行は event-sourcing で進む。worker が matching 経由で decision task を pull、SDK 上で workflow 関数を replay、次の決定 (activity 起動など) を history に commit、という決定ループが回る。

## 内部実装の素材

中核データ構造:

- `MutableState` interface (`service/history/execution/mutable_state.go:60`): 1 つの run の「今の状態」をメモリ上に表す巨大インターフェース。`AddWorkflowExecutionStartedEvent` (`:106`)、`AddDecisionTaskScheduledEvent` (`:82`)、`GetExecutionInfo` (`:134`)、`CopyToPersistence` (`:110`) 等。event history から導出される派生状態。
- `WorkflowExecutionInfo` struct (`common/persistence/data_manager_interfaces.go:392`): 永続化される実行レコード。`DomainID`/`WorkflowID`/`RunID` (`:393-395`)、`State`/`CloseStatus` (`:409-410`)、`NextEventID` (`:413`)、decision 関連フィールド群 (`:419-427`)、retry policy (`:442-449`)、`BranchToken` (`:450`)。
- `HistoryEvent` struct (`common/types/shared.go:3574`): event history の 1 件。append-only な真実の源で、mutable state はこれを畳んで作る。
- `shard.Context` interface (`service/history/shard/context.go:55`): history を分割する shard の所有者。`GenerateTaskID` (`:79`)、`GetRangeID` (`:65`)、`CreateWorkflowExecution`/`UpdateWorkflowExecution` (`:109-110`) 等、shard 単位の書き込みを束ねる。
- `types.WorkflowExecution` (workflowID と runID の組): エンジン内で実行を一意に指す値 (`start_workflow_execution.go:122`)。

### 非自明な設計判断: rangeID による shard fencing

history service は分散ロックを使わず「shard ごとに単一書き手」を rangeID という monotonic な世代番号で保証する。

- shard を掴む/更新するとき `renewRangeLocked` (`service/history/shard/context.go:1117`) が `RangeID++` し (`:1119`)、`UpdateShard` を `PreviousRangeID` 条件付きで投げる (`:1128-1130`)。
- 誰かに shard を奪われていれば `ShardOwnershipLostError` が返り、自分の shard を閉じてエンジンを落とす (`:1133-1139`)。
- 成功すると task ID 採番レンジを `rangeID << RangeSizeBits` で確保する (`:1157-1158`)。task ID は `generateTaskIDLocked` (`:1098`) が `taskSequenceNumber++` で払い出し (`:1103-1104`)、レンジを使い切ると `updateRangeIfNeededLocked` 経由で renew (`:1109-1114`)。

効果: 旧オーナーが古い rangeID のレンジで書こうとしても条件付き更新が落ちるので、ネットワーク分断下でも 2 重書き込みが起きない。同時に task ID が単調増加かつグローバルに一意になり、transfer/timer queue の順序処理に使える。重いロックサービス無しで強整合を取る、という Cadence の根幹。

## 採用事例の素材

`ADOPTERS.md` (リポジトリ内、出典として信頼可) の Production Users:

- Uber Technologies: 2000+ の Cadence domain (ユースケース)、20+ の環境、一部は 400+ domain をホスト。infra rollout / ML 学習 / 決済 / オンボーディング等 (`ADOPTERS.md`)。
- NetApp (Instaclustr): 数万台規模のフリート保守を Cadence で orchestrate、マネージド Cadence も提供 (`ADOPTERS.md`)。
- DoorDash: ETA / Fulfillment / Order Management / Catalog / Ads 等で利用 (`ADOPTERS.md`)。
- Cloudera: control plane の中核、Cloudera Data Warehouse 含む provisioning / backup-restore に利用 (`ADOPTERS.md`)。

第三者記事でも Uber / DoorDash / Coinbase が言及される ([Instaclustr blog](https://www.instaclustr.com/blog/cadence-workflow-uber-cncf-projects/))。歴史的には HashiCorp も初期外部採用 ([ia40](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev))。

GitHub シグナル (2026-06-27 時点、GitHub API): stars 9,358 / forks 898 / watchers 1,418 / contributors 約 178 / open issues 192。

ガバナンス: TSC 4 名 + Maintainers 多数 (`MAINTAINERS.md`)。CNCF Sandbox project として CNCF が中立ホスト。

## 代替・エコシステム

- Temporal: 最も近い兄弟。Cadence の創業者が 2019 に fork、MIT ライセンス。code-as-workflow / durable execution の思想は同じで、Thrift から protobuf・独自 RPC から gRPC を移行済み。出典: [ia40](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev)、[Cadence vs Temporal FAQ](https://cadenceworkflow.io/faq/cadence-vs-temporal)。
- Netflix Conductor / Conductor OSS (Orkes): JSON/DSL で workflow を定義する型。Cadence は DSL を使わずネイティブ言語コードで書ける点が本質的に違う。
- Apache Airflow / Argo Workflows: DAG ベースのバッチ/データパイプライン・スケジューラ。Cadence は任意の制御フロー (ループ・条件・長時間待機・signal) を持つ汎用 durable execution で、用途が異なる。
- AWS Step Functions / Azure Durable Functions: マネージドな同系統サービス。Cadence の思想的ルーツ (Simple Workflow / Durable Task Framework) でもある。

エコシステム / 統合:

- 公式 SDK: [Go](https://github.com/cadence-workflow/cadence-go-client)、[Java](https://github.com/cadence-workflow/cadence-java-client)。非公式 Python / Ruby SDK あり (`README.md:40`)。
- UI: [cadence-web](https://github.com/cadence-workflow/cadence-web) (`localhost:8088`)。
- DSL レイヤ: [iWF](https://github.com/indeedeng/iwf) が Cadence 上で動く (`README.md:42`)。
- Helm chart: [cadence-charts](https://github.com/cadence-workflow/cadence-charts)、Kubernetes デプロイ導線あり (`README.md:32-34`)。
- ストレージ: Cassandra / MySQL / PostgreSQL / SQLite、可視性に Elasticsearch / OpenSearch / Pinot、非同期 WF に Kafka (`docker/` の compose 群、`cmd/server/main.go:27-35`)。

## インストールと最小起動

ローカル最小 (Docker):

```bash
git clone https://github.com/cadence-workflow/cadence.git
cd cadence
docker compose -f docker/docker-compose.yml up
```

UI は `http://localhost:8088`、サンプルは [cadence-samples](https://github.com/cadence-workflow/cadence-samples) (Go) / [cadence-java-samples](https://github.com/cadence-workflow/cadence-java-samples) (`README.md:17-29`)。

Docker 無しの最速ローカル開発は SQLite (`CLAUDE.md`):

```bash
make install-schema-sqlite
./cadence-server --zone sqlite start
```

CLI: `brew install cadence-workflow` か `docker run --rm ubercadence/cli:master` (`README.md:48-51`)。

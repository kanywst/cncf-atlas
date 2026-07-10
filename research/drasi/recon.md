# recon: Drasi

調査メモ。自分用の密度。出典は sources.md の番号で対応。file:line は下記 pin コミットで検証済み。

## 基本情報

- repo: `drasi-project/drasi-platform` (git remote で確認済み) [S1]
- pinned commit: `62b10c72aa87bc1d8d76964abaca46d6fb53fa85` / 近いタグ: `0.10.0` (タグから 18 コミット先, `git describe` = `0.10.0-18-g62b10c7`)
- サブモジュール: クエリエンジン本体 `project-drasi/drasi-core` を `query-container/query-host/drasi-core` に vendored。pin: `a0273f22e6063832070f99ddb32168f0381f6eb1` (`.gitmodules` 参照)
- 言語: **Rust** がコアエンジン・コントロールプレーン・sources 共有基盤 (764KB, 438 `.rs`)、**Go** が CLI (`cli/`, 234KB)。加えて **C#/.NET** の SDK と一部 reaction (GitHub 言語統計ではバイト数最大 967KB)、TypeScript の一部 reaction/dev-tool。「Rust + Go が中核、SDK 層で .NET/JS/Python/Java も」という構成 [S1]
- ライセンス: Apache 2.0 (`LICENSE` ファイル、Azure ブログ [S3] でも明記)
- CNCF 成熟度: **Sandbox** (2025-01-21 受理) [S2]
- カテゴリ (tools.ts の CATEGORY_ORDER から): **Messaging & Streaming** (change data processing / 継続的クエリ。ストリーム処理・CDC 隣接ドメイン)
- 開発元: Microsoft Azure Incubations チーム (Dapr, KEDA, Radius, Copacetic と同じチーム) [S3]
- 一言: データの変化を検知し、Cypher で書いた継続的クエリで評価し、リアクションを自動発火させるプラットフォーム。「変化に対する反応」を、データを中央にコピーせず・繰り返しポーリングせずに実現する [S3]

### 旧コードネーム reactive-graph の痕跡

クエリエンジンは元々 "Reactive Graph" と呼ばれていた。src 内に残る痕跡:

- `query-container/query-host/drasi-core/shared-tests/src/use_cases/rolling_average_decrease_by_ten/queries.rs:18` に `apiVersion: query.reactive-graph.io/v1`
- 同 `crosses_above_three_times_in_an_hour/queries.rs:18` も同様
- `.../use_cases/incident_alert/data.rs:29` にノード `"name": "Reactive Graph"`
- 文字列関数テスト (`evaluation/functions/text/tests/replace_tests.rs:56-57` 等) で `reactive-graph` → `drasi` に置換するサンプルが残っている

## 歴史の素材

- **2024-10-09**: Microsoft Azure Incubations が Drasi をオープンソースとして公開。Azure ブログで Mark Russinovich (Azure CTO) が発表。当初から Apache 2.0、CNCF Sandbox 申請済みと明記。プリビルトの Source/Reaction として PostgreSQL, Microsoft Dataverse, Azure Event Grid を提示 [S3]
- **2025-01-21**: CNCF Sandbox に正式受理 (CNCF プロジェクトページ [S2]、cncf/sandbox issue #296 [S6]、Palark の「2025年1月の 13 プロジェクト」まとめ [S7])
- **2025-06-10**: Microsoft Open Source ブログが「Drasi accepted into CNCF sandbox」を改めて告知 [S4]
- リポジトリ `createdAt` は 2024-05-27 (公開前の準備期間、gh API [S1])。クローンは shallow なので初コミット断定には使わない
- 命名の由来: 継続的クエリエンジンの旧称は "Reactive Graph"。上記 reactive-graph 痕跡がその名残

## アーキテクチャの素材

Drasi は Kubernetes 上に載る (CLI が k8s へインストール、コントロールプレーンは Rust の operator)。3 つのユーザー概念 + それを支える内部サービス群。

### 3 つのユーザー概念 (README / 公式 concepts)

- **Sources**: 外部システム (DB, メッセージング等) に接続し、ログ/change feed を監視して変更を Drasi 内部イベントに変換する。リレーショナル DB は Debezium ベース (`sources/relational/debezium-reactivator`)。他に cosmosdb, dataverse, eventhub, kubernetes。Source SDK は rust/java/dotnet [S5, S8]
- **Continuous Queries**: 監視中の変更を **Cypher** で評価し続ける「常時更新されるクエリ結果集合」。点在するデータをコピーせず、変更差分だけで結果集合を増分更新する [S8]
- **Reactions**: 継続的クエリの結果集合の変化 (added / updated / deleted) を購読し、アクションを起こす。同梱: http, signalr, gremlin, dapr, debezium, sql, aws, azure, power-platform, sync-vectorstore, mcp 等。Reaction SDK は python/dotnet/javascript [S9]

### 内部サービス (実装単位)

- `control-planes/mgmt_api` (Rust): 宣言的リソース (Source/Query/Reaction) を受け取る管理 API。`kubernetes_provider` (Rust) が operator として controller / actors / spec_builder で k8s リソースへ具現化 (`control-planes/kubernetes_provider/src/`)
- `query-container/` (Rust): 継続的クエリのランタイム。3 サービス:
  - `publish-api`: source からの変更を受ける入口。Redis Stream へ XADD
  - `query-host`: 各クエリを Dapr 仮想アクターとして走らせ、変更を消費して増分評価し、結果を発行
  - `view-svc`: クエリ結果ビューを MongoDB 等に永続化 (`mongo_view_store.rs`)
- `infrastructure/comms-*` (Rust): Dapr / HTTP の通信抽象
- `sources/shared` (Rust): `change-router`, `change-dispatcher`, `query-api` — source 側の変更ルーティングとブートストラップ供給の共通部品
- `cli/` (Go): `drasi` CLI。apply/list/describe/delete/tunnel/wait/install 等 (`cli/cmd/*.go`)

### 代表オペレーションの end-to-end トレース (source 変更 → 継続的クエリ → reaction)

例: リレーショナル source の 1 行が UPDATE され、継続的クエリの結果が変わり、reaction が発火するまで。全ホップに file:line。

1. **Source が変更を捕捉して publish-api に POST**。reactivator (Debezium) が DB の変更を拾い、Drasi の `SourceChange` に変換して query container の publish-api へ送る。publish-api は `/change` エンドポイントを持つ (`query-container/publish-api/src/main.rs:59` 付近, `.route("/change", post(change))`)
2. **publish-api が Redis Stream に XADD**。`Publisher::publish` がトピック `{query_container_id}-publish` に `xadd` する (`query-container/publish-api/src/publisher.rs:78`)。トピック名は `main.rs:45` の `format!("{query_container_id}-publish")`
3. **query-host がストリームを消費**。`QueryWorker` が `RedisChangeStream` を購読。Redis Streams の consumer group を使う (`query-container/query-host/src/change_stream/redis_change_stream.rs:51` で `xgroup_create_mkstream`)。worker のメインループが `change_stream.recv::<ChangeEvent>()` で 1 件受信 (`query-container/query-host/src/query_worker.rs:363`)。自分宛でない変更はスキップして ack (`query_worker.rs:383`)
4. **継続的クエリで増分評価**。`process_change` (`query_worker.rs:502`) が `continuous_query.process_source_change(source_change)` を呼ぶ (`query_worker.rs:524`)。本体は drasi-core の `ContinuousQuery::process_source_change` (`.../drasi-core/core/src/query/continuous_query.rs:89`)。ここで `build_solution_changes` (同 `:165`) が変更種別ごとに分岐: `Insert` は新規 solution を解決 (`:176`)、`Update` は `element_index.get_element` で旧バージョンを引き、before/after 双方の solution を計算して差分を取る (`:196-219`)。差分から added/updated/deleted の結果行を投影 (`project_solution`, `:113-154`)
5. **結果を Dapr pub/sub に発行**。`process_change` が `publisher.publish(query_id, output)` (`query_worker.rs:576`)。`ResultPublisher::publish` は Dapr の HTTP publish API 経由でトピック `{query_id}-results` に投げる (`query-container/query-host/src/result_publisher.rs:47,52-56`)。トレースコンテキストを traceparent ヘッダで伝播 (`:61`)
6. **Reaction が購読して発火**。reaction は `{query_id}-results` トピックを購読し、通知 (added/updated/deleted) を受けてアクション実行 (Reaction SDK: `reactions/sdk/{python,dotnet,javascript}`)

補足: **ブートストラップ**。クエリ起動時は `bootstrap` (`query_worker.rs:590`) が source に subscribe (`source_client.rs:48`, source の `/subscription` に POST) して初期データを取得し、それを Insert として `process_source_change` に流し込んで初期結果集合を作る (`query_worker.rs:652`)。つまり初期状態も変更ストリームも同じ増分エンジンを通る。

## 内部実装の素材

### 重要ディレクトリ

- `query-container/query-host/drasi-core/` (サブモジュール): 継続的クエリの心臓部。`core` (エンジン), `query-cypher`/`query-gql`/`query-ast` (パーサ/AST), `functions-cypher`/`functions-gql` (関数), `middleware` (source middleware), `index-garnet`/`index-rocksdb` (インデックスバックエンド)
- `core/src/query/continuous_query.rs`: 増分評価の中核
- `core/src/path_solver/`: グラフパターン (MATCH) の解決器 `MatchPathSolver`
- `core/src/evaluation/`: 式評価・集約・関数 (Cypher 意味論の実装)
- `core/src/interface/`: `ElementIndex` / `ResultIndex` / `FutureQueue` 等のトレイト
- `core/src/in_memory_index/`, `index-garnet` (Redis 互換 Garnet), `index-rocksdb`: インデックス実装の差し替え

### 中核データ構造

- `ContinuousQuery` (`continuous_query.rs:47`): `expression_evaluator`, `part_evaluator`, `element_index` (`Arc<dyn ElementIndex>`), `path_solver`, `match_path`, `future_queue`, `source_pipelines` を保持。`change_lock: Mutex<()>` (`:57`) で変更を直列化 — 1 クエリ内では変更を 1 件ずつ処理して一貫性を保つ
- `SourceChange` (drasi-core models): `Insert { element }` / `Update { element }` / `Delete` / `Future`。element はグラフの node/relation
- `ElementIndex` トレイト: 過去に見た element を保持し、Update 時に旧バージョンを引く (`continuous_query.rs:198` の `get_element`)。これが「増分」の前提 — before 状態を index から復元して after と差分を取る
- `InstantQueryClock` (`continuous_query.rs:101`): 変更のタイムスタンプを持つ論理時計。Update では旧 element の `effective_from` から before_clock を作り (`:202-204`)、時間依存の述語 (例: 過去 1 時間で 3 回) を正しく評価する

### 追う価値のあるパス: process_source_change の Update 分岐

`continuous_query.rs:89-162` の `process_source_change` と `:165` の `build_solution_changes`。Update の面白さ:

1. `element_index.get_element(reference)` で **旧バージョン** を取得 (`:198`)。無ければ実質 Insert 扱い
2. 旧バージョンの timestamp から `before_clock` を作る (`:202-204`) → 「変更前」の世界での solution を計算
3. `merge_missing_properties` (`:218`) で、変更イベントが部分更新でも旧プロパティを引き継いで完全な after element を作る
4. before / after 双方で `resolve_solutions` してマッチを列挙し、signature ごとに突き合わせて added/updated/deleted を出す
5. `project_solution` (`:113`) で SELECT/集約を適用。集約は `CollapsedAggregationResults` (`:649`) で畳んで、before==after の無変化行は落とす (`:138`, `:146`)

驚いた点 / 非自明:

- **Dapr 仮想アクター単位でクエリを走らせる**。`QueryActor` は `#[actor]` マクロ付き (`query-container/query-host/src/query_actor.rs:42-43`)、`ActorContextClient` で状態を Dapr に永続化 (`:48`)。クエリのライフサイクル・状態が Dapr actor state に載る
- **通信は全て Redis Stream + Dapr pub/sub**。source→query は Redis Streams (consumer group `qh`, ack ベースの at-least-once, `redis_change_stream.rs:73,183`)、query→reaction は Dapr pub/sub (`result_publisher.rs:47`)。コンポーネント間が疎結合で、Dapr のサイドカー前提
- **インデックスバックエンドが差し替え可能**。in-memory / Garnet (Redis 互換) / RocksDB を `Arc<dyn ElementIndex>` で抽象化。大規模状態は外部ストア、小規模はメモリ
- **クエリ言語が 2 系統**。Cypher (`query-cypher`) がメインだが GraphQL 系 (`query-gql`) の AST/関数も同居

## 採用事例の素材 (出典必須・捏造禁止)

- **Netstar** (フリート監視・管理、南アフリカ): Drasi のプレビューパートナー。コンテナの集荷〜港湾ターミナルの追跡で、車両 ID・ウェイポイント・GPS・IoT テレメトリを別々のシステムから突き合わせる統合を毎回作り直していた課題を、Drasi の継続的クエリ + リアクションに置換。Grafana 用 Drasi プラグインで結果を 1 ダッシュボードに集約。技術リード Daniel Joubert、Solution Architect Dustyn Lightfoot のコメントあり。CNCF ケーススタディ [S10] + Microsoft Tech Community ブログ [S11] で裏取り可
- ADOPTERS ファイルは repo に **存在しない** (確認済み)。上記 Netstar 以外の名指し採用者は現時点で信頼できる出典を確認できず → 書かない
- GitHub シグナル (gh API, 参照 2026-07-08 [S1]): stars **1244**, forks **87**, `createdAt` 2024-05-27, `pushedAt` 2026-07-06。OpenSSF Best Practices バッジあり (README, project 10588)
- Microsoft の CNCF 貢献の一環という位置づけ (Azure ブログ [S3] が Dapr/KEDA/Radius/Copacetic と並べて紹介)

## 代替・エコシステム

### エコシステム / 統合

- **Dapr** に強く依存 (pub/sub, 仮想アクター, state)。同じ Azure Incubations 発。Drasi の疎結合はほぼ Dapr 前提
- **Debezium**: リレーショナル source が Debezium を CDC エンジンとして内包 (`sources/relational/debezium-reactivator`)。Debezium は「置き換え」でなく「部品」として使う関係
- **Cypher / openCypher**: クエリ言語として採用。グラフ的にマルチソースを結合できるのが差別化点
- **Grafana**: Drasi プラグインでクエリ結果を可視化 (Netstar 事例 [S10])
- source/reaction が SDK で拡張可能 (rust/java/dotnet/python/js)。プリビルト source: PostgreSQL(relational), CosmosDB, Dataverse, EventHub, Kubernetes。プリビルト reaction: HTTP, SignalR, Gremlin, Dapr, SQL, Debezium, AWS/Azure, Power Platform, sync-vectorstore, MCP

### 主な代替 (本質的な差)

- **Debezium**: CDC で変更ストリームを取り出すところまで。「変更を継続クエリで評価して結果集合の差分を出し、reaction を発火」まではやらない。Drasi は Debezium を内側で使いつつ、その上に評価 + リアクション層を足した形
- **Materialize**: SQL の incremental view maintenance を提供する DB。Drasi と発想 (増分マテビュー) は近いが、Materialize は自前ストレージへ取り込む DB 製品で SQL、Drasi はデータを移さずマルチソースを Cypher で横断し k8s 上で reaction まで含む
- **ksqlDB / Kafka Streams**: Kafka 前提のストリーム処理。トピック中心。Drasi は Kafka 非前提で、任意の DB/システムの change feed を source 化しグラフパターンで評価する点が違う
- **Apache Flink**: 汎用ストリーム処理エンジン。表現力・スケールは上だが低レベルで、変更検知→評価→反応の型を自前で組む。Drasi は「Source/継続的クエリ/Reaction」という高レベルの型と宣言的リソースを提供する

## 未確定・二次パスで詰めたい点

- source 側 (reactivator → change-router → change-dispatcher → publish-api) の内部ホップは file:line まで追い切れていない。write で source を厚く書くなら `sources/shared/change-router` と `change-dispatcher` を精読する
- view-svc (結果ビューの永続化) の詳細は未精読。getting-started で結果参照に触れるなら要確認

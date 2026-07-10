# 内部実装

> コミット `62b10c7` (drasi-platform) のソースを読んだもの。クエリエンジンはサブモジュールのコミット `a0273f22` (drasi-core) を基準とする。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `control-planes/mgmt_api` | 宣言的な Source/Query/Reaction リソースを受け取る管理 API |
| `control-planes/kubernetes_provider` | それらのリソースを Kubernetes オブジェクトへ reconcile する operator |
| `query-container/publish-api` | Source が変更を POST する入口。Redis Stream に追記する |
| `query-container/query-host` | 各クエリを Dapr アクターとして走らせ、変更を消費し、評価し、差分を発行する |
| `query-container/view-svc` | クエリのマテリアライズされた結果ビューを永続化する |
| `query-container/query-host/drasi-core` | vendored な継続的クエリエンジン (サブモジュール): Cypher の増分評価 |
| `sources/` | Source コネクタ (リレーショナル/Debezium・Cosmos DB・Dataverse・Event Hubs・Kubernetes) と Source SDK |
| `reactions/` | Reaction コネクタ (HTTP・SignalR・Gremlin・Dapr・SQL など) と Reaction SDK |
| `cli/` | Go 製の `drasi` コマンドラインツール |

システムの心臓は vendored なエンジンである。`drasi-core` の中で重要なツリーは `core` (エンジン)、`query-cypher` と `query-ast` (パーサと AST)、`functions-cypher` (関数の実装)、`middleware` (source middleware)、そして差し替え可能なインデックスバックエンド `in_memory_index`・`index-garnet`・`index-rocksdb` である。

## 中核データ構造

`ContinuousQuery` (`drasi-core/core/src/query/continuous_query.rs:47`) は、エンジン全体が回転する型である。`expression_evaluator` と `part_evaluator`、`element_index: Arc<dyn ElementIndex>`、`path_solver`、パース済みの `match_path` と `query`、`future_queue`、そして `change_lock: Mutex<()>` (`continuous_query.rs:57`) を保持する。このロックが変更を直列化する。1 つのクエリ内では変更を 1 件ずつ処理し、結果を一貫させる。

`SourceChange` (エンジンの models 由来) は届いた変更のタグ付き形である。`Insert { element }`・`Update { element }`・`Delete`・`Future` であり、element はグラフのノードまたはリレーションだ。`ElementIndex` トレイトはクエリが見たすべての element を保持し、`Update` が旧バージョンを取得して差分できるようにする。そのルックアップ (`continuous_query.rs:196`) が増分評価の前提である。時間依存の述語は `InstantQueryClock` に依存する。更新は旧 element の `effective_from` タイムスタンプから `before_clock` を作り、「過去 1 時間で 3 回」のような述語が変更前の世界に対して正しく評価されるようにする。

## 追う価値のあるパス

`Update` を到着から結果差分の発行まで追う。面白いのはエンジン内部の前後差分である。

```text
query_worker.rs:502  process_change(evt)
  :524  continuous_query.process_source_change(source_change)
        continuous_query.rs:89  ContinuousQuery::process_source_change
          :94   change_lock.lock()          このクエリの変更を直列化
          :165  build_solution_changes
                :196  element_index.get_element(reference)   旧バージョンを取得
                :~204 InstantQueryClock (before_clock) を旧 timestamp から
                :~216 element.merge_missing_properties(prev)  after element を完成
          :~113 project_solution                             added/updated/deleted を出力
  query_worker.rs:576  publisher.publish(query_id, output)   Dapr pub/sub {query_id}-results
```

`process_change` (`query-container/query-host/src/query_worker.rs:502`) はワイヤ上のイベントを `SourceChange` に変換し、`process_source_change` を呼ぶ (`query_worker.rs:524`)。エンジン内で `process_source_change` (`drasi-core/core/src/query/continuous_query.rs:89`) はまず `change_lock` を取り (`continuous_query.rs:94`)、各変更を `build_solution_changes` に渡す (`continuous_query.rs:165`)。`Update` の分岐ではインデックスから element の旧バージョンを引く (`continuous_query.rs:196`)。無ければその変更は実質 Insert になる。旧 element のタイムスタンプから `before_clock` を作り、変更前の状態の結果集合を解決できるようにし、`merge_missing_properties` を呼んで部分更新が触れなかったフィールドを引き継ぎ完全な after element を作る。そのうえで前後両方の世界のマッチを解決し、signature で突き合わせて追加・更新・削除の行を出す。集約は畳まれ、値が実際には変わらなかった行は落とされる。`query-host` に戻ると `process_change` が結果差分を Dapr pub/sub の `{query_id}-results` に発行する (`query_worker.rs:576`; `query-container/query-host/src/result_publisher.rs:47`)。

## 読んで驚いた点

**各クエリが Dapr 仮想アクターである。** `QueryActor` は `#[actor]` マクロが付いており (`query-container/query-host/src/query_actor.rs:42`)、`ActorContextClient` を持つ (`query_actor.rs:48`)。そのためクエリのライフサイクルと状態は、専用の調整コードではなく Dapr のアクター状態に載る。クエリのスケーリングと配置は Dapr の関心事になる。

**2 つの内部トランスポートは意図的に異なる。** Source からクエリへは、consumer group と明示的 ack を伴う Redis Streams、すなわち at-least-once のチャネルを使う。group `qh` は `xgroup_create_mkstream` で作られ (`redis_change_stream.rs:51`, `redis_change_stream.rs:73`)、メッセージは `xack` で ack される (`redis_change_stream.rs:183`)。クエリから Reaction へは代わりに Dapr pub/sub を使う (`result_publisher.rs:47`)。この分割が、永続で再生可能な変更取り込みと、結果のファンアウトを分けている。

**インデックスバックエンドはトレイトの背後で差し替え可能。** `element_index` は `Arc<dyn ElementIndex>` であり (`continuous_query.rs:50`)、同じエンジンが小規模状態には in-memory インデックス、大規模状態には Garnet (Redis 互換) や RocksDB で走る。評価コードに触れずに選べる。

**ブートストラップは変更パスを再利用する。** 別のロード処理を持つのではなく、`bootstrap` (`query_worker.rs:590`) が Source を購読し (`source_client.rs:48`)、初期行をまさに同じ `process_source_change` に Insert として流し込む (`query_worker.rs:652`)。そのため初期結果集合も、他の変更と同様に増分エンジンで構築される。

**エンジンは今も "Reactive Graph" に応答する。** 旧コードネームがテストフィクスチャに残っており、あるユースケースクエリは `apiVersion: query.reactive-graph.io/v1` を宣言している (`drasi-core/shared-tests/src/use_cases/rolling_average_decrease_by_ten/queries.rs:18`)。

# 内部実装

> コミット `7924743` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `go/cmd/` | バイナリごとに 1 ディレクトリ: vtgate, vttablet, vtctld, vtorc, vtadmin, vtcombo |
| `go/vt/vtgate/` | プロキシ本体: executor・プランナ・実行エンジン |
| `go/vt/vtgate/engine/` | プランを実行する Primitive 木の型 (`Route`, `Join`, `Limit` など) |
| `go/vt/vtgate/vindexes/` | シャーディングキーを keyspace id にマップする Vindex 実装 |
| `go/vt/srvtopo/` | serving トポロジ: シャード解決と serving graph 構築 |
| `go/vt/topo/` | etcd・ZooKeeper・Consul を抽象化したトポロジストア |
| `go/sqltypes/` | MySQL の結果・値型 |

## 中核データ構造

- `engine.Plan` (`go/vt/vtgate/engine/plan.go:42`) はクエリの実行戦略。`Instructions Primitive` 木を包み、`Type` (`PlanType`, 定数は `plan.go:75` から)、クエリ種別、使用テーブル、実行統計を持つ。プランキャッシュのキーは `PlanKey` (`plan.go:64`) で、keyspace・tablet type・destination・query・collation から作る。
- `engine.Primitive` (`go/vt/vtgate/engine/primitive.go:271`) は各実行ノードが実装するインタフェース: `TryExecute`・`TryStreamExecute`・`GetFields`・`NeedsTransaction`・`Inputs`。葉ノードは埋め込みの `noInputs`・`noTxNeeded`・`noFields` でデフォルト挙動を共有する (`primitive.go:287`)。
- `engine.Route` (`go/vt/vtgate/engine/route.go`) は 1 つの keyspace のシャードに対し実クエリを走らせる primitive。ルーティングパラメータを埋め込み、マージソート用の `OrderBy` を持つ。
- `vindexes.Vindex` (`go/vt/vtgate/vindexes/vindex.go:52`) はシャーディングキーから keyspace id へのマッピングを抽象化する。`Cost()`・`IsUnique()`・`NeedsVCursor()` がプランナのルーティングを左右する。
- `srvtopo.ResolvedShard` (`go/vt/srvtopo/resolver.go:78`) は解決済みの送信先で、`Target` (keyspace・shard・tablet type) と到達に使う `Gateway` を持つ。
- `sqltypes.Result` (`go/sqltypes/result.go:31`) は MySQL の結果セットで、`Fields`・`Rows`・`RowsAffected`・`InsertID` を持つ。

## 追う価値のあるパス

VTGate からシャードまで、1 本の SELECT を辿る。

`Executor.Execute` (`go/vt/vtgate/executor.go:254`) はトレーススパンと `LogStats` で包み、内部の `execute` に委譲する。本処理は `Executor.newExecute` (`go/vt/vtgate/plan_execute.go:65`) にある。`MaxBufferingRetries` ループ (`plan_execute.go:90`) を回し、その中でプランを取得または生成し (`plan_execute.go:122`)、シャードに触れずトランザクション系文を処理し (`plan_execute.go:156`)、`last_insert_id()` などプランが必要とする bind 変数を注入し (`plan_execute.go:165`)、プランを実行する (`plan_execute.go:175`)。

実行は `Route.TryExecute` (`go/vt/vtgate/engine/route.go:133`) で葉に至る。まず対象シャードを解決し、実行する。

```text
Route.TryExecute            engine/route.go:133
  route.findRoute           engine/route.go:134  -> routing.go:138
    switch rp.Opcode        routing.go:152       Equal / EqualUnique -> 単一シャード
                                                 Scatter -> 全シャード
  route.executeShards       engine/route.go:148
    vcursor.ExecuteMultiShard  engine/route.go:185   シャードごとの並列実行
  route.sort                engine/route.go:205  scatter かつ OrderBy ならマージソート
  result.Truncate           engine/route.go:211
```

マッチするシャードが無くても 0 行で意味が変わるクエリ (例: `count(*)`) は、`route.anyShard` (`engine/route.go:178`) で任意のシャードに投げる。

## 読んで驚いた点

Vindex の `Cost()` メソッドが、primary でない列でも単一シャードに解決させる鍵である。hash のような primary Vindex は cost 1、別の逆引きテーブルを読む secondary な lookup Vindex (`go/vt/vtgate/vindexes/lookup.go`) は cost 2 だが、それでも scatter ではなく単一シャードに絞り込む。プランナは Opcode の switch (`routing.go:152`) で最も安いルーティングを選ぶ。つまり scatter 回避は宣言された cost に基づくプランニングの判断であり、アプリが書くものではない。

同じインタフェースの `NeedsVCursor()` は実際の制約を表す。VCursor を必要とする Vindex は VReplication からは使えない。だからこの能力は実行時チェックではなくインタフェースの一部になっている。

`sqltypes.Result` は proto3 行エンコーディングをキャッシュし、クエリ consolidation 時に複数の消費者が結果を共有しても再エンコードしないようにしている (`go/sqltypes/result.go:42`)。このキャッシュがあるから、同一の処理中クエリを束ねるのが安く済む。

# 内部実装

> コミット `68d542af` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 役割 |
| --- | --- |
| `server/cmd/main.go` | サーバのエントリポイント。データベース、レジストリ、seed、provider、HTTP listener |
| `server/router/server.go` | すべての HTTP ルートとそのミドルウェアチェーン |
| `server/handlers/` | リクエストハンドラ。design の配備は `design_engine_handler.go`、関係性の評価は `policy_relationship_handler.go` |
| `server/models/pattern/stages/` | 配備時に design が通るステージチェーン (`Format`、`Filler`、`Validator`、`DryRun`、`Provision`) |
| `server/models/pattern/planner/` | design の component の依存グラフと並列実行器 |
| `server/models/pattern/patterns/` | クラスタへの展開と Kubernetes への適用 (`k8s/k8s.go`) |
| `server/policies/` | Go ネイティブの関係性エンジン。WebAssembly にもビルドされる (`wasm/`) |
| `server/models/meshsync_events.go` | MeshSync のイベントをデータベースに取り込む |
| `server/models/providers.go` | `Provider` interface |
| `server/meshes/meshops.proto` | adapter 向けの gRPC 契約 |
| `models/` | 同梱の model ディレクトリ 479 個。component ファイル 24,198 個、relationship ファイル 6,790 個 |
| `mesheryctl/` | CLI |
| `ui/` | Next.js の UI |

`models/` 以下の数は基準コミットで `find` で数えた。Rego で書かれた関係性ポリシーは `models/meshery-core/0.7.2/v1.0.0/policies/` にある (`server/models/seed_models.go:21`)。

## 中核データ構造

- **`stages.Data`** (`server/models/pattern/stages/chain.go:12-18`): 配備の各ステージが受け取るもの。design (`Pattern *PatternFile`)、各 component 宣言の ID から完全な定義へのマップ、そしてステージ間で結果を受け渡すための、mutex で守られた `map[string]interface{}` である `Other` を持つ。component の provision 結果は `<id>.isProvisioned` というキーに入る (`server/models/pattern/stages/provision.go:24`、`:117-119`)。
- **`Chain`** (`chain.go:30-70`): ステージ関数のリスト。各ステージは `next` 関数を受け取り、それを呼ぶかどうかを自分で決める。ステージを追加すると、直前のステージの `next` が新しいステージを指すように張り替えられる (`chain.go:56-64`)。エラーに当たったステージは、`next` の代わりに `Terminate` を呼んでチェーンを止められる。`Provision` がその例である (`provision.go:34-37`)。
- **`Plan`** と **`ParallelProcessGraphNode`** (`server/models/pattern/planner/planner.go:95-142`、`parallel_process.go:96-144`): design の依存グラフと、それを実行するためのノードごとの状態。各ノードは依存の数を数え、成功シグナル用と失敗シグナル用の 2 本のチャネルを持つ。どちらのチャネルも依存の数だけバッファされ、各依存はちょうど 1 回だけ送るので、送信がブロックすることはない (`parallel_process.go:153-160`)。
- **`DeploymentMessagePerContext`** (`server/models/pattern/patterns/patterns.go:41-45`): クラスタごとの配備結果。component ごとのメッセージのリストと、クラスタのサーバ名とホストを持つ。

## 追う価値のあるパス

[アーキテクチャ](./architecture) では配備を追った。このページでは、配備の前に design の形を決めるステップ、**関係性の評価** を追う。design が評価されると、Meshery は component の間にどの関係が成り立ち、それが何を意味するかを割り出す。たとえば `namespace` を持つ Deployment は対応する Namespace の中に属すること、あるいは足りない Namespace を追加すべきこと、などである。

ルートは `POST /api/registry/relationships/evaluate` である。`handleRegistry` はこうしたパスをそれぞれ 2 回、`/api/registry` と非推奨の `/api/meshmodels` の下に登録する (`server/router/server.go:70-73`、`:361`)。

```text
policy_relationship_handler.go:788  Handler.EvaluateRelationshipPolicy (route handler)
  :854      h.EvaluateDesign(payload, MAX_RE_EVALUATION_DEPTH)
policy_relationship_handler.go:339  Handler.EvaluateDesign
  :344-361  hydrate the design from the registry
  :368      useGoEngine := viper.GetBool("USE_GO_POLICY_ENGINE")
  :371-382  Go engine: load all registered relationships once
  :384      loop up to MAX_RE_EVALUATION_DEPTH (= 5, :270)
  :390      Go engine:   h.GoEngine.EvaluateDesign(design, rels)
  :393      Rego engine: h.Rego.RegoPolicyHandler(design, ...)
  :424      stop early when nothing more needs evaluation
  :439      deduplicate actions by (op, id)
```

評価を繰り返すのは、各ラウンドが design を変えうる (component を追加する、フィールドをパッチする) ためで、それによって新たな関係が当てはまることがある。あるラウンドでそれ以上の評価が要らなくなれば止まり、5 ラウンドに達した場合は結果が部分的だという警告を出して止まる (`policy_relationship_handler.go:424-431`)。

どちらのエンジンが動くかは配備時の設定で決まる。docs は `USE_GO_POLICY_ENGINE` の既定値を `false` としているので、標準のサーバは Rego エンジンを使う。ローカルの `make server` ターゲットはこれを `true` にする (`docs/content/en/installation/advanced/environment-variables.md:68`、`install/Makefile.core.mk:78`)。Rego のポリシーは起動時の seed ステージで読み込まれる (`server/cmd/main.go:332-340`)。

Go エンジン (`server/policies/engine.go`) は 6 つのポリシーを登録する。match labels、alias、non-binding edge、binding edge、hierarchical parent-child、hierarchical wallet である (`engine.go:23-34`)。`evaluate` はこれらをフェーズに分けて走らせ、各フェーズの action を design に適用してから次のフェーズが読む (`engine.go:89-136`)。

1. **検証。** component が消えた既存の関係を deleted にする。
2. **識別。** 各ポリシーが新しい関係を提案し、既にあるものとは重複を除く。
3. **インベントリの追加。** design に足りない親、たとえば namespaced なリソースのための Namespace を追加する。コメントは、これが Rego のルールに対応するもので、これがないと 2 つのエンジンの結果が食い違ったと述べている (`engine.go:110-118`)。
4. **副作用。** 承認された関係がその効果を適用する。たとえばバインドされた component の設定をパッチする (`server/policies/doc.go:26-34`)。

パッケージのドキュメントは決定性の契約を定めている。同じ design に対する 2 回の実行は同じ出力を返さなければならない。そのため map のキーは反復前にソートし、関係の ID は正準化した JSON を種にした UUIDv5 にする (`server/policies/doc.go:75-91`)。

## 読んで驚いた点

- **ポリシーエンジンが 2 つ、切り替えは 1 つ。** Go への移植は 2026 年 4 月に入った ([コミット `31b22b91`](https://github.com/meshery/meshery/commit/31b22b91c95a72df2fc456a8a45694ddcafc08d2)) が、docs 上の既定は今も Rego である。そのため本番とローカルの開発用ターゲットで別のエンジンが動きうる。リポジトリは両者の一致を確かめるテストを持つ (`server/policies/wasm_diff_test.go`、および `server/policies/policy_inventory.go:23` のコメント)。
- **同じ Go エンジンがブラウザでも動く。** `server/policies/wasm/main.go` はエンジンを `GOOS=js GOARCH=wasm` でビルドし、`initEngine` と `evaluateDesign` を JavaScript に公開する。レジストリの関係はキャッシュされ、境界を越えるのはセッションにつき 1 回で済む (`wasm/main.go:1-5`、`:21-44`)。
- **キャッシュとしての SQLite。** サーバのデータベースはローカルの SQLite ファイルである (`server/models/sql-utils.go:101-105`)。upstream のエージェント向けガイド (`AGENTS.md`) はバックエンドが PostgreSQL を使うと書いているが、サーバは自分のデータベースを `Engine: database.SQLITE` で開く。
- **MeshSync は既定で embedded。** `MeshsyncDeploymentModeDefault` は `embedded` である (`server/models/connections/meshsync_deployment_mode.go:44`)。クラスタを接続することは、もはやそこに operator を入れることを意味しない。
- **seed でサーバは落ちない。** model とポリシーの seed は goroutine で走り、各ステージが `RunSeedStage` で包まれているので、1 つのステージの panic は recover され、HTTP listener は動き続ける (`server/cmd/main.go:318-341`)。
- **消えたのに残っているステージ。** 配備のチェーンには、コメントアウトされた `Import`、`ServiceIdentifierAndMutator`、`Persist` のステージが今も残っている (`server/handlers/design_engine_handler.go:259`、`:261`、`:274-275`)。
- **adapter 対策の sleep。** component の配備先ホストごとに、サーバはまず 50 マイクロ秒 sleep する。コメントは、adapter が並行したクライアント生成の不具合を直すまでの hack だと書いている (`design_engine_handler.go:584-587`)。
- **CRD のタイミング問題をコードが認めている。** コメントは、Kubernetes API が 200 を返しても作ったばかりの CRD がすぐ使えるとは限らず、それに依存するカスタムリソースが失敗しうると述べている (`server/models/pattern/planner/parallel_process.go:137-138`)。

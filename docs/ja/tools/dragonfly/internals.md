# 内部実装

> コミット `0041afa` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/scheduler` | scheduler バイナリのエントリポイント (`cmd/scheduler/main.go:23`) |
| `cmd/manager` | manager バイナリのエントリポイント |
| `scheduler/service` | gRPC ハンドラ、v1 (`service_v1.go`) と v2 (`service_v2.go`) |
| `scheduler/scheduling` | 親選定・リトライループ・フィルタリング (`scheduling.go`) |
| `scheduler/scheduling/evaluator` | 親のスコアリング (`evaluator_default.go`) |
| `scheduler/resource/standard` | 中核型: `Task`・`Peer`・`Host` |
| `pkg/graph/dag` | 汎用有向非巡回グラフ (`dag.go`) |
| `pkg/idgen` | タスク・ピア ID 生成 (`task_id.go`) |
| `manager` | 設定・RBAC・OAuth・データベース・コンソール |

## 中核データ構造

`Task` (`scheduler/resource/standard/task.go:107`) は配布対象 1 件だ。`URL`・`Digest`・`PieceLength`・`TotalPieceCount`、`Pieces *sync.Map`、状態機械 `FSM *fsm.FSM` (`task.go:151`)、ピアトポロジ `DAG dag.DAG[*Peer]` (`task.go:157`)、`BackToSourcePeers` 集合を持つ。多数のピアが 1 つのタスクを並行更新するため、全体に `atomic` フィールドを使う。

`Peer` (`scheduler/resource/standard/peer.go:158`) はタスク上の 1 ダウンロード主体だ。自身の `FSM` (`peer.go:189`)、`NeedBackToSource` フラグ、`BlockParents` 集合、`AnnouncePeer` ストリームへの参照を持つ。

`Host` (`scheduler/resource/standard/host.go:140`) は物理または仮想のノードだ。`Type` (normal か super seed)、`Network` (IDC とロケーション)、`DisableShared`、`ConcurrentRegisterCount` は、scheduler がスコアリング時に読む入力になる。

`dag.DAG[T]` (`pkg/graph/dag/dag.go:50`) は汎用の有向非巡回グラフで、`AddEdge`・`CanAddEdge` (`dag.go:277`)・`DeleteVertexInEdges`・深さ優先探索 (`dag.go:373`) を持つ。scheduler はこれを `dag.DAG[*Peer]` として具体化する。

## 追う価値のあるパス

中核の操作は親のスコアリングだ。子ピアと親候補の集合が与えられたとき、どの親が勝つか。`EvaluateParents` (`scheduler/scheduling/evaluator/evaluator_default.go:87`) は候補を `evaluateParents` (`evaluator_default.go:108`) の降順でソートする。スコア式は `evaluator_default.go:107` のコメントに明記されている。

```text
TotalScore = LoadQuality*0.6 + IDCAffinity*0.2 + LocationAffinity*0.1 + HostType*0.1
```

load quality 自体も合成値で、`calculateLoadQualityScore` (`evaluator_default.go:132`) で計算される。

```text
LoadQuality = PeakBandwidthUsage*0.5 + BandwidthDuration*0.3 + Concurrency*0.2
```

重み定数は `evaluator_default.go:30` 以降にある。永続タスクと永続キャッシュタスクは別の配分 (IDC affinity 0.7、location affinity 0.3) を使い、`evaluator_default.go:55` 以降で定義される。長命なコンテンツでは負荷よりロケーションを優先する形だ。

候補は filter を通った後にだけ評価器へ届く。`filterCandidateParents` (`scheduling.go:488`) はランダムサンプル (`scheduling.go:497`) から始め、順に候補を落とす。子と同一の host (`scheduling.go:514`、自分から引くのを防ぐ)、ダウンロード中でも成功でもない in-degree 0 の normal host (`scheduling.go:528`)、`IsBadParent` に該当する不良親 (`scheduling.go:538`)、`CanAddPeerEdge` で循環を作るエッジ (`scheduling.go:544`) を除外する。

## 読んで驚いた点

循環チェックは助言的なものではない。`CanAddPeerEdge` (`scheduler/resource/standard/task.go:418`) は、エッジを足すとループが閉じるかを深さ優先探索で調べ、filter は候補がスコアラに届く前に却下する (`scheduling.go:544`)。循環防止は選定の厳格な前提条件だ。

タスクの同一性はコンテンツとリクエストを意識する。`TaskIDV2ByURLBased` (`pkg/idgen/task_id.go:165`) は URL を piece length・tag・application・フィルタ済みクエリパラメータ・revision と一緒にハッシュ化する。無視するクエリパラメータだけが異なる 2 つのプルも同じタスクに写像され、ピースを共有する。別に `TaskIDV2ByContent` (`task_id.go:181`) があり、content-addressable なケース向けにコンテンツだけをキーにする。

「in-degree 0 の normal host」の除外 (`scheduling.go:528`) は微妙な正しさのルールだ。ダウンロードを始めておらず back-to-source ソースでもない normal ピアは渡せるものを何も持たないので、選んでしまうとまだピースを供給できない親を子に割り当てることになる。

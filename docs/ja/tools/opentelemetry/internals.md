# 内部実装

> コミット `415d3dca` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `service/internal/graph/` | コンポーネント DAG の構築と、起動・consume・停止の駆動 |
| `consumer/` | 段同士をつなぐ `Traces`・`Metrics`・`Logs` インターフェース |
| `internal/fanoutconsumer/` | 1 本のストリームをコピー最小化で複数 exporter へ配る |
| `pdata/` | OTLP のインメモリデータモデル (`ptrace`・`pmetric`・`plog`) |
| `pipeline/` | `pipeline.ID` とシグナル種別 |
| `service/pipelines/` | パイプライン config の map 型 |
| `otelcol/` | Collector 設定・config 読み込み・ライフサイクル |
| `cmd/otelcorecol/` | 生成された core テストディストリビューションのバイナリ |

## 中核データ構造

- `Graph` (`service/internal/graph/graph.go:60`): `componentGraph *simple.DirectedGraph`、`pipelines map[pipeline.ID]*pipelineNodes`、`instanceIDs` を持つ。DAG 本体。
- `pipelineNodes` (`service/internal/graph/graph.go:385`): 1 パイプラインのノード集合。receiver と exporter は重複排除のため map、processor は順序のため slice、加えて `capabilitiesNode` と `fanOutNode`。
- `consumer.Traces` とその兄弟 (`consumer/traces.go:15`): 段間配線の抽象。`ConsumeTraces(ctx, ptrace.Traces) error` で次ノードへデータを渡す。
- `consumer.Capabilities{MutatesData bool}` (`consumer/internal/consumer.go:13`): その段がデータを書き換えるかをグラフに伝え、下記のコピー判断を駆動する。
- `ptrace.Traces` など (`pdata/ptrace/traces.go`): OTLP のインメモリ表現。`MarkReadOnly()` (`pdata/ptrace/traces.go:7`) と `IsReadOnly()` (`pdata/ptrace/traces.go:12`) が安全な共有を制御する。
- `pipelines.Config = map[pipeline.ID]*PipelineConfig` (`service/pipelines/config.go:25`)。キーの `pipeline.ID` はシグナルと名前の組 (`pipeline/pipeline.go:18`)。

## 追う価値のあるパス

`Build` (`service/internal/graph/graph.go:75`) はパイプライングラフ全体を 3 パスで構築する。

1. `createNodes` (`service/internal/graph/graph.go:98`) が各パイプライン config を走査し、receiver・processor・exporter ノードを生成する。connector については exporter 側と receiver 側のシグナル組合せを `connectorStability` (`service/internal/graph/graph.go:551`) で型チェックし、サポートされない組合せなら明示的にエラーを返す (`service/internal/graph/graph.go:177`)。
2. `createEdges` (`service/internal/graph/graph.go:265`) がエッジを張る。receiver から capabilities ノード、続いて processor 連鎖、続いて fanout ノード、そして各 exporter へ。fanout ノードは単一 exporter でも常に挿入される (`service/internal/graph/graph.go:280`)。
3. `buildComponents` (`service/internal/graph/graph.go:294`) がノードをトポロジカルソートし、`slices.Backward` で逆順に実体化する。下流の consumer が、それに供給する上流の段より先に存在するようにするためである。

起動も同じ逆トポロジカル順を使い、producer が起動する前に consumer が準備済みになるようにする (`service/internal/graph/graph.go:403`)。停止は順方向で、各段が停止前に自分の consumer へドレインできるようにする (`service/internal/graph/graph.go:450`)。

```text
Build
  -> createNodes      (コンポーネントごとに 1 ノード、connector を検証)
  -> createEdges      (receiver -> capabilities -> processors -> fanout -> exporters)
  -> buildComponents  (topo.Sort、slices.Backward で実体化)
```

## 読んで驚いた点

fanout 経路は config が何を変更しうるかに基づいてコピーを最適化する。`NewTraces` (`internal/fanoutconsumer/traces.go:19`) は下流 consumer を `MutatesData` 能力で `mutable` と `readonly` に振り分ける。非変更の consumer が 1 個だけならラッパーを完全に省く (`internal/fanoutconsumer/traces.go:21`)。変更する consumer については最後の 1 つを除き全てにクローンを配り、最後の 1 つには readonly が存在せずデータがまだ read-only でない場合に限り元データを渡す (`internal/fanoutconsumer/traces.go:50`)。read-only consumer が複数残るときは `MarkReadOnly()` を一度呼び、同じデータを共有する (`internal/fanoutconsumer/traces.go:67`)。

この判断はビルド時に事前計算される。`capabilitiesNode` がパイプラインの processor 群と fanout ノードの `MutatesData` フラグを OR で畳む (`service/internal/graph/graph.go:312`) ので、receiver は下流へ渡す前にクローンが必要かを知る。config が含意する変更可能性を一度だけ解析することで、実行時のコピーをパイプラインが本当に必要とする最小限に抑える。

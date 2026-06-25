# 内部実装

> コミット `4d117aa` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/costmodel/` | 単一バイナリのエントリポイント。cobra コマンドツリーを呼ぶ (`main.go:11`) |
| `core/pkg/opencost/` | ドメイン型: Allocation・Asset・CloudCost・Window |
| `core/pkg/source/` | `MetricsQuerier` データソース抽象 (`datasource.go:11`) |
| `pkg/costmodel/` | コストモデルと HTTP ハンドラ (`aggregation.go`・`allocation.go`) |
| `pkg/cloud/<provider>/` | プロバイダ別プライシング (AWS・Azure・GCP ほか) |
| `pkg/cloudcost/` | クラウド請求 API 取り込みパイプライン |
| `modules/prometheus-source/` | `MetricsQuerier` の Prometheus 実装 |
| `modules/collector-source/` | 代替メトリクスバックエンド |

## 中核データ構造

- `Allocation` (`core/pkg/opencost/allocation.go:55`): あるワークロードの 1 window 分のコスト。CPU・GPU・RAM の CoreHours・Cost・Adjustment、Network コスト (cross-zone・cross-region・internet・NAT)、LoadBalancer、PV、Shared と External コストを、すべてフラットな `float64` フィールドとして 1 つの巨大 struct に持つ。`Properties *AllocationProperties` がキーを持つ。cluster・node・namespace・pod・controller・label だ。
- `AllocationSet` (`core/pkg/opencost/allocation.go:1496`) と `AllocationSetRange` (`allocation.go:3225`): window 内の Allocation 集合と、その時系列レンジ。`Accumulate` が複数 window を畳む。
- `Asset` インターフェース (`core/pkg/opencost/asset.go:31`)、実体は `Disk` (`asset.go:963`) と `Node` (`asset.go:1739`): インフラ資産。idle 計算の分母になる。
- `CloudCost` (`core/pkg/opencost/cloudcost.go:14`) と `CloudCostSet` (`cloudcost.go:170`): クラウド請求 API 由来のサービス別コスト。allocation とは別パイプライン。
- `Window` (`core/pkg/opencost/window.go:75`): `start` と `end` の 2 つの `*time.Time` ポインタ。nil ポインタは open-ended を表す。全クエリの時間軸。

## 追う価値のあるパス

`computeAllocation` (`pkg/costmodel/allocation.go:219`) が 1 window 分のコストを組み立てる場所だ。まず pod map を作り、残りのメトリクスクエリを Future として fan-out する。

```go
grp := source.NewQueryGroup()
ds := cm.DataSource.Metrics()

resChRAMBytesAllocated := source.WithGroup(grp, ds.QueryRAMBytesAllocated(start, end))
```

各 `ds.Query...` 呼び出しは並行実行されて後で Await される `*Future` を返す。クエリ自体は `MetricsQuerier` 境界 (`core/pkg/source/datasource.go:11`) を越えて `modules/prometheus-source/pkg/prom/metricsquerier.go:525` の Prometheus 実装に入り、そこで PromQL が定数として定義される (`metricsquerier.go:527`)。

```text
avg(avg_over_time(container_memory_allocation_bytes{container!="", container!="POD", node!="", %s}[%s]))
  by (container, pod, namespace, node, uid, %s, provider_id)
```

外側の `ComputeAllocation` (`pkg/costmodel/allocation.go:32`) がこれを包む。`BatchDuration` より長い window を分割し、個別に計算し、`asr.Accumulate(opencost.AccumulateOptionAll)` (`allocation.go:125`) で畳む。

## 読んで驚いた点

- 自前のバイナリコーデック bingen。`core/pkg/opencost` の型は JSON でも protobuf でもなく、独自のバイナリコーデックで直列化される (`core/pkg/opencost/bingen.go`)。ヘッダコメントは厳格なルールだ。新フィールドは後方互換のため必ず struct の末尾に append しなければならない (`bingen.go:4-21`)。各セットはバージョン付き (`@bingen:set[name=Allocation,version=...]`)、各フィールドにも注釈があり、生成出力は `opencost_codecs.go` に入る。ETL と storage 層は大量のコスト時系列を扱うため、このコーデックは後方互換を保ちつつコンパクトかつ高速に保存する。
- pod UID ingest の many-to-one 対策 (`pkg/costmodel/allocation.go:241`)。UID ingest が有効だと pod 名が `<pod_name> <pod_uid>` に書き換わるが、UID を持たない他メトリクスはマッチに失敗する。`podUIDKeyMap` (`map[podKey][]podKey`) が各 default pod key を編集後のキー群にマップし、同名の uncontrolled pod を取りこぼさない。
- GPU 比較のポインタ等値バグ修正 (`core/pkg/opencost/allocation.go:151`)。`ptrValueEqual` が存在するのは、ポインタフィールドへの素の `==` がアドレスを比較するからだ。これにより等値の GPUAllocation がバイナリ往復後に不一致と判定された (#3846)。修正は指し先の値を比較し、比較前に NaN を正規化する。

# 内部実装

> コミット `fc561264` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `tsdb/` | ローカル時系列ストレージ: head (インメモリ)、block (永続)、WAL、mmapped chunk |
| `scrape/` | scrape ループとメトリクスパース |
| `promql/` | PromQL パーサ (`promql/parser/`) と評価エンジン (`promql/engine.go`) |
| `storage/` | `Storage` / `Appender` / `Querier` の抽象: fanout, remote, merge |
| `discovery/` | サービスディスカバリプラグイン。build tag で選択 (README:114-144) |
| `web/` | HTTP API v1 と React UI (`web/ui/`) |
| `cmd/prometheus/` | 全体を配線するエントリポイント `func main()` (`cmd/prometheus/main.go:365`) |

## 中核データ構造

`Head` (`tsdb/head.go:71`) は、現在進行中でインメモリのブロック。series 集合を `series *stripeSeries` で保持し (`tsdb/head.go:115`)、ラベル term から series ID への転置インデックス `postings *index.MemPostings` を持つ (`tsdb/head.go:121`)。write-ahead log の `wal, wbl *wlog.WL` (`tsdb/head.go:87`)、isolation 用の `iso *isolation` (`tsdb/head.go:125`) も抱える。

`memSeries` (`tsdb/head.go:2515`) は 1 つの時系列。chunk を 3 層で保持する。ディスクに mmap 済みの過去 chunk である `mmappedChunks []*mmappedChunk` (`tsdb/head.go:2538`)、構築中の chunk を linked list で持つ `headChunks *memChunk` (`tsdb/head.go:2543`)、out-of-order データ用の `ooo *memSeriesOOOFields` (`tsdb/head.go:2546`)。isolation 用に `txs *txRing` も持つ (`tsdb/head.go:2574`)。

`headAppender` (`tsdb/head_append.go:425`) は 1 回の scrape のトランザクション。サンプルをバッチに溜め、`Commit` で一括反映する。WAL に書く最小単位は `record.RefSample` (series ref, timestamp, value) で、`Append` で生成される (`tsdb/head_append.go:497`)。

## 追う価値のあるパス

`headAppender.Append` (`tsdb/head_append.go:434`) は、パース済みサンプルが永続状態になる場所。まず series ref で series を引き、未知の ref なら生成にフォールバックする。

```go
s := a.head.series.getByID(chunks.HeadSeriesRef(ref))
```

このルックアップは `tsdb/head_append.go:442`。次に、順序と out-of-order ウィンドウを踏まえてサンプルが受理可能かを series に問う。

```go
isOOO, delta, err := s.appendable(t, v, a.headMaxt, a.minValidTime, a.oooTimeWindow)
```

この `appendable` チェック (`tsdb/head_append.go:475`) が、in-order と out-of-order の扱いを分けるゲートである。サンプルが通れば、即座に書くのではなく `record.RefSample` としてバッチに溜める (`tsdb/head_append.go:497`)。実際の WAL 書き込みと head chunk への反映は後段、scrape ループが仕込んだ defer された `Commit` で行われる (`scrape/scrape.go:1368`)。

## 読んで驚いた点

- **chunk の 3 段ライフサイクル。** head chunk はインメモリで構築され、一定サイズに達すると `mmappedChunk` としてディスクに mmap され、最終的に compaction で block に落ちる。`memSeries` のコメントがこれを、compaction が `mmappedChunks` のポインタをずらす様子も含めて説明している (`tsdb/head.go:2529-2544`)。クラッシュ復旧は WAL replay。結果として RAM を抑えつつ最近データを hot に保つ。
- **series ごとの MVCC。** isolation は series ごとに `txs *txRing` で実装され (`tsdb/head.go:2574`, `tsdb/isolation.go`)、未 commit のサンプルが進行中のクエリに見えない。読み取り一貫性はグローバルロックではなくこの ring から来る。
- **stale marker のファストパスを Append にインライン。** stale NaN は `Append` 内でインラインに histogram / float histogram の stale へ変換される (`tsdb/head_append.go:451-469`)。新バッチの生成を避けるため。
- **scrape バッファの pool 再利用。** scrape body の `[]byte` は pool から取得し pool に返す (`scrape/scrape.go:1410-1411`)。hot path のアロケーション削減は `AGENTS.md` で明文化されたプロジェクトの慣習。
- **out-of-order サンプルは物理的に別。** `oooTimeWindow` が遅延データを許容する場合、それは別 chunk (`oooHeadChunk`) と別 WAL (`wbl`) に入り、in-order のパスを単純に保つ (`tsdb/head_append.go:475`, `memSeriesOOOFields`)。

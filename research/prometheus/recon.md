# recon: Prometheus

調査メモ。自分用の密度。出典 URL は sources.md の番号で参照する。path:line は pin した commit に対して実コードで確認済み。

## 基本情報

- repo: `prometheus/prometheus` (本体。単一実装リポジトリ。`alertmanager` / `node_exporter` / `client_golang` などは別リポジトリのエコシステム)
- pinned commit: `fc561264a42bce13a7203e787abcc7ae0c68506f` (2026-06-22, `Merge pull request #19000 from prometheus/release-3.13`)
- バージョン: `VERSION` ファイルは `3.13.0-rc.0`。pin は release-3.13 ブランチの RC。安定最新リリースは `v3.12.0` (2026-05-28) (10)
- 近いタグ: depth 1 clone のため `git describe` 不可。`VERSION` から 3.13.0-rc.0 系
- 言語 / ビルド: Go (`go.mod`)。`make build` で promu 経由のビルド + Web アセット埋め込み。`go install github.com/prometheus/prometheus/cmd/...` で素のバイナリも可 (9)
- ライセンス: Apache-2.0 (`LICENSE` 1-3 行目、`NOTICE` に `Copyright 2012-2015 The Prometheus Authors`)。GitHub API も `Apache-2.0` (10)
- CNCF 成熟度: Graduated (2018-08-09) (1)(4)(9)
- カテゴリ (CATEGORY_ORDER): Observability
- 主エントリポイント: `cmd/prometheus/main.go` (`func main()` @ `cmd/prometheus/main.go:365`)。生成バイナリは `prometheus` と `promtool` の 2 本

## 歴史の素材

- 2012: 元 Google エンジニア Matt Proud と Julius Volz が SoundCloud で開始。既存の StatsD / Graphite ベースが containerized infra に耐えられなかったのが発端。設計上のルーツは Google 社内の Borgmon (2)(3)
- 2012-11-24: 最初の commit。GitHub API の `created_at` も `2012-11-24T11:14:12Z` と一致 (10)
- 2015-01: 公開アナウンス (2)
- 2016-05-09: CNCF が受理。Kubernetes に次ぐ 2 番目の CNCF プロジェクト (Incubating) (1)(4)
- 2016-07: Prometheus 1.0 リリース (2)
- 2017-11: Prometheus 2.0。新ストレージエンジン (現行 TSDB) で性能とディスク使用量が大幅改善 (2)
- 2018-08-09: CNCF Graduated に昇格。Kubernetes に次ぐ 2 番目の Graduated。発表は PromCon (Munich)。当時 active maintainer 約 20 名、contributor 1,000 名超、commit 13,000 超 (1)(4)(9)
- v3 系: Go module の制約のため Prometheus v3.y.z はライブラリとして `v0.3y.z` タグで公開 (README に明記)

## アーキテクチャの素材

トップレベルのコンポーネントは `cmd/prometheus/main.go` で配線される。goroutine のライフサイクルは `oklog/run` の run group (`g.Add(...)` が `cmd/prometheus/main.go:1232` 以降に多数) で束ねる。

- discovery manager: ターゲット発見。scrape 用と notify 用で 2 つ (`discovery.NewManager` @ `cmd/prometheus/main.go:950, 956`)
- scrape manager: 発見したターゲットを HTTP で pull する (`scrape.NewManager` @ `cmd/prometheus/main.go:962`)
- local storage = TSDB: `tsdb.Open(...)` @ `cmd/prometheus/main.go:1620`。単一ノード自律ストレージ
- remote storage: remote_write / remote_read (`remote.NewStorage` @ `cmd/prometheus/main.go:917`)
- fanout storage: local + remote を 1 つの `storage.Storage` に合成 (`storage.NewFanout` @ `cmd/prometheus/main.go:918`)
- PromQL engine: クエリ評価 (`promql.NewEngine` @ `cmd/prometheus/main.go:1002`)
- rule manager: recording / alerting rule 評価 (`rules.NewManager` @ `cmd/prometheus/main.go:1004`)
- notifier manager: Alertmanager へアラート送信 (`notifier.NewManager` @ `cmd/prometheus/main.go:925`)
- web handler: API / UI (`web.New` @ `cmd/prometheus/main.go:1068`)

設計判断:

- pull モデル。ターゲットを scrape する。push は Pushgateway 経由の batch job 用に限定 (README 28-36 行)
- 単一サーバが自律。分散ストレージに依存しない。HA / 長期保存はリモート層 (Thanos / Mimir / VictoriaMetrics) を上に重ねる前提 (5)
- 多次元データモデル (metric name + key/value label) と PromQL がコア差別化要素 (README 26-35 行)

### 代表オペレーションの end-to-end トレース: 1 回の scrape

1. `scrapeLoop.run` がインターバルごとに発火し `scrapeAndReport` を呼ぶ (`scrape/scrape.go:1263`, `scrape/scrape.go:1346`)
2. appender を取得し、defer で `Commit` / 失敗時 `Rollback` を仕込む (`scrape/scrape.go:1362-1377`)。トランザクション境界はここ
3. HTTP で実際に scrape し body を読む (`sl.scraper.scrape(scrapeCtx)` @ `scrape/scrape.go:1408`、`readResponse` @ `scrape/scrape.go:1413`)
4. body を `app.append(b, contentType, appendTime)` に渡す (`scrape/scrape.go:1446`)。失敗時は rollback して空 scrape で stale marker を打つ
5. `scrapeLoopAppender.append` が本体 (`scrape/scrape.go:1595`)。`textparse.New` で content-type に応じたパーサを作り (`scrape/scrape.go:1605`)、`for { p.Next() }` ループ (`scrape/scrape.go:1653`) で EntryType / EntryHelp / EntryUnit / Series を順に処理
6. サンプルは `appenderWithLimits` でラップした appender に渡る (`scrape/scrape.go:1643`、sample_limit / bucket_limit を強制)
7. 最終的に TSDB の `headAppender.Append` に到達 (`tsdb/head_append.go:434`)。series ref で `head.series.getByID` 引き、無ければ `getOrCreate` (`tsdb/head_append.go:442-449`)
8. `s.appendable(...)` で順序 / OOO ウィンドウ / 範囲を判定 (`tsdb/head_append.go:475`)。OK なら現バッチに `record.RefSample{Ref,T,V}` を append (`tsdb/head_append.go:496-502`)
9. `Commit` で WAL に書き、head chunk に反映 (`scrape/scrape.go:1368` の defer 経由)

## 内部実装の素材

重要ディレクトリ:

- `tsdb/`: ローカル時系列ストレージ。head (インメモリ) + block (永続) + WAL + mmapped chunk
- `scrape/`: scrape ループとパース統合
- `promql/`: PromQL パーサ (`promql/parser/`) と評価エンジン (`promql/engine.go`)
- `storage/`: `Storage` / `Appender` / `Querier` の抽象。fanout / remote / merge
- `discovery/`: 各種 service discovery プラグイン (build tag で増減、README 114-144 行)
- `web/`: API v1 と React UI (`web/ui/`)

中核データ構造:

- `Head` (`tsdb/head.go:71`): インメモリの現在進行ブロック。`series *stripeSeries` (`tsdb/head.go:115`)、`postings *index.MemPostings` (転置インデックス, `tsdb/head.go:121`)、`wal, wbl *wlog.WL` (`tsdb/head.go:87`)、`iso *isolation` (`tsdb/head.go:125`)。多数の atomic カウンタとオブジェクト再利用用 `zeropool.Pool` を抱える (`tsdb/head.go:92-112`)
- `memSeries` (`tsdb/head.go:2515`): 1 時系列。`mmappedChunks []*mmappedChunk` (mmap 済みの過去チャンク, `tsdb/head.go:2538`)、`headChunks *memChunk` (構築中チャンクの linked list, `tsdb/head.go:2543`)、`ooo *memSeriesOOOFields` (OOO 用, `tsdb/head.go:2546`)、`txs *txRing` (isolation 用, `tsdb/head.go:2574`)。Mutex で保護
- `headAppender` (`tsdb/head_append.go:425`): scrape 1 回分のトランザクション。サンプルをバッチに溜め `Commit` で一括反映
- `record.RefSample`: WAL に書く最小単位 (series ref + timestamp + value)。`headAppender.Append` で生成 (`tsdb/head_append.go:497`)
- `index.MemPostings`: ラベル term -> series ID リストの転置インデックス。PromQL のラベルマッチで series 集合を引く

非自明な設計判断:

- head chunk は構築中はインメモリ、一定サイズで mmapped chunk としてディスクに mmap し、さらに compaction で block に落ちる 3 段構成 (`memSeries` のコメント `tsdb/head.go:2529-2544`)。クラッシュ復旧は WAL replay。RAM を抑えつつ最近データを保持する
- isolation を `txRing` で各 series に持たせ、未 commit のサンプルがクエリに見えないようにする (`tsdb/head.go:2573-2574`, `tsdb/isolation.go`)。MVCC 的な読み取り一貫性
- stale NaN を type 情報から histogram / float histogram の stale に変換する最適化が Append にインライン (`tsdb/head_append.go:451-469`)。新バッチ生成を避ける
- scrape body の `[]byte` バッファは pool で再利用 (`scrape/scrape.go:1410-1411`)。hot path のアロケーション削減は AGENTS.md でも明文化されたプロジェクト文化
- OOO (out-of-order) サンプルは `oooTimeWindow` で許容窓を設け、in-order とは別チャンク (`oooHeadChunk`) / 別 WAL (wbl) に書く (`tsdb/head_append.go:475`, `memSeriesOOOFields`)

## 採用事例の素材

リポジトリに `ADOPTERS` ファイルは無し (確認済み)。出典付きで挙げられるのは CNCF graduation 発表時に名指しされた組織:

- DigitalOcean, Weaveworks, ShowMax, Uber (graduation 時の contributor として明記) (1)(4)
- ShuttleCloud, Datawire, iAdvize (graduation 発表の adopter リストに記載) (4)

採用シグナル (2026-06-22 時点, GitHub API 実測 (10)):

- stars: 64,698
- forks: 10,513
- open issues: 859
- 言語: Go、Apache-2.0
- graduation 時点 (2018): contributor 1,000 名超、commit 13,000 超、active maintainer 約 20 名 (1)(4)
- メトリクスベース監視の事実上の標準と founder Julius Volz も graduation 時に言及 (1)

## 代替・エコシステム

エコシステム (別リポジトリ / 別プロジェクト):

- Alertmanager: アラートのルーティング / 重複排除 / 抑制。notifier が送る先
- Pushgateway: 短命 batch job 向けの push 中継
- exporter 群 (node_exporter ほか): 非 Prometheus システムをメトリクス化
- client library (client_golang ほか): アプリ計装
- Grafana: 可視化のデファクト
- Kubernetes: service discovery と密結合。kube-prometheus / Prometheus Operator (4)

主な代替 (本質的な差) (5):

- Thanos (CNCF): Prometheus のソースを再利用。sidecar + object storage で HA / 長期保存。既存 Prometheus を包む最小移行パス。sidecar の compaction 無効化や gRPC オーバーヘッドが難点
- Grafana Mimir / Cortex (CNCF Incubating): Cortex 派生のマイクロサービス型。マルチテナント最強。運用コスト高。新規は Mimir 推奨
- VictoriaMetrics: ゼロから再実装。単一バイナリ、高圧縮、高 cardinality 耐性。PromQL 拡張の MetricsQL で軽いロックイン。remote_write 標準対応
- InfluxDB: push モデル、TSDB 専用。PromQL 非互換で移行はクエリ / 計装の書き直しが必要

Prometheus 単体の限界は明確: ローカルディスク保存、ネイティブなクラスタリング無し、cardinality でメモリが線形増加。スケール時は上記を上に重ねる (5)

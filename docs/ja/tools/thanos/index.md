# Thanos

> Thanos は Prometheus を拡張し、オブジェクトストレージによる長期保存と、複数の Prometheus サーバーをまたぐ単一のグローバルなクエリビューを足す。

- **カテゴリ**: Observability
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [thanos-io/thanos](https://github.com/thanos-io/thanos)
- **ドキュメント基準コミット**: `cc24370` (main, 2026-06-23)

## 何をするものか

Thanos は既存の Prometheus サーバーの隣に置く一連のコンポーネント群で、それらを単一の水平スケール可能なメトリクスシステムに変える。Prometheus の TSDB ブロック形式をそのまま保ち、それらのブロックをオブジェクトストレージ (S3、GCS、Azure ほか) に上げ、全サーバー・全ブロックをまたぐクエリを 1 つの Prometheus 互換 API で提供する。

配布は単一の Go バイナリで、複数のサブコマンドを持つ: `sidecar`、`store`、`query`、`rule`、`compact`、`receive`、`query-frontend`、`tools`。各サブコマンドが 1 つの役割に対応する。`cmd/thanos/main.go:34` は薄いディスパッチャで、全サブコマンドを登録し (`cmd/thanos/main.go:56-63`)、コマンドラインで選ばれた 1 つを実行する。

中心となる発想は StoreAPI で、データを持つ全コンポーネントが実装する gRPC 契約だ。Querier は 1 本の PromQL リクエストをそれら全てへ並列にファンアウトし、各々のソート済み系列ストリームを 1 本のグローバルなソート済み結果へマージする。Querier 自身も StoreAPI サーバーなので、Querier を多段に積んで federated レイヤーを組める。

## いつ使うか

- すでに Prometheus を運用していて、ローカルディスクで持てる以上の保存期間が必要で、オブジェクトストレージに安価に置きたい。
- 多数の Prometheus サーバー (クラスタごと・リージョンごと) を運用していて、全体に対する 1 つのクエリエンドポイントと 1 つの Grafana データソースが欲しい。
- HA な Prometheus ペアを運用していて、その重複系列をクエリ時に透過的に重複除去したい。
- 長期間レンジのクエリを、過去データのダウンサンプリングで高速に保ちたい。

向かないのは、保存期間の短い小規模な単一 Prometheus だけのケースで、追加コンポーネントの運用コストに見合う利点が出ない。また、Prometheus とオブジェクトストレージに重ねるのではなく、独自ストレージエンジンを持つ即用のストアが欲しい場合も向かない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [thanos-io/thanos](https://github.com/thanos-io/thanos) リポジトリ、コミット `cc24370` 固定。
2. [Thanos 公式サイト](https://thanos.io/) と [getting started ガイド](https://thanos.io/tip/thanos/getting-started.md/)。
3. [TOC approves Thanos from sandbox to incubation](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/)、CNCF ブログ、2020-08-19。
4. [CNCF プロジェクトページ: Thanos](https://www.cncf.io/projects/thanos/)。
5. [Fabian Reinartz and Bartlomiej Plotka: Thanos](https://www.youtube.com/watch?v=l8syWgJ98sk)、カンファレンストーク。
6. [Wikitech: Thanos](https://wikitech.wikimedia.org/wiki/Thanos)、Wikimedia 運用ドキュメント。
7. [go-loser](https://github.com/bboreham/go-loser) と [K-way merge algorithm (Tournament Tree)](https://en.wikipedia.org/wiki/K-way_merge_algorithm#Tournament_Tree)。

# Jaeger

> トレースを収集・保存・可視化する分散トレーシング基盤。v2 では OpenTelemetry Collector のディストリビューションとして提供される。

- **カテゴリ**: Observability
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [jaegertracing/jaeger](https://github.com/jaegertracing/jaeger)
- **ドキュメント基準コミット**: `d5e2ccd` (2026-06-22)

## 何をするものか

Jaeger は分散トレーシングシステムである。計装されたサービスが出力するスパンを取り込み、プラガブルなバックエンドに保存し、トレースを端から端まで調べるためのクエリ API と Web UI を提供する。ログやメトリクスでは答えられない問い、つまりリクエストがどこで時間を使ったか、コールグラフのどのサービスが遅延やエラーの原因かに答えるために Uber で作られた。

Jaeger v2 は単独のサーバではない。バイナリは OpenTelemetry Collector (`otelcol`) を埋め込み、Jaeger 固有機能を Collector の extension / receiver / processor / exporter として登録する (`cmd/jaeger/internal/components.go:50`)。OTLP がファーストクラスの入力形式である。設定は通常の OpenTelemetry Collector と同じ YAML、すなわち pipeline と extension で表現する。

ストレージは取り込みから分離されている。Jaeger は単一の `Writer` インターフェース (`internal/storage/v2/api/tracestore/writer.go:13`) を通じてトレースを書き込み、その実装は Cassandra / Elasticsearch / OpenSearch / ClickHouse / Badger / インメモリ / リモート gRPC ストアのいずれかである。読み取り側は結果をストリームする対応した `Reader` インターフェースを使う。

## いつ使うか

- マイクロサービスを運用し、サービス単位ではなくコールグラフ全体で遅延やエラーを見たい。
- サービスが既に OpenTelemetry トレースを出力しており、OTLP ネイティブのバックエンドが欲しい。
- 1 つのストレージに縛られず、自分でトレースの保存先を選びたい。
- 独自のクエリ API と UI を持つ、CNCF Graduated のオープンソースを使いたい。

メトリクスやログだけが必要な場合は適合度が下がる (Jaeger はトレース特化)。トレース・ログ・メトリクスを束ねた運用不要のマネージド製品が欲しい場合も適合度が下がる。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [jaegertracing/jaeger (GitHub)](https://github.com/jaegertracing/jaeger)
2. [Jaeger プロジェクトサイト](https://www.jaegertracing.io/)
3. [Jaeger project page (CNCF)](https://www.cncf.io/projects/jaeger/)
4. [CNCF announces Jaeger graduation (2019-10-31)](https://www.cncf.io/announcements/2019/10/31/cloud-native-computing-foundation-announces-jaeger-graduation/)
5. [Jaeger v2 released (Medium)](https://medium.com/jaegertracing/jaeger-v2-released-09a6033d1b10)
6. [Evolving Distributed Tracing at Uber Engineering](https://eng.uber.com/distributed-tracing/)
7. [Jaeger Getting Started Guide](https://www.jaegertracing.io/docs/latest/getting-started/)

# OpenTelemetry

> トレース・メトリクス・ログを生成・収集・転送するためのベンダー中立な標準とツールチェーン。

- **カテゴリ**: Observability
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [open-telemetry/opentelemetry-collector](https://github.com/open-telemetry/opentelemetry-collector)
- **ドキュメント基準コミット**: `415d3dca` (2026-06-18、タグ `v0.154.0` 付近)

## 何をするものか

OpenTelemetry は仕様・各言語 SDK・Collector の 3 つからなる CNCF プロジェクトである。本ディープダイブは中核実装の Collector ([open-telemetry/opentelemetry-collector](https://github.com/open-telemetry/opentelemetry-collector)) を対象にする。Collector はテレメトリを受信し、加工し、バックエンドへ転送する Go 実装である。

Collector は YAML config を読み、コンポーネントの有向グラフへ変換する。receiver がテレメトリを取り込み、processor が順序を保って加工し、exporter が送出し、connector が 2 つのパイプラインを橋渡しし、extension はヘルスチェックなどの付随機能を提供する。プロジェクトは 2 つのモジュールバージョンを管理する。stable `v1.60.0` (`pdata` データモデルと config パッケージ) と beta `v0.154.0` (service とコンポーネントの機構) で、`versions.yaml:6` と `versions.yaml:33` に宣言されている。

リポジトリには生成物の test ディストリビューション `cmd/otelcorecol` が含まれる。本番バイナリはこの `go.mod` からはビルドされない。運用者は OpenTelemetry Collector Builder (OCB) を使い manifest から自前のバイナリを組み立てる。これは `go.mod` 冒頭コメントに明記されている (`go.mod:3`)。

## いつ使うか

- トレース・メトリクス・ログをベンダー中立な OTLP 形式で取り込み、1 つ以上のバックエンドへ振り分ける単一のエージェントまたはゲートウェイが欲しいとき。
- 計装とバックエンドを切り離し、アプリを再計装せずに観測ベンダーを切り替えたいとき。
- テレメトリがネットワークを出る前に、パイプラインでバッチ化・フィルタ・マスキング・付加をしたいとき。
- コンテナログだけを送り、フットプリントを極限まで軽くしたい場合は不向き。専用のログ転送ツールの方がメモリを節約できる ([採用事例・エコシステム](./adoption) 参照)。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとテレメトリの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [opentelemetry-collector (GitHub)](https://github.com/open-telemetry/opentelemetry-collector)
2. [CNCF: OpenTelemetry 卒業発表](https://www.cncf.io/announcements/2026/05/21/cloud-native-computing-foundation-announces-opentelemetrys-graduation-solidifying-status-as-the-de-facto-observability-standard/)
3. [CNCF projects: OpenTelemetry](https://www.cncf.io/projects/opentelemetry/)
4. [OpenTelemetry is a CNCF Graduated Project](https://opentelemetry.io/blog/2026/otel-graduates/)
5. [Announcing OpenTelemetry: OpenCensus と OpenTracing の合併](https://opensource.microsoft.com/blog/2019/05/23/announcing-opentelemetry-cncf-merged-opencensus-opentracing/)
6. [OpenTelemetry Collector Getting Started](https://opentelemetry.io/docs/collector/getting-started/)

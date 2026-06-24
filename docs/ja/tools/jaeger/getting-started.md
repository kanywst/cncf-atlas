# はじめに

> `jaegertracing/jaeger` v2 イメージで検証済み。コマンドは Docker が導入され公開イメージを取得できることを想定する。

## 前提

- Docker。ソースからビルドする場合は Go 1.26 ツールチェイン。
- OTLP トレースを gRPC (ポート `4317`) または HTTP (ポート `4318`) で送るサービス、または負荷生成ツール。

## インストール

最短経路は all-in-one コンテナである。receiver、クエリ API、UI、インメモリストレージを 1 プロセスに同梱する。

```bash
docker run --rm --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/jaeger:latest
```

ソースからビルドする場合はリポジトリをクローンし `make build-jaeger` を実行する。UI サブモジュールを先にビルドしてから `jaeger` バイナリをコンパイルする。

## 最初の動く構成

`--config` フラグ無しで起動すると、バイナリはデフォルトの all-in-one 構成 (メモリストレージ) を使う旨をログ出力し、埋め込み設定を注入する (`cmd/jaeger/internal/command.go:68`)。この設定は `otlp` / `jaeger` / `zipkin` receiver、`batch` processor、`jaeger_storage_exporter` を持つ `traces` パイプラインと、UI 用の `jaeger_query` extension を配線する。

コンテナが起動したら、OpenTelemetry SDK または OTLP exporter を `localhost:4317` (gRPC) か `localhost:4318` (HTTP) に向けてスパンを送る。手元にアプリが無ければ、リポジトリの `cmd/tracegen` ツールが合成トレースを生成する。

ストレージやサンプリングをカスタマイズするには、自分の Collector 設定を渡す:

```bash
docker run --rm --name jaeger \
  -v "$(pwd)/config.yaml:/etc/jaeger/config.yaml" \
  -p 16686:16686 -p 4317:4317 -p 4318:4318 \
  jaegertracing/jaeger:latest --config /etc/jaeger/config.yaml
```

## 動作確認

ブラウザで UI `http://localhost:16686` を開く。トレースが届くと、計装したサービスが Service ドロップダウンに現れ、Find Traces に一覧表示される。起動ログの "No '--config' flags detected, using default All-in-One configuration with memory storage." はデフォルト経路が有効であることを示す。

## 次に読むもの

本番デプロイは [Jaeger Getting Started Guide](https://www.jaegertracing.io/docs/latest/getting-started/) を参照。ストレージバックエンドの設定、サンプリング戦略、Service Performance Monitoring は[プロジェクトサイト](https://www.jaegertracing.io/)にある。デフォルトのインメモリストアは固定長リングバッファで古いトレースを捨てる点に注意し、本番では Cassandra / Elasticsearch / OpenSearch などの永続バックエンドを構成すること。

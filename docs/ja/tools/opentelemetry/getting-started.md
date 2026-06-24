# はじめに

> core ディストリビューションをコミット `415d3dca` (ビルドバージョン `0.154.0-dev`) で検証済み。コマンドは Go と `make` が入った Unix シェルと、リポジトリのクローンを想定。

## 前提

- Go (リポジトリの `go.mod` が固定するバージョン)
- `make`
- [open-telemetry/opentelemetry-collector](https://github.com/open-telemetry/opentelemetry-collector) のクローン

## インストール

core の `otelcorecol` バイナリはリポジトリからビルドする test ディストリビューションである。Make ターゲットでビルドする。

```bash
git clone https://github.com/open-telemetry/opentelemetry-collector.git
cd opentelemetry-collector
make otelcorecol
```

実運用ではこのバイナリは使わない。`cmd/builder` の OpenTelemetry Collector Builder (OCB) で必要なコンポーネントを選び、自前のバイナリを組み立てる。[公式 getting started ガイド](https://opentelemetry.io/docs/collector/getting-started/) を参照。

## 最初の動く構成

リポジトリには最小の config が `examples/local/otel-config.yaml` として同梱されている。`otlp` receiver、`memory_limiter` processor、`debug` exporter を traces・metrics・logs の各パイプラインに配線し、`zpages` extension を付けたものである。

ステップ 1、core バイナリをサンプル config に対して実行する。

```bash
make run
```

これは `otelcorecol` を `--config examples/local/otel-config.yaml` 付きで起動する。OTLP receiver は `localhost:4317` (gRPC) と `localhost:4318` (HTTP) を listen し、`debug` exporter は受信したテレメトリを `detailed` の冗長度で標準出力に書き出す。

ステップ 2、スパンを送る。任意の OTLP exporter または OpenTelemetry SDK を `localhost:4317` に向ける。`debug` exporter がデコードしたテレメトリを Collector の標準出力に書き出す。

## 動作確認

サンプル config は `zpages` extension を `localhost:55679` で有効にする。そこの `/debug/servicez` と `/debug/pipelinez` パスを開けば、service とパイプラインが稼働しているか確認できる。Collector のログでコンポーネント起動行と、`debug` exporter が到着テレメトリを出力する様子を見るのもよい。

## 次に読むもの

HA、OTLP エンドポイントのセキュア化、バッチとキューイング、agent 構成と gateway 構成のスケーリングなど本番運用は、[公式 Collector ドキュメント](https://opentelemetry.io/docs/collector/getting-started/) に従う。本番バイナリは `otelcorecol` を配るのではなく OCB でビルドする。

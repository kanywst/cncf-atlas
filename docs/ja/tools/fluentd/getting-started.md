# はじめに

> v1.19 系で検証済み。コマンドは Ruby が入った Unix シェルを想定。

## 前提

- Ruby 3.2 以降 (`fluentd.gemspec:28`、README Prerequisites)

## インストール

```bash
gem install fluentd
```

## 最初の動く構成

README の Quick Start は、インストールからイベント確認まで 4 コマンドで到達する ([出典 1](https://github.com/fluent/fluentd))。

1. サンプル設定ディレクトリを生成する。

```bash
fluentd -s conf
```

1. その設定でバックグラウンドで Fluentd を起動する。

```bash
fluentd -c conf/fluent.conf &
```

1. テストイベントを送る。`fluent-cat` は gem に同梱され、指定したタグで JSON レコードを転送する。

```bash
echo '{"json":"message"}' | fluent-cat debug.test
```

生成された `conf/fluent.conf` には `stdout` 出力を使う `<match debug.**>` ブロックが含まれるため、イベントは Fluentd が動く端末に表示される。

## 動作確認

Fluentd の出力を見る。往復が成功すると、`debug.test` のタグでレコードが次のように表示される。

```text
2026-06-23 12:00:00.000000000 +0000 debug.test: {"json":"message"}
```

イベントが現れれば、入力・ルーティング・出力がすべて動いている。

## 次に読むもの

HA、バッファチューニング、TLS 付き secure forward、`fluent-operator` や Helm での Kubernetes デプロイといった本番運用は、公式ドキュメントと `fluent` GitHub organization を参照 ([出典 1](https://github.com/fluent/fluentd))。

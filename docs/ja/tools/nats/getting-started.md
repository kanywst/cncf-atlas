# はじめに

> `v2.14.2` で検証済み。コマンドは Go 1.25+ または Docker のある Unix シェルと、`nats` CLI を想定。

## 前提

- ソースからビルドするなら Go 1.25 以降、公開イメージを動かすなら Docker。
- コマンドラインから publish/subscribe するための `nats` CLI。

## インストール

```bash
go install github.com/nats-io/nats-server/v2@latest
```

公式リリースバイナリのダウンロード、または公開イメージの実行でもよい。

```bash
docker run -p 4222:4222 nats
```

## 最初の動く構成

サーバを起動してメッセージが届くまでの最短経路。デフォルトのクライアントポートは 4222、監視 HTTP エンドポイントは `-m 8222` で有効になる ([nats.io about](https://nats.io/about/))。

1. JetStream と監視を有効にしてサーバを起動する。

   ```bash
   nats-server -js -m 8222
   ```

1. 2 つ目の端末で subject を購読する。

   ```bash
   nats sub foo
   ```

1. 3 つ目の端末でその subject へ publish する。

   ```bash
   nats pub foo hello
   ```

購読側が `foo` で受信したメッセージを表示する。

## 動作確認

監視エンドポイントでサーバの健全性と接続数を確認する。

```bash
curl http://localhost:8222/varz
```

`nats sub foo` の端末にも受信した `hello` の payload が表示されるはずで、これで端から端までの配送が確認できる。

## 次に読むもの

durability・リプレイ・key/value・オブジェクトストレージは [JetStream docs](https://docs.nats.io/nats-concepts/jetstream) と [Consumers](https://docs.nats.io/nats-concepts/jetstream/consumers) を読む。クラスタリング・gateway・leaf node・セキュリティ強化は、ここで再導出せず公式ドキュメントを参照する ([nats.io about](https://nats.io/about/))。

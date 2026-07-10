# はじめに

> コミット `3bdb192` (タグ `v2.11.0` の近傍) のソースで検証済み。コマンドは Unix シェルを想定し、ソースからビルドするなら Go 1.26 を要する。

## 前提

- ソースからビルドするなら Go 1.26、公開イメージを動かすなら Docker。
- ホスト上でポート 2379・2380・2381 が空いていること。Easegress は埋め込み etcd のためにこれらをデフォルトで開く。
- `egctl` CLI。サーバと一緒にビルドされる。

## インストール

ソースからビルドする。ビルドスクリプトはバイナリを `bin` ディレクトリに置く (README)。

```bash
git clone https://github.com/easegress-io/easegress.git
cd easegress
make
export PATH="$PATH:$(pwd)/bin"
```

ビルドせず公開イメージを取得してもよい。

```bash
docker pull megaease/easegress:latest
docker run megaease/easegress
```

## 最初の動く構成

Easegress の中核機能はバックエンドへのトラフィックのプロキシだ。1 ノードを起動し、HTTP プロキシを作る。

1. サーバを起動する。1 ノードの埋め込み etcd クラスタが立ち、待ち受けを始める。

   ```bash
   easegress-server
   ```

1. 別シェルからクラスタメンバを確認する。

   ```bash
   egctl get member
   ```

1. 2 つのバックエンドに負荷分散する HTTP プロキシをポート 10080 に作る。HTTP サーバとその背後の pipeline が生成される。

   ```bash
   egctl create httpproxy demo --port 10080 \
     --rule="/pipeline=http://127.0.0.1:9095,http://127.0.0.1:9096"
   ```

1. プロキシ越しにリクエストを送る。

   ```bash
   curl -v 127.0.0.1:10080/pipeline
   ```

リクエストはラウンドロビンの負荷分散で `127.0.0.1:9095/pipeline` か `127.0.0.1:9096/pipeline` に転送される (README)。

## 動作確認

`egctl get member` が動作中のノードを返せば、埋め込み etcd クラスタが起動していることを確認できる。プロキシ作成後は `egctl describe member` とオブジェクト一覧に新しい HTTP サーバと pipeline が見える。ポート 10080 への `curl` がいずれかのバックエンドに届けば、データ経路 (traffic gate → pipeline → proxy filter → バックエンド) が通っていることを確認できる。

## 次に読むもの

複数ノードの HA クラスタ、TLS と `AutoCertManager`、filter の全カタログ、サービスメッシュモード、MQTT、LLM ゲートウェイについては、リポジトリの `docs/` 配下の公式ドキュメントと MegaEase の Easegress サイト <https://megaease.com/easegress/> を参照。本番デプロイでは `latest` ではなく `v2.11.0` のようなリリースタグにサーバのバージョンを固定すること。

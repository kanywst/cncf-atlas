# はじめに

> コミット `cc24370` (`v0.42.0-rc.0` 付近) で検証。コマンドは、永続データディレクトリを持つ稼働中の Prometheus v2.2.1+ を想定。

## 前提

- 稼働中の Prometheus サーバー (v2.2.1 以降) と永続ローカルストレージ。
- 長期保存をするなら任意でオブジェクトストレージのバケット (S3、GCS、Azure ほか)。
- ソースからビルドする場合のみ Go ツールチェイン。

## インストール

単一の `thanos` バイナリをソースからビルドする:

```bash
git clone https://github.com/thanos-io/thanos.git
cd thanos
make build
```

`make build` は `promu` を呼んで 1 つの `thanos` バイナリを生成する (`Makefile:149`)。リリース済みバイナリと `quay.io/thanos/thanos` イメージも GitHub Releases で公開される。

## 最初の動く構成

グローバルなクエリビューへの最短経路は、Prometheus の隣に置くサイドカーと、その前段の Querier だ。

1. Prometheus の隣でサイドカーを起動し、そのデータを StoreAPI で公開する (`docs/quick-tutorial.md:91`)。`--objstore.config-file` フラグは任意で、長期保存をする場合にのみ必要。

   ```bash
   thanos sidecar \
       --tsdb.path            /var/prometheus \
       --objstore.config-file bucket_config.yaml \
       --prometheus.url       http://localhost:9090 \
       --http-address         0.0.0.0:19191 \
       --grpc-address         0.0.0.0:19090
   ```

1. サイドカーの gRPC エンドポイントに接続し、Prometheus 互換の API と UI を出す Querier を起動する (`docs/quick-tutorial.md:133`)。`dnssrv+` プレフィックスは DNS SRV レコード経由でエンドポイントを発見する。

   ```bash
   thanos query \
       --http-address 0.0.0.0:19192 \
       --endpoint     1.2.3.4:19090 \
       --endpoint     dnssrv+_grpc._tcp.thanos-store.monitoring.svc
   ```

## 動作確認

Querier の UI を `http://localhost:19192` で開き、Stores ページを確認する。サイドカーが接続済みの StoreAPI エンドポイントとして表示されるはず。そこで PromQL クエリを実行すると、Prometheus が返すのと同じ系列が、今度は Thanos 経由で返る。

## 次に読むもの

store gateway、コンパクションとダウンサンプリング、Receive、query-frontend のキャッシュ、HA ペアと重複除去、オブジェクトストレージ設定については [公式 getting started ガイド](https://thanos.io/tip/thanos/getting-started.md/) を参照。

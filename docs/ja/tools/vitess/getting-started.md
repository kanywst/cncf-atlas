# はじめに

> コミット `7924743` の `examples/local/` ウォークスルーに基づく。コマンドはローカルの MySQL と、ビルドした Vitess バイナリが `PATH` にあることを前提とする。

## 前提

- `mysqld` と `mysql` クライアントがローカルにインストール済み。
- Vitess バイナリをビルドして `PATH` に通してある。リポジトリのクローンで `make build` を実行する。
- リポジトリの `examples/local/` 配下のサンプルスクリプト。

## インストール

```bash
git clone https://github.com/vitessio/vitess.git
cd vitess
make build
export PATH="$PWD/bin:$PATH"
```

## 最初の動く構成

`examples/local/` ディレクトリは、トポロジサービス・vtctld・VTGate・VTTablet を `commerce` keyspace 向けに立ち上げる。コマンドの要約は `examples/local/README.md` にある。

1. 環境とエイリアスを設定し、初期クラスタを立ち上げる (`examples/local/README.md:9`, `README.md:12`)。

```bash
source ../common/env.sh
./101_initial_cluster.sh
```

1. VTGate 経由でサンプルデータを挿入し読み戻す (`examples/local/README.md:15`)。

```bash
mysql < ../common/insert_commerce_data.sql
mysql --table < ../common/select_commerce_data.sql
```

1. VReplication で 2 つのテーブルを新しい `customer` keyspace へ移す (`examples/local/README.md:22`)。

```bash
vtctldclient MoveTables --workflow commerce2customer --target-keyspace customer create --source-keyspace commerce --tables "customer,corder"
```

1. `customer` keyspace を 1 シャードから 2 シャードへリシャードする (`examples/local/README.md:40`)。

```bash
vtctldclient Reshard --workflow cust2cust --target-keyspace customer create --source-shards '0' --target-shards '-80,80-'
```

## 動作確認

ステップ 2 の後、`mysql --table` のセレクトが `commerce` keyspace の行を表示すれば、VTGate が実クエリを VTTablet とその MySQL バックエンドへルーティングできていることが確認できる。ワークフロー系では `vtctldclient vdiff ... show last` で、トラフィックを切り替える前に MoveTables や Reshard のワークフローがデータをコピーして一致させたかを確認する。

## 次に読むもの

Kubernetes 上の本番デプロイには vitess-operator と `examples/operator/101_initial_cluster.yaml` を使う。公式サイト <https://vitess.io/> が HA・バックアップ・セキュリティ・スケーリングを扱う。プロジェクトの運営方法はリポジトリの `GOVERNANCE.md` と `GUIDING_PRINCIPLES.md` に書かれている。

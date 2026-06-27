# はじめに

> コミット `3a7ae05` の Docker 開発セットアップで検証済み。コマンドは下記前提を満たす macOS または Linux を想定。

## 前提

- `git`
- `docker`
- `make`
- `sh`

公式 Docker セットアップは CentOS 7 と macOS 10.14 以降でテスト済みとされている (出典 3、`docker/README.md`)。

## インストール

サーバ用の単一バイナリインストールは存在しない。開発経路ではソースツリーから ZMS・ZTS・UI を Docker イメージとしてビルドする。

```bash
git clone https://github.com/AthenZ/athenz.git
cd athenz/docker
```

## 最初の動く構成

ローカルの ZMS・ZTS・UI を開発用に立ち上げる。ビルドは遅い (README は 15〜30 分と見積もる)。

1. Athenz のコンテナイメージをビルドする。

```bash
make build
```

1. 開発環境をデプロイする (ZMS はポート 4443、ZTS はポート 8443)。

```bash
make deploy-dev
```

1. コンテナ起動後、同梱の検証を実行する。

```bash
make verify
```

## 動作確認

`make verify` がデプロイ済みサーバを試験する。デプロイがローカルに書くサーバログを追ってもよい。

```bash
less ./logs/zms/server.log
less ./logs/zts/server.log
```

このセットアップでは ZMS が `localhost:4443`、ZTS が `localhost:8443` を待ち受ける。後片付けは `docker` ディレクトリで `make clean` を実行する。

## 次に読むもの

本番デプロイは開発用 Docker 経路ではなく公式のサーバセットアップガイドに従う。ローカル/本番インストールは `docs/setup_zms.md`・`docs/setup_zts.md`・`docs/setup_ui.md`、AWS は `docs/aws_athenz_setup.md`。認可モデルは `docs/data_model.md`・`docs/auth_flow.md`・`docs/copper_argos.md` (サービス ID X.509 機能) に記載がある。日々の管理は ZMS クライアントユーティリティ (`docs/zms_client.md`) を使う。

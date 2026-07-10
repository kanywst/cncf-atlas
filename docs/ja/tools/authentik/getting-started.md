# はじめに

> 公式ドキュメントの Docker Compose インストールで検証。コマンドは Docker と Docker Compose を備えた Linux ホスト (おおよそ 2 CPU・2 GB RAM) を想定。

## 前提

- Docker と Docker Compose プラグインを備えたホスト。
- 2 CPU コアと 2 GB RAM 程度。
- シークレット生成のための `openssl`。

## インストール

Compose ファイルは PostgreSQL と Redis を同梱するので、外部データベースは不要 ([ドキュメント](https://docs.goauthentik.io/install-config/install/docker-compose))。

```bash
curl -O https://docs.goauthentik.io/compose.yml
```

## 最初の動く構成

1. Compose ファイルをダウンロードする (上記)。

1. 必要なシークレットを `compose.yml` の隣の `.env` に生成する。

   ```bash
   echo "PG_PASS=$(openssl rand -base64 36 | tr -d '\n')" >> .env
   echo "AUTHENTIK_SECRET_KEY=$(openssl rand -base64 60 | tr -d '\n')" >> .env
   ```

1. イメージを取得してスタックを起動する。

   ```bash
   docker compose pull
   docker compose up -d
   ```

1. 初期セットアップページを開き、最初の管理者アカウント (`akadmin`) を作成する。

   ```text
   http://<your-host>:9000/if/flow/initial-setup/
   ```

## 動作確認

コンテナが動いているか確認し、UI を開く:

```bash
docker compose ps
```

`http://<your-host>:9000` を開く。正常なインストールならログインフローが表示され、初期セットアップ後に管理インターフェースに到達する。このセットアップフロー自体、[アーキテクチャ](./architecture) で述べたのと同じフロー executor が描画している。

## 次に読むもの

本番運用 (TLS 終端、HA、外部 PostgreSQL/Redis、ハードニング、Traefik/nginx/Envoy の前段に置く forward-auth 用 outpost の設定) は [公式ドキュメント](https://docs.goauthentik.io/) を参照。フローとポリシが裏側でどう評価されるかは [内部実装](./internals) を参照。

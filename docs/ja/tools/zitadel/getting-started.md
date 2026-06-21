# はじめに

> コミット `10087e7` 時点の Docker Compose クイックスタートに基づく。コマンドは Docker と Docker Compose を入れた Linux / macOS ホストを想定。

## 前提

- Docker と Docker Compose プラグイン。
- PostgreSQL 14 以降。Compose 構成はこれを自動で用意する。スタンドアロン導入では外部 DB が必要 (README.md:147)。
- マニフェスト取得用の `curl`。

## インストール

最短は公開されている Docker Compose マニフェストで、ZITADEL と DB を一緒に起動する (README.md:78):

```bash
curl -LO https://raw.githubusercontent.com/zitadel/zitadel/main/deploy/compose/docker-compose.yml \
  && curl -LO https://raw.githubusercontent.com/zitadel/zitadel/main/deploy/compose/.env.example \
  && cp .env.example .env \
  && docker compose up -d --wait
```

## 最初の動く構成

1. 作業ディレクトリを作り、Compose ファイルと環境例を取得する。

```bash
mkdir zitadel && cd zitadel
curl -LO https://raw.githubusercontent.com/zitadel/zitadel/main/deploy/compose/docker-compose.yml
curl -LO https://raw.githubusercontent.com/zitadel/zitadel/main/deploy/compose/.env.example
```

1. 環境例を `.env` にコピーする。ローカル試用ならデフォルトで問題ないが、本番投入の前には必ず見直す。

```bash
cp .env.example .env
```

1. スタックを起動し、コンテナが healthy になるまで待つ。

```bash
docker compose up -d --wait
```

1. Compose の出力に表示されるアドレス (ローカルの既定は `http://localhost:8080/ui/console`) をブラウザで開き、ドキュメント記載の初期管理者認証情報でサインインする ([Compose deploy](https://zitadel.com/docs/self-hosting/deploy/compose))。

## 動作確認

コンテナが起動し healthy であることを確認し、API が応答するか確かめる:

```bash
docker compose ps
curl -s http://localhost:8080/debug/healthz
```

健全なスタックでは ZITADEL コンテナが running と表示され、health エンドポイントが成功応答を返す。そこから Console UI で最初の organization・project・application を作れる。

## 次に読むもの

- [Compose deployment guide](https://zitadel.com/docs/self-hosting/deploy/compose): ローカル構成全体と TLS の注意点。
- [Kubernetes self-hosting](https://zitadel.com/docs/self-hosting/deploy/kubernetes): 本番向けの Helm chart。
- [API introduction](https://zitadel.com/docs/apis/introduction): organization・project・user を gRPC・connectRPC・HTTP/JSON でスクリプト操作する。

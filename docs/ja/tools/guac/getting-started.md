# はじめに

> コミット `362e6da` のソースで検証済み。コマンドは Docker (Compose プラグイン付き) とリポジトリのローカルクローンを想定。

## 前提

- Docker と Compose プラグイン (ローカルスタックはコンテナで動く)。
- `git` と `curl`。
- ソースからバイナリをビルドする場合のみ Go 1.26 (リリース済みイメージを使うなら不要)。

## インストール

クイックスタートは Docker Compose 経由で公開 GUAC イメージを使う。まずリポジトリをクローンする:

```bash
git clone https://github.com/guacsec/guac.git
cd guac
```

代わりにソースから CLI バイナリをビルドする場合 (出力は `./bin`):

```bash
make build
```

## 最初の動く構成

インメモリバックエンドで GUAC サービスを起動し、ドキュメントのフォルダを取り込み、結果をクエリする。

1. インメモリバックエンドでスタック (GraphQL サーバ、collectsub、ingestor) を起動する。このターゲットはコンテナを force-recreate し、ポート 8080 で GraphQL エンドポイントが応答するまで待つ。

```bash
make start-service
```

1. SBOM/attestation のフォルダをグラフへ直接取り込む。`files` サブコマンドは GraphQL エンドポイントと直接通信する (`cmd/guacone/cmd/files.go:62`)。

```bash
bin/guacone collect files /path/to/sbom-folder
```

1. CLI からグラフをクエリする。

```bash
bin/guacone query
```

## 動作確認

`start-service` ターゲットは `http://localhost:8080` をポーリングし、GraphQL エンドポイントが応答すると `Inmem GUAC service is up!` を表示する (`Makefile:161`)。ブラウザで `http://localhost:8080` を開くと GraphQL playground も利用できる。スタックを落としてインメモリ状態をフラッシュするには:

```bash
make stop-service
```

## 次に読むもの

本番運用 (ent+PostgreSQL バックエンド、デーモンとして動く collector、NATS による pub/sub、TLS) は公式セットアップガイド <https://docs.guac.sh/> に従う。リポジトリにはエディタでの探索向けにフルスタック (GraphQL、REST、collectsub、ingestor、NATS、deps_dev/osv/ClearlyDefined の collector) を立ち上げる `.devcontainer` も同梱されている。

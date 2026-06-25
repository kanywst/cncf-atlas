# はじめに

> `v1.21.1` で検証済み。コマンドは Docker (v20.10+) と Docker Compose (v2.30+) を想定。

## 前提

- Docker と Docker Compose がインストール済み。
- メモリ約 4 GB、ディスク空き約 10 GB。
- Linux、macOS、または WSL2 上の Windows。

## インストール

Cortex はバイナリと、`quay.io/cortexproject/cortex` のコンテナイメージとして提供される。動く構成への最短経路はリポジトリ同梱の Docker Compose バンドルで、Cortex を single-binary モードで Prometheus・Grafana・SeaweedFS (S3 互換ストレージ) と一緒に起動する。

```bash
git clone https://github.com/cortexproject/cortex.git
cd cortex/docs/getting-started
```

## 最初の動く構成

これで Cortex (`-target=all`)、それへ remote-write する Prometheus、S3 互換ストレージ、クエリ用の Grafana が立ち上がる。

1. バンドルされたスタックを起動する。

   ```bash
   docker compose up -d
   ```

2. Compose はイメージを pull し、SeaweedFS を起動して S3 バケットを初期化し、Cortex・Prometheus・Grafana を起動する。Prometheus は自分自身をスクレイプし、サンプルを Cortex の `/api/v1/push` へ remote-write する。

3. バンドルではなく Cortex を直接動かすには、config ファイル付きの single-binary モードを使う (ローカル blocks-storage の例が `docs/configuration/single-process-config-blocks-local.yaml` に同梱)。

   ```bash
   cortex -target=all -config.file=./single-process-config-blocks-local.yaml
   ```

## 動作確認

- Cortex は `/ready` に readiness エンドポイントを提供する。正常なら HTTP 200 を返す。

```bash
curl -s http://localhost:9009/ready
```

- Grafana で Cortex を Prometheus データソースとして追加し、`up` などのメトリクスをクエリして、サンプルが保存・クエリ可能になっているか確認する。
- マルチテナントのリクエストには `X-Scope-OrgID` ヘッダが必要 (auth がデフォルトで有効、`pkg/cortex/cortex.go:151`)。`http://localhost:9009` のようなローカル URL は自分のデプロイ用のプレースホルダ。

## 次に読むもの

- リポジトリの `docs/getting-started/single-binary.md` が、recording rule や Alertmanager を含む Compose チュートリアル全体を解説する。
- 本番運用 (HA・セキュリティ強化・各モジュールの独立スケール) は `docs/configuration/` 配下の設定ドキュメントと `docs/getting-started/microservices.md` のマイクロサービスガイドを参照。

# はじめに

> `ghcr.io/permify/permify` コンテナ (コミット `aa3a7c6`) で検証済み。コマンドは Docker とターミナルを想定。

## 前提

- Docker (コンテナ実行用)、またはソースからビルドする場合は Go 1.25 以上のツールチェーン。
- REST (3476) と gRPC (3478) 用に空いている TCP ポートが各 1 つ。
- 初回はストレージとして PostgreSQL は任意。既定では in-memory ストアで起動する (`README.md:100-114`)。

## インストール

最短はコンテナ。in-memory ストアで起動し外部依存がない。

```bash
docker run -p 3476:3476 -p 3478:3478 ghcr.io/permify/permify serve
```

ソースからビルドする場合:

```bash
go build ./cmd/permify
./permify serve
```

## 最初の動く構成

これで Permify が起動し API に到達できる。既定構成は REST を 3476、gRPC を 3478 で提供し、認可データを in-memory に保持する (`README.md:104-114`)。

上のインストールコマンドでサーバを起動する。続いて:

1. API が応答することを確認する (下記「動作確認」)。
2. スキーマを書き、リレーション (ABAC なら属性も) を投入し、`Check` を呼ぶ。これが最小の認可ループ。

サーバは REST (3476) と gRPC (3478) の両方を公開する。`playground/` の Playground は、SDK (`sdk/`) を組み込む前にスキーマを書いて Check を試す最短手段。

## 動作確認

Permify は REST ポートにヘルスエンドポイントを公開する。起動中のサーバは次に応答する:

```bash
curl localhost:3476/healthz
```

これはプロジェクトが文書化している接続テスト (`README.md:116-121`)。

## 次に読むもの

- 本番データ: in-memory を PostgreSQL に切り替え、`permify migrate` を実行する (`cmd/permify/permify.go` に登録)。
- 分散デプロイ: バイナリは起動時に consistent-hash の gRPC balancer と Kubernetes resolver を登録する (`cmd/permify/permify.go:16-17`)。
- 設定・スキーマ言語・API リファレンスは README からリンクされた公式ドキュメントを参照 (`README.md:113-114`)。

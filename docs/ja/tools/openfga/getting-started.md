# はじめに

> `v1.18.0` で検証済み。コマンドは Docker と `curl`、そしてインメモリデータストア (サーバ停止でデータは破棄される) を想定。

## 前提

- `openfga` バイナリを動かす Docker (または Homebrew、Go ツールチェーン)。
- ポート 8080 の HTTP API と通信する `curl`。

## インストール

最短経路はインメモリデータストアと Playground を備えた Docker イメージである (1):

```bash
docker run -p 8080:8080 -p 3000:3000 openfga/openfga run
```

README にある代替手段 (1):

```bash
# Homebrew
brew install openfga
openfga run

# go install
go install github.com/openfga/openfga/cmd/openfga
openfga run
```

デフォルトのインメモリストアはマイグレーション不要である。PostgreSQL / MySQL / SQLite を使う場合は `openfga migrate` でスキーマを作成し、対応する `--datastore-engine` を指定して起動する。HTTP は 8080、gRPC は 8081、Playground は 3000 で待ち受ける (1)。

## 最初の動く構成

1. ストアを作成する。

```bash
curl -X POST 'localhost:8080/stores' \
  --header 'Content-Type: application/json' \
  --data-raw '{"name": "openfga-demo"}'
```

成功するとストアが返る。例 (1):

```json
{
  "id": "01G3EMTKQRKJ93PFVDA1SJHWD2",
  "name": "openfga-demo",
  "created_at": "2022-05-19T17:11:12.888680Z",
  "updated_at": "2022-05-19T17:11:12.888680Z"
}
```

1. 返ってきた `id` を控え、最小の認可モデル (`viewer` 関係を持つ `document` 型を、API が受け付ける JSON 形式で) を書き込む。

```bash
STORE=01G3EMTKQRKJ93PFVDA1SJHWD2
curl -X POST "localhost:8080/stores/$STORE/authorization-models" \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "schema_version": "1.1",
    "type_definitions": [
      { "type": "user" },
      { "type": "document",
        "relations": { "viewer": { "this": {} } },
        "metadata": { "relations": { "viewer": { "directly_related_user_types": [ { "type": "user" } ] } } }
      }
    ]
  }'
```

1. `user:alice` に `document:1` の `viewer` 関係を付与する関係タプルを書き込む。

```bash
curl -X POST "localhost:8080/stores/$STORE/write" \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "writes": { "tuple_keys": [
      { "user": "user:alice", "relation": "viewer", "object": "document:1" }
    ] }
  }'
```

1. Check を問い合わせる。

```bash
curl -X POST "localhost:8080/stores/$STORE/check" \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "tuple_key": { "user": "user:alice", "relation": "viewer", "object": "document:1" }
  }'
```

応答が認可判定である:

```json
{ "allowed": true }
```

## 動作確認

- ステップ 4 の Check が `user:alice` に対して `{"allowed": true}` を返し、一致するタプルを持たないユーザには `{"allowed": false}` を返す。
- 上記デフォルトで起動した場合、Playground は `http://localhost:3000/playground` で提供される。

## 次に読むもの

永続ストレージ、性能チューニング、安全な本番デプロイについては、公式の [Running in Production](https://openfga.dev/docs/getting-started/running-in-production) ガイドと [OpenFGA ドキュメント](https://openfga.dev/) を参照 (6)。DSL、SDK、`fga` CLI はそちらに記載されており、ここでは再掲しない。

# はじめに

> 基準コミット `4bb1d7b3` (`v1.54.0` 付近) で検証。コマンドは Docker または macOS/Linux の Homebrew、加えて `curl` を想定。

## 前提

- サーバを入れるための Docker、または Homebrew (`brew`)。
- 以下の例で HTTP API を叩くための `curl`。

## インストール

Homebrew (macOS と Linux) では、公式 tap がサーバと `zed` CLI の両方を配布する:

```bash
brew install authzed/tap/spicedb authzed/tap/zed
```

Debian 系・RPM 系 Linux は、代わりに AuthZed の APT/YUM リポジトリから `spicedb` と `zed` をインストールできる (リポジトリ設定は README 参照)。

## 最初の動く構成

最短経路は外部データベース不要のインメモリデータストアである。開発・テスト専用である。

1. インメモリストアでサーバを起動し、gRPC (50051) と HTTP (8443) を公開する。preshared key を API トークンとして使う:

```bash
docker run --rm -p 50051:50051 -p 8443:8443 authzed/spicedb \
  serve --http-enabled true --grpc-preshared-key "somerandomkeyhere"
```

1. `user`、`folder`、`document` と `view` 権限を定義するスキーマを書く:

```bash
curl --location 'http://localhost:8443/v1/schema/write' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer somerandomkeyhere' \
  --data '{
    "schema": "definition user {} \n definition folder { \n relation parent: folder\n relation viewer: user \n permission view = viewer + parent->view \n } \n definition document {\n relation folder: folder \n relation viewer: user \n permission view = viewer + folder->view \n }"
  }'
```

1. 関係を書く: `anne` を `folder:budget` の viewer にする:

```bash
curl --location 'http://localhost:8443/v1/relationships/write' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer somerandomkeyhere' \
  --data '{
    "updates": [
      {
        "operation": "OPERATION_TOUCH",
        "relationship": {
          "resource": { "objectType": "folder", "objectId": "budget" },
          "relation": "viewer",
          "subject": { "object": { "objectType": "user", "objectId": "anne" } }
        }
      }
    ]
  }'
```

## 動作確認

`anne` が `folder:budget` を `view` できるか問い合わせる:

```bash
curl --location 'http://localhost:8443/v1/permissions/check' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer somerandomkeyhere' \
  --data '{
    "consistency": { "minimizeLatency": true },
    "resource": { "objectType": "folder", "objectId": "budget" },
    "permission": "view",
    "subject": { "object": { "objectType": "user", "objectId": "anne" } }
  }'
```

正しく構成できていれば `PERMISSIONSHIP_HAS_PERMISSION` が返る:

```text
{
    "checkedAt": { "token": "GhUKEzE3NTE1NjYwMjUwMDAwMDAwMDA=" },
    "permissionship": "PERMISSIONSHIP_HAS_PERMISSION"
}
```

## 次に読むもの

本番ではインメモリストアをやめ、`--datastore-engine` で実バックエンド (PostgreSQL、MySQL、CockroachDB、Spanner) を選ぶ。AuthZed のドキュメントがスキーマ設計、`zed` CLI、consistency と ZedToken、Watch API、ディスパッチのファンアウトを伴うクラスタ運用を扱う。

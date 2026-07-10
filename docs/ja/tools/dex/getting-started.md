# はじめに

> コミット `17a54e9` のリポジトリに基づく。コマンドは Go 1.25 を入れた Unix シェルを想定。

## 前提

- Go 1.25 以上。コンテナイメージを使うなら Docker。
- 動作確認用の下流 OIDC クライアント。リポジトリにはソースからビルドできる `example-app` が同梱されている。

## インストール

リポジトリから `dex` バイナリをビルドする。

```bash
git clone https://github.com/dexidp/dex.git
cd dex
make build
# ./bin/dex が生成される
```

コンテナイメージも公開されているので、`docker pull ghcr.io/dexidp/dex` がビルドの代替になる。

## 最初の動く構成

最短で動くプロバイダは SQLite ストレージと mock コネクタを使うので、上流 ID プロバイダは不要だ。リポジトリの `config.dev.yaml` がまさにこれ。

**ステップ 1: Dex にサンプル設定を指す。** これは issuer、SQLite ストレージ、1 つの静的クライアント（`example-app`）、そして上流に一切接触せず定型ユーザをログインさせる `mockCallback` コネクタを宣言する。

```yaml
issuer: http://127.0.0.1:5556/dex
storage:
  type: sqlite3
  config:
    file: var/sqlite/dex.db
web:
  http: 127.0.0.1:5556
staticClients:
  - id: example-app
    redirectURIs:
      - 'http://127.0.0.1:5555/callback'
    name: 'Example App'
    secret: ZXhhbXBsZS1hcHAtc2VjcmV0
connectors:
  - type: mockCallback
    id: mock
    name: Example
```

**ステップ 2: server を起動する。**

```bash
./bin/dex serve config.dev.yaml
```

**ステップ 3: 別ターミナルで example クライアントをビルドして実行し**、ブラウザで開いてフルのログインを走らせる。

```bash
make examples
./bin/example-app
# http://127.0.0.1:5555 を開く
```

ログインを押すと Dex にリダイレクトされ、mock コネクタがログインさせ、example アプリが発行された ID Token を受け取って表示する。

## 動作確認

Discovery ドキュメントを取得してプロバイダが上がっているか確かめる。issuer とエンドポイントを記した JSON が返るはず。

```bash
curl http://127.0.0.1:5556/dex/.well-known/openid-configuration
```

正常な Dex は公開署名鍵も `/dex/keys` で配信する。下流クライアントはこれで ID Token の署名を検証する。

## 次に読むもの

mock コネクタを実物（LDAP・SAML・GitHub・Google、または汎用 OIDC）に置き換え、テスト以上の用途ではストレージを Postgres・etcd・Kubernetes CRD に切り替える。HA・鍵ローテーション・コネクタ設定などの本番運用は、ここで再導出せず公式ドキュメントに従うこと。

## 出典

- [Dex ドキュメント: getting started](https://dexidp.io/docs/getting-started/)
- [Dex `config.dev.yaml`](https://github.com/dexidp/dex/blob/17a54e9046cee1142530de4d0a809809d7c9cee9/config.dev.yaml)

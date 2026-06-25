# はじめに

> コミット `24db054` の Docker Compose インストールで検証済み。コマンドは Compose プラグイン付きの Docker を想定。

## 前提

- Docker がインストール済みで動作していること。
- Docker Compose プラグイン (`docker-compose` / `docker compose`)。
- ローカルポート `8080` (UI と REST)、`9090` (gRPC)、`18080` (Keycloak) が空いていること。

## インストール

最も簡単な構成はリポジトリ同梱の Compose スタックを使う (出典 9)。リポジトリを clone してスタックを起動する:

```bash
git clone https://github.com/microcks/microcks.git
cd microcks/install/docker-compose
docker-compose up -d
```

これで MongoDB (`microcks-db`)、Keycloak (`microcks-sso`, ホストポート `18080`)、Postman runtime、Microcks コア (`microcks`, ホストポート `8080` と `9090`) が起動する。すべて `install/docker-compose/docker-compose.yml` で定義されている。

## 最初の動く構成

1. 下記のアドレスで UI を開き、Keycloak でログインする。

   UI は `http://localhost:8080` で配信され、Keycloak のログインページへリダイレクトされる (出典 9)。

2. README のデフォルト認証情報を使う (`README.md`):

   ```text
   Username: admin
   Password: microcks123
   ```

3. API アーティファクトを import する。UI からサンプルの OpenAPI や Postman コレクションを追加する (または importer に URL を指定する)。Microcks はアーティファクト内の example を読み取り、即座に `/rest/{service}/{version}/...` 配下のライブモックエンドポイントとして公開する。配信は `RestController` が担う (`webapp/src/main/java/io/github/microcks/web/RestController.java:97-107`)。

## 動作確認

コアコンテナが公開する health エンドポイントを確認する。Compose の healthcheck も同じパスを使う (`docker-compose.yml:64`):

```bash
curl -f http://localhost:8080/api/health
```

正常な応答と `http://localhost:8080` で到達できる UI が、スタック起動の確認になる。サンプル API を import した後は、生成されたモック URL を呼ぶと仕様の example 応答が返るはずである。

## 次に読むもの

イベント駆動 (AsyncAPI) のモックには、同じ `install/docker-compose` ディレクトリの `async-addon.yml` オーバーレイで async minion とブローカーを追加する。Kubernetes デプロイ (Operator や Helm chart)、HA、認証強化などの本番運用は、公式ドキュメント [microcks.io/documentation](https://microcks.io/documentation/) を参照。

# Getting Started

> `latest-snapshot` Docker イメージと、コミット `3443acd9` の `main` ソースツリーで検証済み。コマンドは Unix シェルを想定。

## 前提

- Docker（プレビルドイメージを動かす最速の経路）。
- ソースビルドする場合: JDK 21、Maven（同梱の `./mvnw` ラッパーで可）、Git。

## インストール

プレビルドイメージでサーバを起動する。registry が in-memory 永続化でポート 8080 に立ち上がる（出典 2）:

```bash
docker run -it -p 8080:8080 apicurio/apicurio-registry:latest-snapshot
```

REST API は `http://localhost:8080/apis` で提供される。

Web UI も動かすなら、そのイメージを別ポートで起動する（出典 2）:

```bash
docker run -it -p 8888:8080 apicurio/apicurio-registry-ui:latest-snapshot
```

UI は `http://localhost:8888` で提供される。

## 最初の動く構成

以下のステップは Avro スキーマを登録して読み戻す。Install ステップのサーバがポート 8080 で動いている前提。

1. `default` group に小さな Avro スキーマを初版として artifact を作成する。

    ```bash
    curl -i -X POST \
      http://localhost:8080/apis/registry/v3/groups/default/artifacts \
      -H 'Content-Type: application/json' \
      -d '{
        "artifactId": "user-value",
        "artifactType": "AVRO",
        "firstVersion": {
          "content": {
            "content": "{\"type\":\"record\",\"name\":\"User\",\"fields\":[{\"name\":\"id\",\"type\":\"string\"}]}",
            "contentType": "application/json"
          }
        }
      }'
    ```

    成功すると `HTTP/1.1 200 OK` と、作成された artifact と初版を記述する JSON ボディが返る。

2. 最新版の content を読み戻す。

    ```bash
    curl -s \
      http://localhost:8080/apis/registry/v3/groups/default/artifacts/user-value/versions/branch=latest/content
    ```

    保存した Avro スキーマが出力される。

## 動作確認

`default` group の artifact 一覧を出し、`user-value` が現れることを確認する:

```bash
curl -s http://localhost:8080/apis/registry/v3/groups/default/artifacts
```

JSON レスポンスには `artifactId` が `user-value` のエントリを含む `artifacts` 配列がある。ブラウザで `http://localhost:8080/apis` を開けば API ランディングページも見られる。

## ソースからのビルド

Docker でなくソースからサーバを動かすには、fast tier をビルドして Quarkus dev mode を起動する（出典 2）:

```bash
./mvnw clean install -Dfast -DskipTests
cd app
../mvnw quarkus:dev
```

これで Quarkus が in-memory registry とともに起動し、REST API が `http://localhost:8080/apis` に出る。

## 次に読むもの

in-memory 永続化はお試し専用。本番では `APICURIO_STORAGE_KIND`（`sql` / `kafkasql` / `gitops`）でストレージバックエンドを選び、高可用性・認証・Kubernetes operator は公式ドキュメントを参照する: <https://github.com/Apicurio/apicurio-registry>。

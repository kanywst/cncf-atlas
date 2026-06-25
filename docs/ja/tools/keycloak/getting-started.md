# はじめに

> `26.6.3` で検証済み。コマンドは Docker がインストール済みでポート 8080 が空いていることを想定する。

## 前提

- コンテナイメージを動かす Docker (または Podman)。
- HTTP リスナと Admin Console 用に空いているローカルポート 8080。

## インストール

最短経路は公式コンテナイメージである。ローカルビルドは不要。

```bash
docker pull quay.io/keycloak/keycloak:26.6.3
```

## 最初の動く構成

これは Keycloak を開発モードで起動する。永続化なし、平文 HTTP、初期 admin アカウント付きである。`KC_BOOTSTRAP_ADMIN_*` 変数がそのアカウントを seed する (`docs/documentation/server_admin/topics/assembly-creating-first-admin.adoc:22-27`)。

`start-dev` でサーバを起動する。

```bash
docker run -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.6.3 start-dev
```

続いて:

1. `http://localhost:8080` で Admin Console を開き、`admin` / `admin` でログインする。
2. realm を作成する。
3. アプリ向けにトークンを発行するための client を作成する。

## 動作確認

起動ログで running メッセージを確認する。Quarkus のブートストラップが完了するとサーバは `The server is running` を出力する (`quarkus/runtime/src/main/java/org/keycloak/quarkus/runtime/KeycloakMain.java:63`)。その後 `http://localhost:8080` で Admin Console が応答し、ログインできることを確認する。

## 次に読むもの

開発モードは本番向けではない。実運用では二段モデルを使う。`kc.sh build` が build-time オプションを確定し、その後 `kc.sh start` が DB・hostname・TLS 設定を適用する。DB・hostname・TLS・HA など本番の関心事は [getting-started Docker ガイド](https://www.keycloak.org/getting-started/getting-started-docker) と [Quarkus migration doc](https://www.keycloak.org/migration/migrating-to-quarkus) を参照。

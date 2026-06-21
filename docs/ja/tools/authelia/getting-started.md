# はじめに

> 公式の get-started ガイドに基づく。Authelia はテスト構成でも HTTPS を要求する。

## 前提

- フォワード認証に対応したリバースプロキシ（Traefik / NGINX / Caddy / Envoy）。
- HTTPS を提供する手段。Authelia は平文 HTTP では動作を拒否する。

## インストール

Authelia はコンテナイメージ、Kubernetes 向け Helm チャート、単体バイナリで配布される。コンテナイメージが一般的:

```bash
docker pull authelia/authelia
```

## 最初の動く構成

最小構成は `configuration.yml` の 4 つの領域をカバーする。公式リポジトリは出発点として `config.template.yml` を同梱している。

1. **認証バックエンド。** YAML ファイルのユーザデータベース（テストに最も簡単）か、実ディレクトリ用の LDAP。
2. **ストレージ。** テストは SQLite、本番は MySQL か PostgreSQL。
3. **セッション。** セッションシークレットとシングルサインオンのドメイン。本番と HA には Redis が推奨。
4. **通知。** テストはファイルシステム通知、本番は SMTP。検証・リセットのメッセージ送信に使う。

その上で、保護ルートが forward-auth サブリクエストを出すようにリバースプロキシを Authelia の認可エンドポイントへ向け、どのドメインが一要素・二要素・拒否かを決める初期アクセス制御ポリシーを書く。

## 動作確認

プロキシ越しに保護対象アプリへアクセスする。未認証のリクエストは Authelia ポータルへリダイレクトするはず。ログインと第二要素を済ませると同じリクエストがアプリに到達し、アプリは Authelia が成功時に付ける `Remote-User` と `Remote-Groups` ヘッダを受け取るはず。

## 次に読むもの

Redis での HA、LDAP 統合、OpenID Connect プロバイダ、アクセス制御ルールの調整といった本番運用は、ここで再導出せず公式ドキュメントに従うこと。

## 出典

- [Authelia get-started ガイド](https://www.authelia.com/integration/prologue/get-started/)
- [プロキシ統合の対応表](https://www.authelia.com/integration/proxies/support/)

# 採用事例・エコシステム

## 誰が使っているか

このディープダイブでは、一次出典で名指しできる採用組織を確認できなかった。リポジトリに `ADOPTERS` ファイルは存在せず (コミット `9da4c56` で確認)、確認したレビュー記事は authentik がセルフホストコミュニティで人気がある点や Okta/Auth0 の代替である点に触れるが、個別の組織を一次出典として名指ししてはいない ([opentechhub](https://www.opentechhub.io/authentik/))。採用企業を捏造せず、ここでは以下の GitHub シグナルを報告する。

## 採用のシグナル

[GitHub REST API](https://api.github.com/repos/goauthentik/authentik) で 2026-06-22 に観測:

| シグナル | 値 |
| --- | --- |
| スター | 22,091 |
| フォーク | 1,663 |
| ウォッチャー | 68 |
| リポジトリ作成 | 2019-12-30 |

コントリビュータのリストは `per_page=1` でおよそ 557 ページ (anonymous 込み) に及び、幅広いコントリビュータ基盤を示す。リリースは頻繁なカレンダーバージョニング (本コミットのコードは `2026.8.0-rc1` を宣言、直近の安定タグは `version/2026.5.3`)。

## エコシステム

- forward-auth outpost が Traefik・nginx・Envoy などのリバースプロキシの前段に立ち、認証を持たないアプリに認証を足す。
- デプロイ手段は公式 Helm チャート・Docker Compose・Kubernetes マニフェスト ([ドキュメント](https://docs.goauthentik.io/))。
- 同梱のプロトコルプロバイダ (`authentik/providers/`) は OAuth2/OIDC・SAML・LDAP・RADIUS・RAC・SCIM をカバーし、1 つのサーバがアプリとも外部ディレクトリとも連携する。
- `authentik/sources/` がソーシャルログインと外部ディレクトリの取り込みを足す。

## 代替候補

authentik の本質的な差は、認証を組み立てるビジュアルな「Flow, Stage, Policy」モデルと、多くのプロトコル (OIDC・SAML・LDAP・RADIUS・RAC・SCIM) を 1 つのサーバに束ねる点だ ([elest.io 比較](https://blog.elest.io/authentik-vs-authelia-vs-keycloak-choosing-the-right-self-hosted-identity-provider-in-2026/))。この幅をセルフホストしたいなら authentik を、より狭い焦点が合うなら代替を選ぶ。

| 代替 | 違い |
| --- | --- |
| Keycloak | Red Hat のフル機能 OSS IdP。機能では最も近いが、管理体験が重く複雑 |
| Authelia | 軽量で forward-auth に特化。IdP 機能は authentik より少ない |
| Zitadel | マルチテナント・クラウドネイティブ志向の OSS IdP |
| Ory | 1 つの束ねたサーバではなく、組み立て可能な ID コンポーネント (Kratos、Hydra) |
| Okta / Auth0 / Entra ID | ホスト型の商用 IdP。セルフホストはなく、運用はマネージド |

# authentik

> SSO・OAuth2/OIDC・SAML・LDAP・RADIUS・SCIM を 1 つのサーバとビジュアルなフローエディタの裏側にまとめた、セルフホスト型の ID プロバイダ。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Independent (CNCF プロジェクトではない)
- **言語**: Python (Django) コア、Go outpost、TypeScript/Lit の Web UI
- **ライセンス**: コアは MIT。`website/` は CC BY-SA 4.0、`authentik/enterprise/` は source-available な Enterprise ライセンス
- **リポジトリ**: [goauthentik/authentik](https://github.com/goauthentik/authentik)
- **ドキュメント基準コミット**: `9da4c56` (コード上のバージョンは `2026.8.0-rc1`、直近の安定タグは `version/2026.5.3`)

## 何をするものか

authentik は自分で運用する ID プロバイダ。1 つのサーバが、アプリのログインに必要になりがちなプロトコルを話す: OAuth2/OIDC、SAML、LDAP、RADIUS、SCIM。ネイティブな認証を持たないアプリに対しては、outpost と呼ばれる別の Go プロセスを通じて forward-auth ゲートとしても振る舞う。

特徴的なのは「Flow, Stage, Policy」モデル。固定のログイン画面ではなく、管理者が順序付きのステージ (identification、password、MFA、consent) から認証フローを組み立て、各ステージをポリシーでゲートする。ポリシーは静的な user/group メンバーシップ判定でも、ユーザ定義の Python 式でもよい。フロープランナがこれらを評価し、実行すべきステージの平坦なリストを生成する。

3 言語を混在させた単一リポジトリからビルド・実行する: データモデルとプロトコルプロバイダを所有する Python/Django のコア、proxy/LDAP/RADIUS/RAC を担う Go の outpost 群、管理 UI とフロー executor のための TypeScript/Lit フロントエンド。

## いつ使うか

- 複数ツールを組み合わせるのではなく、OIDC・SAML・LDAP・forward-auth を 1 つのセルフホストサーバで賄いたいとき。
- ホスト型 IdP (Okta、Auth0、Entra ID) を置き換え、ID を自分の管理下のインフラに留めたいとき。
- カスタムなログインロジック (条件付き MFA、スクリプト化したアクセスルール) を、コード変更ではなく組み立て可能なフローとポリシーで表現したいとき。

向かないのは、中立財団がガバナンスするプロジェクトが欲しい場合 (authentik は単一ベンダの open core、[歴史](./history) 参照)、あるいは Authelia のような forward-auth 特化の軽量ゲートで足りる場合。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [goauthentik/authentik のソース](https://github.com/goauthentik/authentik)、コミット `9da4c56` で固定。
2. [Happy Birthday to Us!](https://goauthentik.io/blog/2023-11-1-happy-birthday-to-us/)、起源と歴史についての authentik ブログ。
3. [Install authentik via Docker Compose](https://docs.goauthentik.io/install-config/install/docker-compose)、公式ドキュメント。
4. [Welcome to authentik](https://docs.goauthentik.io/)、公式ドキュメント。
5. [CNCF Projects](https://www.cncf.io/projects/)、authentik が CNCF プロジェクトでないことの確認。
6. [GitHub REST API: repos/goauthentik/authentik](https://api.github.com/repos/goauthentik/authentik)、2026-06-22 参照。
7. [Authentik: The Open Source Alternative to Okta & Auth0](https://www.opentechhub.io/authentik/)。
8. [Authentik vs Authelia vs Keycloak (2026)](https://blog.elest.io/authentik-vs-authelia-vs-keycloak-choosing-the-right-self-hosted-identity-provider-in-2026/)。

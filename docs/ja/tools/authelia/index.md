# Authelia

> オープンソースの認証・認可サーバ。リバースプロキシの背後にあるアプリにシングルサインオンと二要素認証を提供し、OpenID Connect プロバイダとしても動作する。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Independent（CNCF プロジェクトではない）
- **言語**: Go（`go 1.26`）、フロントエンドは React
- **ライセンス**: Apache-2.0
- **リポジトリ**: [authelia/authelia](https://github.com/authelia/authelia)
- **ドキュメント基準コミット**: `06af72a`（v4.39.20）

## 何をするものか

Authelia はリバースプロキシとその背後のアプリの間に立つ。プロキシは受け取ったリクエストをまず Authelia に転送する。Authelia は有効なセッションがあるか、そのセッションが対象に到達してよいかを確認し、通すなら `200 OK`、ダメなら自分のログインポータルへのリダイレクトを返す。この方式を forward authentication（フォワード認証）と呼び、これにより認証機構を持たないアプリも保護できる。

プロキシのゲートに加えて、Authelia はログインポータル自体も動かす。ファイルまたは LDAP のユーザストアを使ったユーザ名・パスワードの段、続いて第二要素（TOTP、WebAuthn / パスキー、Duo プッシュ）。さらに OpenID Connect 1.0 をプロバイダとして話すので、OIDC をネイティブ対応するアプリはプロキシを経由せず Authelia に直接認証できる。

実体は単一の Go バイナリで、SQL データベース（SQLite / MySQL / PostgreSQL）、セッション用の任意の Redis、YAML 設定ファイルから成る。コンテナイメージは小さくメモリ使用量も低い。これがセルフホスト界隈で定番になった理由のひとつ。

## いつ使うか

- 1 つのリバースプロキシ（Traefik / NGINX / Caddy / Envoy）の背後に複数の Web アプリを置き、その前段に 1 つのログインと 1 つのアクセス制御ポリシーを置きたいとき。
- 二要素認証を持たないアプリにそれを足したいとき。
- フル機能のエンタープライズ ID プラットフォームではなく、小さなセルフホスト SSO ポータルが欲しいとき。

ユーザフェデレーション・ブローカリング・多数テナントを備えたフル機能の ID プロバイダが必要なら不向き。その場合は [採用事例・エコシステム](./adoption) の Keycloak / Authentik との比較を参照。

## このディープダイブの構成

- [歴史](./history): Node.js での出発、v4 での Go 書き直し、現在地。
- [アーキテクチャ](./architecture): コンポーネントと forward-auth リクエストの流れ。
- [採用事例・エコシステム](./adoption): プロキシ対応、採用のシグナル、本当の代替。
- [内部実装](./internals): 認可エンジンとアクセス判定をソースから読む。
- [はじめに](./getting-started): 動く構成に必要な最小要素。

## 出典

- [Authelia リポジトリ](https://github.com/authelia/authelia)
- [Authelia ドキュメント](https://www.authelia.com/)
- [Authelia 4.39 リリースノート](https://www.authelia.com/blog/4.39-release-notes/)

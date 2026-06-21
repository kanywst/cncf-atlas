# OAuth2 Proxy

> Web サービスの前段に OAuth2 / OIDC ログインを置くリバースプロキシ。サービス本体は認証を一切扱わない。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: MIT
- **リポジトリ**: [oauth2-proxy/oauth2-proxy](https://github.com/oauth2-proxy/oauth2-proxy)
- **ドキュメント基準コミット**: `10b6871` (master, 2026-06-14, タグ v7.15.3 の直後)

## 何をするものか

OAuth2 Proxy は認証のシム (薄い差し込み層) だ。上流サービスの前段にリバースプロキシとして動き、各リクエストを横取りして有効なセッションがあるか確認する。なければ外部 IdP (Google, GitHub, GitLab, Azure, Keycloak, 汎用 OIDC など) との OAuth2 / OIDC ログインにユーザを通し、結果をセッション cookie に格納する。上流サービスには認証済みリクエストだけが届き、必要に応じて ID ヘッダが付与される。

自身でユーザを認証することはしない。資格情報の検証は設定されたプロバイダに委譲し、得たトークンをセッションとして、サーバ側 (Redis) かクライアント側 (cookie) に保持する。認可はその上の薄い層だ: email ドメインや許可 email リストの判定に加えて、プロバイダ自身の group / org ルールを適用する。

典型的な配置は、nginx の `auth_request` バックエンド、Traefik の `forwardAuth` ミドルウェア、Kubernetes のサイドカーとして、自前のログインを持たないダッシュボードや社内ツールにゲートをかける形だ。

## いつ使うか

- 認証を持たないアプリに SSO を被せたく、すでに OIDC / OAuth2 の IdP を運用している。
- nginx, Traefik, Kubernetes ingress を使い、サブリクエスト方式の認証ゲート (`/oauth2/auth` が 202 か 401 を返す) が欲しい。
- プロバイダごとの OAuth コードを書かずに広いプロバイダ対応が欲しい。
- 組み込みの MFA、細粒度のポリシーエンジン、コンテキスト認可が必要な場合は不向き。それらは Pomerium や Authelia のような厚いスタックの領分。
- ブラウザ駆動の SSO でなく、ログインリダイレクトを提示できないトラフィックにも不向き。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. CNCF プロジェクトページ, OAuth2 Proxy (Sandbox, 2025-10-02 受理): <https://www.cncf.io/projects/oauth2-proxy/>
2. CNCF Landscape エントリ: <https://landscape.cncf.io/?selected=o-auth2-proxy>
3. cncf/sandbox issue #397, OAuth2 Proxy sandbox 申請: <https://github.com/cncf/sandbox/issues/397>
4. cncf/sandbox issue #407, project onboarding: <https://github.com/cncf/sandbox/issues/407>
5. OAuth2 Proxy README (fork 履歴とリネーム): <https://github.com/oauth2-proxy/oauth2-proxy/blob/master/README.md>
6. OAuth2 Proxy 公式ドキュメント: <https://oauth2-proxy.github.io/oauth2-proxy/>
7. OAuth2 Proxy インストールドキュメント: <https://oauth2-proxy.github.io/oauth2-proxy/installation>
8. Pomerium ブログ, OAuth2 Proxy alternatives: <https://www.pomerium.com/blog/best-oauth2-proxy-alternative>
9. oauth2-proxy issue #1170, OAuth2 Proxy vs Pomerium: <https://github.com/oauth2-proxy/oauth2-proxy/issues/1170>
10. OAuth2 Proxy GitHub リポジトリ: <https://github.com/oauth2-proxy/oauth2-proxy>

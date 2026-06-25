# Keycloak

> OIDC / OAuth 2.0 / SAML を話すアプリ向けのオープンソース ID 管理・アクセス制御サーバ。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Incubating
- **言語**: Java (`maven.compiler.release` 17)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [keycloak/keycloak](https://github.com/keycloak/keycloak)
- **ドキュメント基準コミット**: `e733440` (2026-06-24、タグ `26.6.3` 近傍)

## 何をするものか

Keycloak は単独で動く ID プロバイダ (IdP) である。アプリは自前でログインを実装せず、ログイン・シングルサインオン・トークン発行を Keycloak に委譲する。OpenID Connect / OAuth 2.0 / SAML 2.0 を話すため、Web アプリ・モバイルクライアント・バックエンドサービスが標準プロトコル経由でユーザ認証とトークン取得を行える。

トークン発行にとどまらず、ユーザ自体も管理する。アカウントを自前の DB に保存することも、LDAP・Active Directory・Kerberos からフェデレーションすることも、外部 IdP やソーシャルログインから identity をブローカリングすることもできる。さらに User-Managed Access (UMA) 2.0 ベースのきめ細かい Authorization Services を備え、ポリシー駆動のアクセス判定を一箇所に集約したいプロジェクトに対応する。

ランタイムは Quarkus アプリケーションである。同一サーバがログインフロー・admin REST API・React 製の Admin / Account コンソール・(任意の) Kubernetes Operator を提供する。

## いつ使うか

- トークンエンドポイントだけでなく、ユーザストレージ・SSO・トークン発行まで備えた本格的な IdP が要るとき。
- エンタープライズディレクトリ (LDAP・Active Directory・Kerberos) と統合する、または外部・ソーシャル IdP をブローカリングする必要があるとき。
- OIDC・OAuth 2.0・SAML をプロトコルごとに別コンポーネントへ分けず、1 つのサーバで賄いたいとき。
- 集中管理されたポリシー駆動の認可 (UMA 2.0 Authorization Services) が要るとき。

ユーザ管理を持たない軽量な OAuth2/OIDC トークンサーバだけが欲しい場合は重すぎる。そこは専用のトークンサーバの方が合う。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [keycloak/keycloak (GitHub)](https://github.com/keycloak/keycloak)
2. [Keycloak (CNCF プロジェクトページ)](https://www.cncf.io/projects/keycloak/)
3. [Keycloak joins CNCF as an incubating project](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/)
4. [Migrating to Quarkus distribution](https://www.keycloak.org/migration/migrating-to-quarkus)
5. [Keycloak 17 is out, Quarkus is now the default (n-k.de)](https://www.n-k.de/2022/02/keycloak-17-quarkus-distribution-default.html)
6. [Getting started with Keycloak on Docker](https://www.keycloak.org/getting-started/getting-started-docker)
7. [Keycloak releases](https://github.com/keycloak/keycloak/releases)
8. [ADOPTERS.md (リポジトリ内)](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md)
9. [Keycloak (Wikipedia)](https://en.wikipedia.org/wiki/Keycloak)
10. [Best Keycloak Alternatives & Competitors 2025 (Oso)](https://www.osohq.com/learn/best-keycloak-alternatives-2025)
11. [State of Open-Source Identity 2025 (House of FOSS)](https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel)

# 採用事例・エコシステム

## 誰が使っているか

リポジトリ内の `ADOPTERS.md` は、公開リファレンスに同意した組織を列挙している。CNCF 受理 blog はさらに本番採用例を挙げている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Accenture | 公開採用企業 | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| CERN (European Organisation for Nuclear Research) | 公開採用企業 | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| Hewlett-Packard Enterprise | 公開採用企業 | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| Hitachi | 公開採用企業 | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| Capgemini | 公開採用企業 | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| Bundesagentur für Arbeit | 公開採用企業 | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| AlmaLinux Foundation | 公開採用企業 | [ADOPTERS.md](https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md) |
| Cisco, Ohio Supercomputing Center, Okta, Quest | 本番採用例として記載 | [CNCF blog](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/) |

## 採用のシグナル

- GitHub stars: 35,044、forks: 8,531 (GitHub API、観測日 2026-06-24)。
- contributors: anonymous 含め 1,800 超、GitHub contributors API 経由 (観測日 2026-06-24)。
- CNCF 受理時点で stars 15,000 超、keycloak.org が月間 15 万訪問超と報告 ([CNCF blog](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/))。
- `26.x` 系で頻繁なマイナーリリース。`26.6.3` は 2026-06-04 リリース ([releases](https://github.com/keycloak/keycloak/releases))。

## エコシステム

Keycloak は OIDC・OAuth 2.0・SAML 2.0 を話す IdP として機能する。LDAP・Active Directory・Kerberos からユーザをフェデレーションし、外部 IdP やソーシャルログインから identity をブローカリングし、User-Managed Access (UMA) 2.0 ベースの Authorization Services を提供する。Kubernetes Operator (`operator/`) と React 製の Admin / Account コンソール (`js/`) を同梱する。Red Hat build of Keycloak の upstream でもある。

## 代替候補

Keycloak はエンタープライズフェデレーションとレガシー統合のデフォルトである。強みは機能網羅性と成熟度で、トレードオフは重さと設定の複雑さである ([Oso](https://www.osohq.com/learn/best-keycloak-alternatives-2025))。

| 代替 | 違い |
| --- | --- |
| Authentik (Python/TS) | Flow Engine による柔軟な認証フローと forward-auth proxy モード。OIDC を話さないアプリの前段に置ける ([House of FOSS](https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel)) |
| Zitadel (Go) | event-sourced で全変更が監査可能、ネイティブ multi-tenancy、Kubernetes-first 設計。2025 に Apache-2.0 から AGPL-3.0 へ移行 ([Oso](https://www.osohq.com/learn/best-keycloak-alternatives-2025)) |
| Ory Hydra (Go) | OAuth2/OIDC トークンサーバ専業でユーザ管理を持たない。Kratos 等と組み合わせる。大量クライアント向けの軽量トークン発行に適する ([Oso](https://www.osohq.com/learn/best-keycloak-alternatives-2025)) |

# 採用事例・エコシステム

## 誰が使っているか

Authelia の採用は、主に GitHub 上の存在感とセルフホスト界隈での定番性から見える。名前の挙がるエンタープライズのケーススタディは無い。2026-06-21 時点でリポジトリのスター数は約 28,100、フォーク約 1,420。README は 100 名超のコントリビュータを挙げる。

ADOPTERS ファイルは無く、本番で Authelia を運用する特定組織を名指しする公開ケーススタディも無い。2025〜2026 年の独立した比較記事はいずれも、homelab・セルフホスト界隈で目的特化の SSO / 2FA の定番として一貫して位置づけ、軽量ユーザストアの LLDAP と組み合わせる例が多い。採用はセルフホストでは広く、エンタープライズの参照事例としては文書化されていない。

## 採用のシグナル

| シグナル | 値 | 観測日 |
| --- | --- | --- |
| GitHub スター | 約 28,100 | 2026-06-21 |
| GitHub フォーク | 約 1,420 | 2026-06-21 |
| コントリビュータ | 100 名超 | README より |
| コンテナイメージ | 小さいイメージ、低メモリ使用量 | プロジェクト文書より |

## エコシステム

Authelia はリバースプロキシの相棒なので、そのエコシステムは統合先のプロキシ群そのもの。公式の対応表より:

| プロキシ | 方式 | 状態 |
| --- | --- | --- |
| Traefik（v2, v3） | ForwardAuth | 完全対応 |
| Caddy（v2.5.1+） | ForwardAuth | 完全対応 |
| NGINX | auth_request | 完全対応 |
| Envoy（Authelia v4.37.0+ 経由） | ExtAuthz | 完全対応 |
| HAProxy | ForwardAuth（Lua） | 対応、Lua が必要 |
| Skipper | ForwardAuth | 完全対応 |

Kubernetes では NGINX / Traefik の Ingress コントローラ、および Envoy Gateway や Istio の外部認可を通じて統合する。Apache httpd と IIS は対応しない。どちらにも適した認証モジュールが無いため。ユーザストアの LLDAP、セッションの Redis、通知の SMTP と並べて運用されることが多く、OIDC をネイティブに話すアプリ向けに単体の OpenID Connect プロバイダとしても立てられる。

## 代替候補

Authelia とその代替の本質的な違いは、forward-auth のゲートかフル機能の ID プロバイダか、という点。下の比較は実務記事の総合で、ライセンス表記は公開前に各プロジェクトで確認すること。

| 代替 | 本質的な違い |
| --- | --- |
| Keycloak | レルム・SAML・LDAP / AD フェデレーションを備えた実績あるフル ID プロバイダ。重く、ネイティブには forward-auth ゲートではない。フェデレーション付きのエンタープライズ IAM なら Keycloak、軽量ゲートなら Authelia。 |
| Authentik | フル ID プロバイダで、proxy outpost による forward-auth も持つ。両方要るときの最有力だが重い。最小フットプリントなら Authelia。 |
| Ory（Kratos, Hydra, Oathkeeper） | プロダクトに認証を組み込むための API 優先の ID プリミティブ。組み立てが要る。出来合いのポータルなら Authelia。 |
| oauth2-proxy | ユーザストアも MFA も持たない純粋なプロキシ認証シム。外部プロバイダに委譲する。プロバイダと MFA 自体が欲しいなら Authelia。 |
| Zitadel | SaaS 向けの API 優先・マルチテナントなプロバイダで forward-auth モードが無い。プロキシでゲートするセルフホストなら Authelia。 |

## 出典

- [GitHub API: authelia/authelia](https://api.github.com/repos/authelia/authelia)
- [プロキシ統合の対応表](https://www.authelia.com/integration/proxies/support/)
- [The state of open-source identity in 2025](https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel)
- [Authentik vs Authelia vs Keycloak, 2026](https://blog.elest.io/authentik-vs-authelia-vs-keycloak-choosing-the-right-self-hosted-identity-provider-in-2026/)

# sources: Keycloak

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日を添える。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | keycloak/keycloak (GitHub) | <https://github.com/keycloak/keycloak> | 2026-06-24 |
| 2 | case-study | Keycloak (CNCF project page) | <https://www.cncf.io/projects/keycloak/> | 2026-06-24 |
| 3 | blog | Keycloak joins CNCF as an incubating project | <https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/> | 2026-06-24 |
| 4 | doc | Migrating to Quarkus distribution | <https://www.keycloak.org/migration/migrating-to-quarkus> | 2026-06-24 |
| 5 | blog | Keycloak 17 is out, Quarkus is now the default (n-k.de) | <https://www.n-k.de/2022/02/keycloak-17-quarkus-distribution-default.html> | 2026-06-24 |
| 6 | doc | Getting started with Keycloak on Docker | <https://www.keycloak.org/getting-started/getting-started-docker> | 2026-06-24 |
| 7 | repo | Keycloak releases | <https://github.com/keycloak/keycloak/releases> | 2026-06-24 |
| 8 | repo | ADOPTERS.md (in-repo) | <https://github.com/keycloak/keycloak/blob/main/ADOPTERS.md> | 2026-06-24 |
| 9 | repo | GOVERNANCE.md (in-repo) | <https://github.com/keycloak/keycloak/blob/main/GOVERNANCE.md> | 2026-06-24 |
| 10 | wiki | Keycloak (Wikipedia, origin 2014) | <https://en.wikipedia.org/wiki/Keycloak> | 2026-06-24 |
| 11 | blog | Best Keycloak Alternatives & Competitors 2025 (Oso) | <https://www.osohq.com/learn/best-keycloak-alternatives-2025> | 2026-06-24 |
| 12 | blog | State of Open-Source Identity 2025 (House of FOSS) | <https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel> | 2026-06-24 |

## path:line アンカー (コード側)

| 主張 | アンカー |
| --- | --- |
| エントリポイント (QuarkusMain) | `quarkus/runtime/src/main/java/org/keycloak/quarkus/runtime/KeycloakMain.java:58-71` |
| Java 17 / Maven multi-module | `pom.xml:36` (`maven.compiler.release`) |
| KeycloakSession ファサード / SPI 解決 | `server-spi/src/main/java/org/keycloak/models/KeycloakSession.java:35,52,64,148,192,224` |
| token エンドポイント処理 | `services/src/main/java/org/keycloak/protocol/oidc/endpoints/TokenEndpoint.java:121,133-138,165,171,202-223` |
| authorization_code grant 本体 | `services/src/main/java/org/keycloak/protocol/oidc/grants/AuthorizationCodeGrantType.java:76,87-172,187-195,207-208,215,275` |
| 認可コードの single-use 取り出し | `services/src/main/java/org/keycloak/protocol/oidc/utils/OAuth2CodeParser.java:71-79,98-104` |
| token response builder | `services/src/main/java/org/keycloak/protocol/oidc/grants/OAuth2GrantTypeBase.java:114-148` |
| OAuth2Code フィールド | `services/src/main/java/org/keycloak/protocol/oidc/utils/OAuth2Code.java:45-61` |
| AccessToken クレーム | `core/src/main/java/org/keycloak/representations/AccessToken.java:40,137-152` |
| 最小起動 (bootstrap admin) | `docs/documentation/server_admin/topics/assembly-creating-first-admin.adoc:22-27` |
| ライセンス Apache-2.0 | `LICENSE.txt` |

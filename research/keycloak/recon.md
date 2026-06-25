# recon: Keycloak

調査メモ。密度優先。出典は URL + `path:line` を必ず添える。`src/` は gitignore 配下のクローン。

## 基本情報

- repo: `keycloak/keycloak` (<https://github.com/keycloak/keycloak>)
- pinned commit: `e73344070e0bb0dc57dcddb4ed79aff4854fa39a` (committer date 2026-06-24) / 近いタグ: `26.6.3` (2026-06-04 リリース、HEAD はこの後の main)
- 言語 / ビルド: Java (`maven.compiler.release` = 17、`pom.xml:36`) / Maven multi-module (`./mvnw`、ルート `pom.xml` に 33 modules)
- ランタイム: Quarkus ベースのサーバ配布物。エントリポイントは `org.keycloak.quarkus.runtime.KeycloakMain` (`quarkus/runtime/src/main/java/org/keycloak/quarkus/runtime/KeycloakMain.java:58-71`、`@QuarkusMain`)
- ライセンス: Apache-2.0 (`LICENSE.txt` 冒頭で確認、GitHub API も `Apache-2.0`)
- CNCF 成熟度: Incubating (2023-04-10 受理、<https://www.cncf.io/projects/keycloak/>)
- カテゴリ (tools.ts): Identity & Policy
- 英語 tagline: Open-source identity and access management server speaking OIDC, OAuth 2.0, and SAML for apps and services.
- 日本語 tagline: OIDC / OAuth 2.0 / SAML を話すアプリ向けのオープンソース ID 管理・アクセス制御サーバ。

## 歴史の素材

- 2014 年に Bill Burke と Stian Thorgersen が立ち上げ。Red Hat / WildFly コミュニティ配下のプロジェクトとして始まり、Red Hat build of Keycloak の upstream。出典: CNCF blog (<https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/>)、Wikipedia (<https://en.wikipedia.org/wiki/Keycloak>)。
- 2022-02 Keycloak 17: 配布物のデフォルトが WildFly アプリサーバから Quarkus へ。XML + jboss-cli 構成をやめ、単一の設定ファイル + CLI 引数 / 環境変数へ。build-time / run-time の二段モデル (`kc.sh build` → `kc.sh start`) を導入。出典: <https://www.keycloak.org/migration/migrating-to-quarkus>、<https://www.n-k.de/2022/02/keycloak-17-quarkus-distribution-default.html>。
- WildFly 配布物は Keycloak 20 までで EOL、その後完全に削除。新 Operator が Quarkus 配布物前提。出典: 同 migration ドキュメント。
- 2023-04-10 CNCF が Incubating として受理 (翌日 blog 公開)。受理時点で GitHub 15,000 stars 超、keycloak.org が月間 15 万訪問超と記載。出典: CNCF blog。
- リリースは現在 `26.x` 系。最新は `26.6.3` (2026-06-04、GitHub releases / API)。出典: <https://github.com/keycloak/keycloak/releases>。

## アーキテクチャの素材

トップレベル module (ルート `pom.xml` / ディレクトリ):

- `server-spi` / `server-spi-private`: 拡張ポイントの interface 群。`KeycloakSession` がファサード (`server-spi/src/main/java/org/keycloak/models/KeycloakSession.java:35`)。
- `services`: REST エンドポイントとプロトコル実装の本体 (OIDC / SAML / admin REST / authentication flow)。
- `model`: 永続化バックエンド実装 (JPA, Infinispan キャッシュ等)。
- `core`: トークン表現 (`AccessToken`, `IDToken` 等) と暗号プリミティブの共有型。
- `quarkus`: 実際に動くサーバ配布物。CLI (picocli) + Quarkus 統合 + 設定マッパー。
- `crypto`, `saml-core`, `authz` (Authorization Services / UMA), `federation` (LDAP/Kerberos), `operator` (Kubernetes Operator), `js` (Admin/Account コンソール + adapters), `themes`, `adapters`。

設計の軸: 全機能が SPI + ProviderFactory パターン。`KeycloakSession.getProvider(Class<T>, String id)` で実装を差し替える (`KeycloakSession.java:52,64`)。`session.users()` / `session.sessions()` / `session.realms()` のようなショートカットも SPI 解決のラッパ (`KeycloakSession.java:148,192,224`)。リクエスト 1 本につき `KeycloakSession` が 1 つ生き、`getContext()` で realm / client / HTTP を保持 (`KeycloakSession.java:37`)。

リクエストの流れ (token): JAX-RS リソース → `TokenEndpoint` → grant SPI で grant 種別を解決 → grant が code/refresh を検証して `TokenManager` でトークン生成。

## 内部実装の素材

代表操作: OIDC authorization_code grant のトークン交換 (`POST /realms/{realm}/protocol/openid-connect/token`)。end-to-end:

1. `TokenEndpoint.processGrantRequest()` (`services/src/main/java/org/keycloak/protocol/oidc/endpoints/TokenEndpoint.java:121`)。`@POST` + `application/x-www-form-urlencoded`。RFC 6749 §5.1 準拠で `Cache-Control: no-store` / `Pragma: no-cache` を即セット (`:133-134`)。
2. `checkSsl()` / `checkRealm()` / `checkGrantType()` (`:136-138`)。grant は `session.getProvider(OAuth2GrantType.class, grantType)` で SPI 解決 (`:220`)。未知の grant は `unsupported_grant_type` (`:221-223`)。
3. `checkClient()` がクライアント認証 (`AuthorizeClientUtil.authorizeClient`) → `client`, `clientConfig` を確定 (`:202-206`)。bearer-only クライアントは拒否 (`:210-212`)。
4. DPoP ヘッダ処理 (`DPoPUtil.handleDPoPHeader`、`:165`)。RFC 9449。
5. `grant.process(context)` (`:171`) へ。authorization_code の本体は `AuthorizationCodeGrantType.process()` (`services/src/main/java/org/keycloak/protocol/oidc/grants/AuthorizationCodeGrantType.java:76`)。
6. code をパース: `OAuth2CodeParser.parseCode()` (`AuthorizationCodeGrantType.java:87`)。code は不透明文字列 `codeUUID.userSessionId.clientUUID` (`OAuth2CodeParser.java:71-79`)。実データは single-use ストアから `remove` で原子的に取り出す (`OAuth2CodeParser.java:98`)。
7. 検証チェーン: code 不正/期限切れ (`AuthorizationCodeGrantType.java:88-106`)、user session / user 存在・有効 (`:108-132`)、`redirect_uri` 一致 (`:145-151`)、client_id 一致 (`:153-158`)、standard flow 許可 (`:160-165`)、session active (`:167-172`)、PKCE 検証 (RFC 7636、`:187-192`)、DPoP jkt 束縛 (`:195`)。
8. scope から `ClientSessionContext` を構築 (`:207-208`)、consent 再確認 (`:215`)、RAR (`authorization_details`) 処理 (`:225-273`)。
9. `createTokenResponse(...)` → base の `createTokenResponseBuilder()` (`services/src/main/java/org/keycloak/protocol/oidc/grants/OAuth2GrantTypeBase.java:114`)。`tokenManager.responseBuilder(...).accessToken(token)` でアクセストークン生成 (`:119-120`)、必要なら refresh token (`:123`)、ID token + at_hash (`:148`)、mTLS Holder-of-Key 束縛 (`:145`)。

非自明な設計判断: 認可コードは「ステートレスな参照キー」。`OAuth2CodeParser.parseCode` が single-use ストアに対して `remove` (削除して取得) を 1 回で行うため、同じコードの 2 回目の交換は必ず `codeData == null` になり `illegal_code` で弾かれる (`OAuth2CodeParser.java:98-104`)。さらに二重使用検知時には既存の clientSession を `detachFromUserSession()` して無効化する (`AuthorizationCodeGrantType.java:91-94`)。コード本体に状態を埋め込まず、`accessCodeLifespan` を TTL にして外部ストア (Infinispan 等) に置くことで、クラスタ間でコード再生攻撃 (replay) を防ぎつつ水平スケールできる。

中核データ構造 (3-5):

- `KeycloakSession` (`server-spi/src/main/java/org/keycloak/models/KeycloakSession.java:35`): リクエストスコープのファサード。全 SPI / Provider / コンテキストのエントリ。
- `OAuth2Code` (`services/src/main/java/org/keycloak/protocol/oidc/utils/OAuth2Code.java:45-61`): 認可コードに紐づく不変データ (id, expiration, nonce, scope, resource, redirectUriParam, codeChallenge(+method), dpopJkt, userSessionId)。`serializeCode()` / `deserializeCode()` で Map にして single-use ストアへ。
- `AccessToken` (`core/src/main/java/org/keycloak/representations/AccessToken.java:40`、`extends IDToken`): JWT クレーム。`realm_access` / `resource_access` (ロール)、`scope`、`cnf` (token binding)、`authorization` (UMA permissions)、`authorization_details` (RAR)。
- `RealmModel` / `ClientModel` / `UserModel` / `UserSessionModel` (`server-spi/src/main/java/org/keycloak/models/`): ドメインモデルの interface。realm がテナント境界、user session が SSO セッション、client が RP。
- `OAuth2GrantType` (SPI): grant 種別ごとの provider (`authorization_code`, `refresh_token`, `client_credentials`, `password`, `token-exchange`, CIBA, device, JWT bearer, UMA, pre-authorized)。`services/src/main/java/org/keycloak/protocol/oidc/grants/` 配下に実装。

## 採用事例の素材

- 在 repo の `ADOPTERS.md` (公開リファレンスに同意した組織のみ): Accenture, CERN (European Organisation for Nuclear Research), Hewlett-Packard Enterprise, Hitachi, Capgemini, Bundesagentur für Arbeit, AlmaLinux Foundation ほか多数。出典: `ADOPTERS.md` (repo 内)。
- CNCF 受理 blog が本番採用例として Accenture, CERN, Cisco, Ohio Supercomputing Center, Hitachi, Okta, Quest を列挙。出典: <https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/>。
- 採用シグナル (数値): GitHub stars 35,044 / forks 8,531 (GitHub API、2026-06-24)。contributors 1,800 超 (GitHub contributors API ページネーション、anon 含む、2026-06-24)。CNCF 受理時点で月間 15 万訪問超・15,000 stars 超 (CNCF blog)。

## 代替・エコシステム

- エコシステム: OIDC / OAuth 2.0 / SAML 2.0 を IdP として提供。LDAP / Active Directory / Kerberos との user federation、外部 IdP との identity brokering (social login 含む)、UMA 2.0 ベースの Authorization Services。Kubernetes Operator あり (`operator/`)。Admin / Account コンソールは React (`js/`)。
- 代替と本質的な差:
  - Authentik (Python/TS): Flow Engine による柔軟な認証フローと forward-auth proxy モードが差別化。OIDC を話さないアプリの前段に置ける。出典: <https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel>。
  - Zitadel (Go): event-sourced で全変更が監査可能、ネイティブ multi-tenancy と Kubernetes-first 設計。2025 に Apache-2.0 から AGPL-3.0 へ。出典: 同上 / <https://www.osohq.com/learn/best-keycloak-alternatives-2025>。
  - Ory Hydra (Go): フル IdP ではなく OAuth2/OIDC トークンサーバ専業。ユーザ管理は持たず Kratos 等と組む。大量クライアントの軽量トークン発行向け。出典: Oso。
  - Keycloak の立ち位置: enterprise federation / レガシー統合のデフォルト。機能網羅性と成熟度が強み、重さと設定の複雑さがトレードオフ。出典: Oso。

## インストール / 最小構成

最小起動 (dev モード、永続化なし・HTTP)。`KC_BOOTSTRAP_ADMIN_*` は repo の admin ドキュメントで確認 (`docs/documentation/server_admin/topics/assembly-creating-first-admin.adoc:22-27`):

```bash
docker run -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.6.3 start-dev
```

その後 `http://localhost:8080` で Admin Console。本番は `kc.sh build` (build-time オプション確定) から `kc.sh start` (DB / hostname / TLS 設定) の二段。出典: <https://www.keycloak.org/getting-started/getting-started-docker>、migration ドキュメント。

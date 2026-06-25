# 内部実装

> コミット `e733440` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `server-spi/src/main/java/org/keycloak/models/` | SPI ファサードとドメインモデル interface (`KeycloakSession`, `RealmModel`, `ClientModel`, `UserModel`, `UserSessionModel`) |
| `services/src/main/java/org/keycloak/protocol/oidc/` | OIDC エンドポイント、grant 種別、code/token ユーティリティ |
| `core/src/main/java/org/keycloak/representations/` | トークン表現 (`AccessToken`, `IDToken`) |
| `quarkus/runtime/src/main/java/org/keycloak/quarkus/runtime/` | Quarkus サーバのエントリポイントとランタイム |

## 中核データ構造

- `KeycloakSession` (`server-spi/src/main/java/org/keycloak/models/KeycloakSession.java:35`): リクエストスコープのファサード。全 SPI・Provider・コンテキストへのエントリである。`getProvider(Class<T>)` と `getProvider(Class<T>, String id)` が provider を解決し (`KeycloakSession.java:52,64`)、`realms()` / `sessions()` / `users()` は同じ解決のショートカットである (`KeycloakSession.java:148,192,224`)。
- `OAuth2Code` (`services/src/main/java/org/keycloak/protocol/oidc/utils/OAuth2Code.java:45-61`): 認可コードに紐づく不変データ。`id`・`expiration`・`nonce`・`scope`・`resource`・`redirectUriParam`・`codeChallenge` (+ method)・`dpopJkt`・`userSessionId`。single-use ストアへ Map にしてシリアライズされる。
- `AccessToken` (`core/src/main/java/org/keycloak/representations/AccessToken.java:40`、`extends IDToken`): JWT のクレーム集合。ロール用の `realm_access` と `resource_access` を含む (`AccessToken.java:137,140`)。
- `RealmModel` / `ClientModel` / `UserModel` / `UserSessionModel` (`server-spi/src/main/java/org/keycloak/models/`): ドメインの interface。realm がテナント境界、user session が SSO セッション、client が relying party である。

## 追う価値のあるパス

authorization_code のトークン交換を取り上げる。`TokenEndpoint` が grant provider を解決し (`TokenEndpoint.java:220`)、`grant.process(context)` を呼ぶと (`TokenEndpoint.java:171`)、`AuthorizationCodeGrantType.process()` が走る (`services/src/main/java/org/keycloak/protocol/oidc/grants/AuthorizationCodeGrantType.java:76`)。

最初の本処理はコードのパースである: `OAuth2CodeParser.parseCode()` (`AuthorizationCodeGrantType.java:87`)。コードはドット区切り 3 パートの不透明文字列 `codeUUID.userSessionId.clientUUID` である (`services/src/main/java/org/keycloak/protocol/oidc/utils/OAuth2CodeParser.java:71-79`)。パーサは single-use ストアから `remove` で実データを原子的に取り出す (`OAuth2CodeParser.java:98`)。

```text
TokenEndpoint.processGrantRequest()           TokenEndpoint.java:121
  -> getProvider(OAuth2GrantType, grantType)  TokenEndpoint.java:220
  -> grant.process(context)                   TokenEndpoint.java:171
     AuthorizationCodeGrantType.process()      AuthorizationCodeGrantType.java:76
       -> OAuth2CodeParser.parseCode()         AuthorizationCodeGrantType.java:87
            codeStore.remove(prefix+codeUUID)  OAuth2CodeParser.java:98
       -> createTokenResponseBuilder(...)      OAuth2GrantTypeBase.java:114
```

コードが存在しないか既に使用済みなら `codeData == null` となり、パーサは illegal-code 結果を返す (`OAuth2CodeParser.java:98-104`)。illegal code のとき grant は既存の client session を user session から切り離して無効化する (`AuthorizationCodeGrantType.java:88-94`)。正当なリクエストは `OAuth2GrantTypeBase.createTokenResponseBuilder()` へ進み、`tokenManager.responseBuilder(...).accessToken(token)` でアクセストークンを構築する (`services/src/main/java/org/keycloak/protocol/oidc/grants/OAuth2GrantTypeBase.java:114-120`)。

## 読んで驚いた点

認可コードはそれ自体に状態を持たない。ステートレスな参照キーである。`OAuth2CodeParser.parseCode` は single-use ストアに対し `remove` (取得と削除) を 1 操作で行うため (`OAuth2CodeParser.java:98`)、同じコードの 2 回目の交換は必ず `codeData == null` を見て illegal-code で弾かれる (`OAuth2CodeParser.java:98-104`)。さらに二重使用検知時には既存の client session を能動的に切り離して無効化する (`AuthorizationCodeGrantType.java:88-94`)。コード本体はクレームを持たず、実体の `OAuth2Code` データは `accessCodeLifespan` を TTL として外部ストア (Infinispan) に置かれる。この設計によりクラスタ間でのコード再生 (replay) を防ぎつつ水平スケールできる。

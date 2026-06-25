# Internals

> Read from the source at commit `e733440`. Every claim here should point at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `server-spi/src/main/java/org/keycloak/models/` | SPI facade and domain model interfaces (`KeycloakSession`, `RealmModel`, `ClientModel`, `UserModel`, `UserSessionModel`) |
| `services/src/main/java/org/keycloak/protocol/oidc/` | OIDC endpoints, grant types, and code/token utilities |
| `core/src/main/java/org/keycloak/representations/` | Token representations (`AccessToken`, `IDToken`) |
| `quarkus/runtime/src/main/java/org/keycloak/quarkus/runtime/` | Quarkus server entrypoint and runtime |

## Core data structures

- `KeycloakSession` (`server-spi/src/main/java/org/keycloak/models/KeycloakSession.java:35`): the request-scoped facade. It is the entry to every SPI, provider, and context. `getProvider(Class<T>)` and `getProvider(Class<T>, String id)` resolve providers (`KeycloakSession.java:52,64`), and `realms()` / `sessions()` / `users()` are shortcuts over the same resolution (`KeycloakSession.java:148,192,224`).
- `OAuth2Code` (`services/src/main/java/org/keycloak/protocol/oidc/utils/OAuth2Code.java:45-61`): the immutable data tied to an authorization code: `id`, `expiration`, `nonce`, `scope`, `resource`, `redirectUriParam`, `codeChallenge` (+ method), `dpopJkt`, and `userSessionId`. It serializes to a map for the single-use store.
- `AccessToken` (`core/src/main/java/org/keycloak/representations/AccessToken.java:40`, `extends IDToken`): the JWT claim set, including `realm_access` and `resource_access` for roles (`AccessToken.java:137,140`).
- `RealmModel` / `ClientModel` / `UserModel` / `UserSessionModel` (`server-spi/src/main/java/org/keycloak/models/`): the domain interfaces. The realm is the tenant boundary, the user session is the SSO session, and the client is the relying party.

## A path worth tracing

Take the authorization_code token exchange. After `TokenEndpoint` resolves the grant provider (`TokenEndpoint.java:220`) and calls `grant.process(context)` (`TokenEndpoint.java:171`), `AuthorizationCodeGrantType.process()` runs (`services/src/main/java/org/keycloak/protocol/oidc/grants/AuthorizationCodeGrantType.java:76`).

The first real work is parsing the code: `OAuth2CodeParser.parseCode()` (`AuthorizationCodeGrantType.java:87`). The code is an opaque string of three dot-separated parts, `codeUUID.userSessionId.clientUUID` (`services/src/main/java/org/keycloak/protocol/oidc/utils/OAuth2CodeParser.java:71-79`). The parser pulls the real data out of the single-use store with `remove`, atomically (`OAuth2CodeParser.java:98`).

```text
TokenEndpoint.processGrantRequest()           TokenEndpoint.java:121
  -> getProvider(OAuth2GrantType, grantType)  TokenEndpoint.java:220
  -> grant.process(context)                   TokenEndpoint.java:171
     AuthorizationCodeGrantType.process()      AuthorizationCodeGrantType.java:76
       -> OAuth2CodeParser.parseCode()         AuthorizationCodeGrantType.java:87
            codeStore.remove(prefix+codeUUID)  OAuth2CodeParser.java:98
       -> createTokenResponseBuilder(...)      OAuth2GrantTypeBase.java:114
```

If the code is missing or already used, `codeData == null` and the parser returns an illegal-code result (`OAuth2CodeParser.java:98-104`). On illegal code, the grant detaches any existing client session from the user session to invalidate it (`AuthorizationCodeGrantType.java:88-94`). Valid requests fall through to `OAuth2GrantTypeBase.createTokenResponseBuilder()`, which builds the access token via `tokenManager.responseBuilder(...).accessToken(token)` (`services/src/main/java/org/keycloak/protocol/oidc/grants/OAuth2GrantTypeBase.java:114-120`).

## Things that surprised me

The authorization code carries no state of its own; it is a stateless reference key. `OAuth2CodeParser.parseCode` performs a `remove` (read-and-delete) against the single-use store in one operation (`OAuth2CodeParser.java:98`), so the second exchange of the same code always sees `codeData == null` and is rejected with illegal-code (`OAuth2CodeParser.java:98-104`). On top of that, double-use detection actively detaches the existing client session to kill it (`AuthorizationCodeGrantType.java:88-94`). Because the code body holds no claims and the real `OAuth2Code` data sits in an external store (Infinispan) keyed by `accessCodeLifespan` as TTL, the design blocks code replay across a cluster while still scaling horizontally.

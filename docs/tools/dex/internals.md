# Internals

> Read from the source at commit `17a54e9` (v2.45.0 plus 248 commits). Every claim here points at a file and line.

## Code map

The directories that carry the login and token logic, skipping generated protobuf and ent code:

| Path | Responsibility |
| --- | --- |
| `server/handlers.go` | The HTTP handlers for the whole authorization code flow: authorization, connector login, callback, approval, and the token endpoint. |
| `server/oauth2.go` | Token construction and JWT signing: access tokens, ID Tokens, the `at_hash` and `c_hash` computations, and signature verification. |
| `server/refresh.go`, `server/refreshhandlers.go` | Refresh-token grant and rotation. |
| `server/deviceflowhandlers.go` | The OAuth2 Device Authorization Grant. |
| `connector/connector.go` | The connector interfaces and the normalised `Identity` type. |
| `connector/oidc/oidc.go` | The reference upstream-OIDC connector. |
| `storage/storage.go` | The `Storage` interface and the core persisted types. |
| `storage/ent/` | The ent-generated SQL backend and entity schemas. |

## Core data structures

The flow turns on a few types in `storage/storage.go`:

- **`AuthRequest`** (`storage/storage.go:239`) is the temporary state of a login in progress: the chosen `ConnectorID`, requested scopes, the resolved `Claims`, a `LoggedIn` flag, the redirect URI, PKCE parameters, and an expiry.
- **`AuthCode`** (`storage/storage.go:308`) is an issued authorization code. It carries the `Claims`, the connector's `ConnectorData`, the PKCE challenge, and the auth time. It is one-time: `exchangeAuthCode` deletes it on use.
- **`RefreshToken`** (`storage/storage.go:347`) is the durable grant, holding the token, claims, connector data, and last-used time.
- **`Client`** (`storage/storage.go:162`) is a registered OAuth2 client: secret, redirect URIs, and its allowed connectors.
- **`Connector`** (`storage/storage.go:527`) is a persisted connector config (ID, type, config blob, grant types), which lets connectors be managed dynamically through storage.

An invariant worth noting: the connector's `ConnectorData`, which can hold upstream access tokens, is defined on `connector.Identity` (`connector/connector.go:38`) with a comment that it must never be shared with the end user or the downstream client (`connector/connector.go:47-51`). It lives only in storage.

## A path worth tracing

The token endpoint, from the POST to the signed ID Token, is where the security-relevant checks concentrate.

`handleToken` (`server/handlers.go:1261`) dispatches on `grant_type`; for `authorization_code` it calls `handleAuthCode` (`server/handlers.go:1312`). That handler loads the `AuthCode` from storage, checks it matches the client, and then runs PKCE verification (RFC 7636). The verification is a four-way switch that treats PKCE as mandatory-if-started:

```text
switch {
case verifier != "" && challenge != "":   // recompute; mismatch => invalid_grant
case verifier != "":                       // no challenge stored => invalid_request
case challenge != "":                      // no verifier sent  => invalid_grant
                                           // (both empty) => pass
}
```

That logic is at `server/handlers.go:1337-1357`. The two middle branches are the interesting ones: if a code was created without a PKCE challenge but the client sends a verifier, or a challenge was stored but the client sends no verifier, Dex rejects the exchange. A client that started PKCE must finish it, which closes a downgrade path.

Once PKCE passes, `exchangeAuthCode` (`server/handlers.go:1372`) mints the tokens. Whether it also issues a refresh token is decided by a closure, `reqRefresh` (`server/handlers.go:1393`), that requires all three of: the connector implements `RefreshConnector`, its `grantTypes` config allows `refresh_token`, and the request carried the `offline_access` scope. If any is missing, the refresh token is silently omitted rather than erroring, which the code notes matches RFC 6749 section 1.5.

The ID Token itself is built in `newIDToken` (`server/oauth2.go:346`): it fills issuer, subject, nonce, expiry, issued-at, and a JTI, computes `at_hash` and `c_hash` from the access token and code, adds email and groups claims according to scope, and signs the JWT with the key chosen by `signer.Algorithm`.

## Things that surprised me

- **The `Connector` interface is empty.** `connector.Connector` carries no methods; capability is discovered by type assertion (`connector/connector.go:26`). A connector implements only the sub-interfaces for what it supports (`PasswordConnector`, `CallbackConnector`, `SAMLConnector`, `RefreshConnector`), and the server switches on them at runtime. This keeps each connector as small as its upstream demands.
- **Signature verification whitelists algorithms explicitly.** When Dex parses a signed JWT it passes an allow-list of algorithms to `jose.ParseSigned` (`server/oauth2.go:773`): `RS256/384/512` and `ES256/384/512`. Passing the set explicitly, rather than trusting the token's own `alg` header, is what defends against algorithm-confusion attacks.
- **The `/callback` handler strips `X-Remote-*` headers before running.** The route wrapper deletes any incoming header beginning with `x-remote-` (`server/server.go:542-551`) so that a misconfigured `authproxy` connector cannot be spoofed by a client that sets those headers itself.

## Sources

- Source read at commit `17a54e9`: paths above are relative to the repository root.
- [RFC 7636 (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636)
- [RFC 6749 section 1.5 (refresh tokens)](https://datatracker.ietf.org/doc/html/rfc6749#section-1.5)

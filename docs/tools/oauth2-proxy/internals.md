# Internals

> Read from the source at commit `10b6871`. Every claim here should point at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `main.go` | Process entry point: flag parsing, configuration load, validation, start (`main.go:16`). |
| `oauthproxy.go` | The `OAuthProxy` type and all HTTP handlers: routing, proxy, auth, OAuth flow. |
| `validator.go` | Email allow-list from `--email-domain` and `--authenticated-emails-file` (`validator.go:107`). |
| `providers/` | One implementation per identity provider behind the `Provider` interface (`providers/providers.go:22`). |
| `pkg/middleware/` | Request-scope and session-loading middleware (`pkg/middleware/stored_session.go`). |
| `pkg/sessions/` | Cookie store and Redis-backed persistent store, plus the ticket model. |
| `pkg/apis/` | Shared types: options, sessions, providers. |
| `pkg/validation/` | Startup validation, including cookie-secret length checks (`pkg/validation/cookie.go`). |

## Core data structures

`SessionState` (`pkg/apis/sessions/session_state.go:17`) is the session itself. It carries the tokens and identity claims and is serialised with short msgpack tags to keep stored sessions small:

```go
AccessToken  string `msgpack:"at,omitempty"`
IDToken      string `msgpack:"it,omitempty"`
RefreshToken string `msgpack:"rt,omitempty"`

Nonce []byte `msgpack:"n,omitempty"`

Email             string   `msgpack:"e,omitempty"`
User              string   `msgpack:"u,omitempty"`
Groups            []string `msgpack:"g,omitempty"`
```

Three fields are runtime-only and explicitly not serialised (`msgpack:"-"`): `Clock` (overridable time source for tests), `Lock`, and `Refreshed` (`pkg/apis/sessions/session_state.go:36-39`).

`Provider` (`providers/providers.go:22`) is the interface every IdP implementation satisfies: `GetLoginURL`, `Redeem`, `EnrichSession`, `Authorize`, `ValidateSession`, `RefreshSession`, `CreateSessionFromToken`, and `Data`. `NewProvider` (`providers/providers.go:35`) maps `providerConfig.Type` to a concrete implementation.

`ticket` (`pkg/sessions/persistence/ticket.go:40`) is the key for server-side session storage, holding an `id`, a per-session `secret`, and cookie options.

## A path worth tracing

The core operation is "decide whether a request is authenticated and forward it." It runs end to end across the middleware and the `Proxy` handler.

The session is loaded before the handler runs. `storedSessionLoader.loadSession` (`pkg/middleware/stored_session.go:107`) populates the request scope. `getValidatedSession` (`pkg/middleware/stored_session.go:137`) loads from the store and refreshes if needed:

```go
session, err := s.store.Load(req)
if err != nil || session == nil {
    return nil, err
}

err = s.refreshSessionIfNeeded(rw, req, session)
```

`refreshSessionIfNeeded` (`pkg/middleware/stored_session.go:155`) only acts when the session is older than the refresh period, and it obtains a lock first to avoid concurrent refreshes (`pkg/middleware/stored_session.go:159-176`).

The catch-all `Proxy` handler (`oauthproxy.go:1041`) then asks `getAuthenticatedSession` for a verdict and branches on the error:

```go
session, err := p.getAuthenticatedSession(rw, req)
switch err {
case nil:
    if !authOnlyAuthorize(req, session) { /* 403 */ }
    p.addHeadersForProxying(rw, session)
    p.headersChain.Then(p.upstreamProxy).ServeHTTP(rw, req)
case ErrNeedsLogin: /* SignInPage or doOAuthStart */
```

`getAuthenticatedSession` (`oauthproxy.go:1142`) is where authorization actually happens. Allowed routes and trusted IPs pass without a session; otherwise a session is required, and both the email validator and the provider's `Authorize` must pass:

```go
invalidEmail := session.Email != "" && !p.Validator(session.Email)
authorized, err := p.provider.Authorize(req.Context(), session)
if err != nil {
    logger.Errorf("Error with authorization: %v", err)
}
if invalidEmail || !authorized {
    /* ClearSessionCookie; return ErrAccessDenied */
}
```

This two-stage check (email allow-list at `oauthproxy.go:1153`, provider authorization at `oauthproxy.go:1154`) is the same pair applied at the end of `OAuthCallback` before the session is first saved (`oauthproxy.go:960-964`).

## Things that surprised me

- **Server-side sessions get a per-session encryption secret, not just the shared cookie secret.** `newTicket` generates a random 16-byte id and a random AES-block-sized secret per session (`pkg/sessions/persistence/ticket.go:48-64`). The comment is explicit: the ticket "provides a unique per session decryption secret giving more security than the shared CookieSecret" (`pkg/sessions/persistence/ticket.go:38-39`). The cookie holds `v2.{id}.{secret}` (`encodeTicket`, `pkg/sessions/persistence/ticket.go:69-72`), the encrypted session lives in Redis under the id, and load rebuilds the AES-GCM cipher from the ticket secret (`makeCipher`, `pkg/sessions/persistence/ticket.go:266`; `loadSession`, `pkg/sessions/persistence/ticket.go:180`). Decoding also accepts an older two-part format for backward compatibility (`decodeTicketID`/`decodeTicketSecret`, `pkg/sessions/persistence/ticket.go:77-116`).
- **Cookie sessions are split when they exceed 4 KB.** `maxCookieLength` is 4000 bytes (`pkg/sessions/cookie/session_store.go:22`). When the serialised cookie is larger, `splitCookie` chops the value across numbered cookies and logs a warning recommending Redis instead (`pkg/sessions/cookie/session_store.go:184-215`).
- **`AuthOnly` deliberately answers 403, not 401, when unauthorized, and 202 on success.** The unauthorized 403 avoids infinite redirects in subrequest architectures (`oauthproxy.go:1025-1031`), and success returns `http.StatusAccepted` (`oauthproxy.go:1034-1036`).
- **The router keeps encoded paths intact.** `mux.NewRouter().UseEncodedPath()` is chosen so something like `/%2F/` is not normalised before it reaches the upstream (`oauthproxy.go:319-321`).
- **Cookie secret length is enforced at startup.** The secret must be 16, 24, or 32 bytes to build an AES cipher, checked in `pkg/validation/cookie.go:64-67` (and again for a secret file at `pkg/validation/cookie.go:79-85`); anything else fails validation before the proxy starts.

# Internals

> Read from the source at commit `06af72a` (v4.39.20). Paths are relative to the repository root.

## Code map

| Path | What lives there |
| --- | --- |
| `internal/authorization/` | The `Authorizer`, access-control rules, and the level constants. |
| `internal/handlers/handler_authz*.go` | The forward-auth framework: builder, handler, and per-proxy implementations. |
| `internal/session/` | The per-domain session `Provider` and the `UserSession` type. |
| `internal/middlewares/authelia_context.go` | The request context that the authz framework runs against. |

## Core data structures

The system turns on a few types:

- `authorization.Authorizer` (`internal/authorization/authorizer.go:11`) holds the compiled rules and the default policy. It is built once at startup and is read-only per request.
- `authorization.AccessControlRule` (`internal/authorization/access_control_rule.go:40`) holds one rule's domains, resources, methods, networks, subjects, and the policy it grants. A precomputed `HasSubjects` flag is load-bearing, as shown below.
- `authorization.Subject` and `Object` (`internal/authorization/types.go:49` and `:67`) carry the request identity (username, groups, client ID, IP) and the request target (URL, domain, cleaned path, method).
- `session.UserSession` (`internal/session/types.go:20`) carries the cookie domain, the identity, and the authentication method references that determine whether the session counts as one-factor or two-factor.

## The levels

Access-control levels are ordered constants (`internal/authorization/const.go:6`): `Bypass`, `OneFactor`, `TwoFactor`, and `Denied`. A rule grants one of these to the requests it matches. The default policy applies when no rule matches.

## A path worth tracing: the access decision

The `Authorizer` is built once. `NewAuthorizer` compiles the configured ACL into `[]*AccessControlRule` at construction (`internal/authorization/authorizer.go:19`), pre-compiling the regular expressions for domains and resources so that per-request matching is just a lookup, not a parse.

At request time the handler calls `GetRequiredLevel` (`internal/authorization/authorizer.go:51`). It is first-match-wins, in rule order:

```go
for _, rule := range p.rules {
    if rule.IsMatch(subject, object) {
        return rule.HasSubjects, rule.Policy
    }
}
return false, p.defaultPolicy
```

`AccessControlRule.IsMatch` (`internal/authorization/access_control_rule.go:54`) ANDs every criterion: domains, resources, query, methods, networks, and subjects. An empty criterion matches anything, so a rule with no `methods` listed applies to all methods.

The result is then mapped to an outcome in `isAuthzResult` (`internal/handlers/handler_authz_util.go:28`):

```go
case required == authorization.Denied && (level != authentication.NotAuthenticated || !ruleHasSubject):
    return AuthzResultForbidden
```

This line is the non-obvious part. A `deny` rule that matched only because the request was anonymous does not immediately return 403. If the rule has a subject and the user is anonymous, the handler returns unauthorized instead, so the user gets a chance to log in and possibly match a different, more specific rule on the next request. Only an authenticated user, or a deny rule with no subject, produces a hard 403. This is why `GetRequiredLevel` returns `rule.HasSubjects` alongside the level: the decision needs to know whether the matched rule was subject-specific.

## Things that surprised me

- **Sessions defend against relocation.** Each session embeds the cookie domain it was issued for. The cookie strategy compares that against the domain resolved from the request and destroys the session on a mismatch (`internal/handlers/handler_authz_authn.go:108`), so a cookie copied from one protected domain to another is rejected rather than honoured.
- **Bearer tokens reuse the ACL engine.** An OIDC access token is introspected (`internal/handlers/handler_authz_authn.go:618`), required to hold a specific bearer-authz scope, and checked so that its granted audience covers the target URL. A client-credentials token sets a client ID with no user and matches `oauth2:client:` subjects in the rules, so machine access and human access run through the same authorization code.
- **Rules and regexes compile once.** The hot path avoids allocation: `Subject` and `Object` are passed by value through the matchers, and regex rules pre-resolve their named groups to integer indices so matching is a slice lookup rather than a map lookup.

## Sources

- Source read at commit `06af72a` (v4.39.20).
- [Authelia repository](https://github.com/authelia/authelia)

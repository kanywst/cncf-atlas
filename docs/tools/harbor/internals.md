# Internals

> Read from the source at commit `6872989`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `src/core/main.go` | API server entry point, Beego app, auth backend registration. |
| `src/server/registry/` | OCI v2 routes, reverse proxy, manifest and blob handlers. |
| `src/server/middleware/` | The value-add gates: immutable, quota, cosign, contenttrust, vulnerable, repoproxy. |
| `src/controller/` | Business logic: artifact, replication, scan, gc, retention. |
| `src/pkg/` | Domain managers and `dao/` database access. |
| `portal/` | Angular web UI. |

## Core data structures

`artifact.Artifact` (`src/pkg/artifact/model.go:32-48`) is the business object Harbor turns on. It is the unified abstraction over images, charts, and other OCI artifacts, carrying `Type`, `MediaType`, `ManifestMediaType`, `ArtifactType`, `Digest`, `Size`, and `References` (child references for an index). `IsImageIndex()` decides index versus single manifest (`src/pkg/artifact/model.go:64-68`).

`dao.Artifact` (`src/pkg/artifact/dao/model.go:31-47`) is the database row, with Beego ORM tags and table name `artifact` (`src/pkg/artifact/dao/model.go:49-52`). `ExtraAttrs` is a JSON string column and `Annotations` is `jsonb` (`src/pkg/artifact/dao/model.go:45-46`). The business object converts from it through `From()` (`src/pkg/artifact/model.go:71`).

`model.RepoRecord` (`src/pkg/repository/model/model.go:33-42`) is the repository row, holding `Name`, `ProjectID`, and pull statistics like `PullCount` and `StarCount`. `v2auth.reqChecker` (`src/server/middleware/v2auth/auth.go:42-44`) is the internal type that decomposes a request into an access list and runs RBAC over it. `lib.ResponseBuffer` (used at `src/server/registry/manifest.go:76`) buffers the backend proxy response and flushes only on success, which is the core of both the pull and push paths.

## A path worth tracing

An image pull is GET `/v2/<repo>/manifests/<ref>`. The route stacks middleware then calls `getManifest` (`src/server/registry/route.go:52-59`).

Authorization runs first via the shared `/v2` middleware (`src/server/registry/route.go:37`). `reqChecker.check` (`src/server/middleware/v2auth/auth.go:46-81`) pulls the security context, decomposes the request into an access list, derives the project ID from the repository name (`src/server/middleware/v2auth/auth.go:68-73`), and asks the RBAC layer whether the action is allowed:

```go
resource := rbac_project.NewNamespace(pid).Resource(rbac.ResourceRepository)
if !securityCtx.Can(req.Context(), a.action, resource) {
    return getChallenge(req, al), fmt.Errorf("unauthorized to access repository: %s, action: %s", a.name, a.action)
}
```

An unauthenticated CLI gets a Bearer challenge pointing at the token service (`src/server/middleware/v2auth/auth.go:92-116`); failure returns 401 with a `Www-Authenticate` header (`src/server/middleware/v2auth/auth.go:178-183`).

The handler `getManifest` (`src/server/registry/manifest.go:52-140`) then:

1. Resolves the artifact from the database with `artifact.Ctl.GetByReference` before touching the backend (`src/server/registry/manifest.go:55`).
2. If the reference is a tag, rewrites the URL path to the stored digest so the backend is always queried by digest (`src/server/registry/manifest.go:62-66`).
3. Returns 304 without proxying if `If-None-Match` matches the stored digest (`src/server/registry/manifest.go:71-74`).
4. With cache enabled, serves the manifest body from `pkg.ManifestMgr.Get` on a hit; on a miss it proxies and marks the response for write-back (`src/server/registry/manifest.go:82-105`).
5. On a cache miss or disabled cache, delegates to the backend with `proxy.ServeHTTP(buffer, req)` (`src/server/registry/manifest.go:107-109`), buffering the response.
6. On success, unless it is a HEAD or a replication-service request, fires `PullArtifactEventMetadata` to update pull time and trigger webhooks (`src/server/registry/manifest.go:127-139`).

`GetByReference` itself (`src/controller/artifact/controller.go:306-313`) parses the reference as a digest. If parsing fails it is a tag, handled by `getByTag` (`src/controller/artifact/controller.go:323-342`), which loads the repo, lists tags to find the artifact ID, and fetches it. A valid digest goes to `getByDigest` and `artMgr.GetByDigest` (`src/controller/artifact/controller.go:315-321`).

## Things that surprised me

Tags never reach backend storage. On push, when the reference is a tag, Harbor computes the digest from the body and swaps the proxy URL from tag to digest before forwarding (`src/server/registry/manifest.go:192-206`). The backend only ever sees digests; the tag-to-digest mapping is Harbor's database alone (`src/server/registry/manifest.go:189-191`). That single choice is what makes immutable tags, retention, and tag-scoped RBAC possible without backend support.

The whole proxy is one `httputil.NewSingleHostReverseProxy` instance (`src/server/registry/proxy.go:29-42`), with backend basic auth injected by wrapping the proxy's Director (`src/server/registry/proxy.go:44-52`). The manifest cache also quietly changes the read path: a cache hit serves the body straight from `ManifestMgr` and the backend is never contacted (`src/server/registry/manifest.go:82-105`).

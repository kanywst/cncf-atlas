# Internals

> Read from the source at commit `dab1a6c5` (tag `v0.43.0`). Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `backend/cmd/` | The server: `headlamp.go` (route registration), `server.go` (startup and cache middleware), `multiplexer.go` (WebSocket multiplexing), `stateless.go` (header-supplied kubeconfig) |
| `backend/pkg/kubeconfig/` | Context management and the per-context reverse proxy (`kubeconfig.go`) |
| `backend/pkg/auth/` | OIDC and token-cookie handling |
| `backend/pkg/k8cache/` | Server-side cache of Kubernetes responses, with authorization checks |
| `backend/pkg/plugins/` | Plugin path discovery, delivery, and directory watching |
| `frontend/src/lib/k8s/` | Resource models (`KubeObject.ts` base) and the API layers (`api/v1` legacy, `api/v2` React Query) |
| `frontend/src/plugin/` | Plugin load, registration, and i18n |
| `plugins/headlamp-plugin` | The `@kinvolk/headlamp-plugin` SDK and `pluginctl` CLI |

## Core data structures

`kubeconfig.Context` (`backend/pkg/kubeconfig/kubeconfig.go:64`) is one cluster's worth of state: one context equals one cluster. It carries `Cluster` and `AuthInfo` (client-go `api` types), `OidcConf`, a lazily created `proxy *httputil.ReverseProxy` (`kubeconfig.go:71`), a `Source int` bitfield (`kubeconfig.go:69`) whose flags are `KubeConfig`, `DynamicCluster`, `InCluster`, and `ClusterInventory` (`kubeconfig.go:56-61`), and a `ClusterID`. The `proxy` field is excluded from JSON and built on demand, which is what keeps proxy construction off the hot path after the first request.

`Multiplexer` (`backend/cmd/multiplexer.go:124`) collapses many Kubernetes watches into a single client WebSocket. It holds `connections map[string]*Connection` keyed by cluster and path (`multiplexer.go:126`) and a `gorilla/websocket` `upgrader` (`multiplexer.go:130`). Each `Connection` writes through a `WSConnLock` (`multiplexer.go:87`, `multiplexer.go:150`) that serializes writes behind a mutex, since a WebSocket connection is not safe for concurrent writers. A `Message` frame (`multiplexer.go:106`) is the JSON envelope `{clusterId, path, query, userId, data, type}`, and clients reach the multiplexer at `/wsMultiplexer` (`headlamp.go:853`).

## A path worth tracing

Take the plugin load path end to end, from the backend listing plugins to a plugin injecting UI.

```text
GET /plugins                    backend/cmd/headlamp.go:449   list plugin paths as JSON
  frontend initializePlugins    frontend/src/plugin/index.ts:119
    fetch ${appUrl}plugins      index.ts:450   read the list
    fetch ${path}/main.js       index.ts:459   fetch each plugin
    plugin.initialize(Registry) index.ts:126   run and register
      registerSidebarEntry      frontend/src/plugin/registry.tsx:301
      registerRoute             registry.tsx:445
      registerDetailsViewSection registry.tsx:606
```

The backend serves plugin files statically under `/plugins/` (`headlamp.go:351`, `headlamp.go:358`) and answers a `GET /plugins` with the list of available plugin paths as JSON (`headlamp.go:449`, registered by `addPluginListRoute` at `headlamp.go:446`; the paths come from `plugins.GeneratePluginPaths`, `backend/pkg/plugins/plugins.go:236`).

On the frontend, `initializePlugins` (`frontend/src/plugin/index.ts:119`) fetches that list from `${getAppUrl()}plugins` (`index.ts:450`), maps it to plugin paths (`index.ts:455`), and fetches each plugin's `main.js` from `${getAppUrl()}${path}/main.js` (`index.ts:459`). Executing that JavaScript registers the plugin onto the global `window.plugins` (`index.ts:114`). `initializePlugins` then iterates `window.plugins` and calls each `plugin.initialize(new Registry())` (`index.ts:122-126`).

The `Registry` (`frontend/src/plugin/registry.tsx`) is the injection surface. A plugin calls `registerSidebarEntry` (`registry.tsx:301`), `registerRoute` (`registry.tsx:445`), `registerDetailsViewSection` (`registry.tsx:606`), `registerKubeObjectGlance` (`registry.tsx:363`), and `registerAppBarAction` (`registry.tsx:572`) to add its own UI. Translations are merged by `initializePluginsI18n` (`index.ts:701`).

## Things that surprised me

The frontend API layer's history is written into the code. The copyright header states the module "was originally taken from the K8dash project before modifications," with 2020 copyrights for Eric Herbrandson and Kinvolk GmbH (`frontend/src/lib/k8s/apiProxy/index.ts:17-24`). The project's origin story survives as a source comment.

Plugins execute arbitrary fetched JavaScript. The frontend downloads each plugin's `main.js` and runs it (`index.ts:459`, `index.ts:126`), so the trust boundary is wherever the plugin file came from (a static, user, or dev directory). The backend adds guards around that: it watches plugin directories for changes (`plugins.Watch`, `backend/pkg/plugins/plugins.go:69`) and refuses deletes that escape the plugin root with an `isSubdirectory` check (`plugins.go:638`, called at `plugins.go:584`).

The server-side cache respects authorization before it serves. When caching is on, `k8cache` does not blindly return a cached response: `handleCacheAuthorization` (`backend/cmd/server.go:334`) calls `k8cache.IsAllowed(contextKey, kContext, r)` (`server.go:350`) to confirm the requesting user is permitted for that context before handing back a cached GET. The cache is a performance layer that keeps the cluster's access decision in the loop.

There is a stateless mode where the server stores no kubeconfig at all. `backend/cmd/stateless.go` accepts the kubeconfig in a `KUBECONFIG` request header, which the frontend sets when it holds one (`frontend/src/lib/k8s/api/v1/clusterRequests.ts:151`). This inverts the usual model for multi-tenant hosting: the server keeps no cluster credentials, and each request carries its own.

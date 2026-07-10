# 内部実装

> コミット `dab1a6c5` (タグ `v0.43.0`) のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `backend/cmd/` | サーバ: `headlamp.go` (ルート登録)、`server.go` (起動とキャッシュミドルウェア)、`multiplexer.go` (WebSocket 多重化)、`stateless.go` (ヘッダ供給の kubeconfig) |
| `backend/pkg/kubeconfig/` | コンテキスト管理とコンテキスト単位のリバースプロキシ (`kubeconfig.go`) |
| `backend/pkg/auth/` | OIDC とトークン Cookie の処理 |
| `backend/pkg/k8cache/` | Kubernetes 応答のサーバ側キャッシュ。認可チェック付き |
| `backend/pkg/plugins/` | プラグインパスの検出・配信・ディレクトリ監視 |
| `frontend/src/lib/k8s/` | リソースモデル (`KubeObject.ts` 基底) と API 層 (`api/v1` レガシー、`api/v2` React Query) |
| `frontend/src/plugin/` | プラグインのロード・登録・i18n |
| `plugins/headlamp-plugin` | `@kinvolk/headlamp-plugin` SDK と `pluginctl` CLI |

## 中核データ構造

`kubeconfig.Context` (`backend/pkg/kubeconfig/kubeconfig.go:64`) は 1 クラスタ分の状態である。1 コンテキスト = 1 クラスタ。`Cluster` と `AuthInfo` (client-go の `api` 型)、`OidcConf`、遅延生成の `proxy *httputil.ReverseProxy` (`kubeconfig.go:71`)、`Source int` ビットフラグ (`kubeconfig.go:69`。フラグは `KubeConfig`・`DynamicCluster`・`InCluster`・`ClusterInventory`、`kubeconfig.go:56-61`)、`ClusterID` を持つ。`proxy` フィールドは JSON から除外され、必要時に生成される。これが初回リクエスト後のホットパスからプロキシ構築を外す仕組みだ。

`Multiplexer` (`backend/cmd/multiplexer.go:124`) は多数の Kubernetes watch を 1 本のクライアント WebSocket に集約する。cluster と path をキーとする `connections map[string]*Connection` (`multiplexer.go:126`) と、`gorilla/websocket` の `upgrader` (`multiplexer.go:130`) を持つ。各 `Connection` は `WSConnLock` (`multiplexer.go:87`, `multiplexer.go:150`) 経由で書き込み、mutex の背後で書き込みを直列化する。WebSocket 接続は複数の書き手による同時書き込みに対して安全ではないためだ。`Message` フレーム (`multiplexer.go:106`) は `{clusterId, path, query, userId, data, type}` の JSON エンベロープで、クライアントは `/wsMultiplexer` (`headlamp.go:853`) でマルチプレクサに到達する。

## 追う価値のあるパス

プラグインのロードパスを端から端まで追う。バックエンドがプラグインを一覧するところから、プラグインが UI を注入するまで。

```text
GET /plugins                    backend/cmd/headlamp.go:449   プラグインパスを JSON で列挙
  フロント initializePlugins      frontend/src/plugin/index.ts:119
    fetch ${appUrl}plugins       index.ts:450   一覧を読む
    fetch ${path}/main.js        index.ts:459   各プラグインを取得
    plugin.initialize(Registry)  index.ts:126   実行して登録
      registerSidebarEntry       frontend/src/plugin/registry.tsx:301
      registerRoute              registry.tsx:445
      registerDetailsViewSection registry.tsx:606
```

バックエンドはプラグインファイルを `/plugins/` 配下で静的配信し (`headlamp.go:351`, `headlamp.go:358`)、`GET /plugins` に対して利用可能なプラグインパスの一覧を JSON で返す (`headlamp.go:449`。`addPluginListRoute` が `headlamp.go:446` で登録。パスは `plugins.GeneratePluginPaths`、`backend/pkg/plugins/plugins.go:236` に由来)。

フロントエンドでは `initializePlugins` (`frontend/src/plugin/index.ts:119`) がその一覧を `${getAppUrl()}plugins` から取得し (`index.ts:450`)、プラグインパスにマップし (`index.ts:455`)、各プラグインの `main.js` を `${getAppUrl()}${path}/main.js` から取得する (`index.ts:459`)。その JavaScript を実行すると、プラグインがグローバルの `window.plugins` に自身を登録する (`index.ts:114`)。`initializePlugins` は続いて `window.plugins` を走査し、各 `plugin.initialize(new Registry())` を呼ぶ (`index.ts:122-126`)。

`Registry` (`frontend/src/plugin/registry.tsx`) が注入面である。プラグインは `registerSidebarEntry` (`registry.tsx:301`)、`registerRoute` (`registry.tsx:445`)、`registerDetailsViewSection` (`registry.tsx:606`)、`registerKubeObjectGlance` (`registry.tsx:363`)、`registerAppBarAction` (`registry.tsx:572`) を呼んで自前の UI を足す。翻訳は `initializePluginsI18n` (`index.ts:701`) が統合する。

## 読んで驚いた点

フロント API 層の歴史がコードに書き込まれている。著作権表示は、このモジュールが「originally taken from the K8dash project before modifications」であり、Eric Herbrandson と Kinvolk GmbH の 2020 年著作権を持つと述べる (`frontend/src/lib/k8s/apiProxy/index.ts:17-24`)。プロジェクトの起源譚がソースコメントとして残っている。

プラグインは取得した任意の JavaScript を実行する。フロントは各プラグインの `main.js` をダウンロードして実行するので (`index.ts:459`, `index.ts:126`)、信頼境界はそのプラグインファイルの出所 (static/user/dev ディレクトリのいずれか) に依存する。バックエンドはそこにガードを足す。プラグインディレクトリの変更を監視し (`plugins.Watch`, `backend/pkg/plugins/plugins.go:69`)、プラグインルートの外へ逃げる削除を `isSubdirectory` チェックで拒む (`plugins.go:638`。`plugins.go:584` から呼ばれる)。

サーバ側キャッシュは配信前に認可を尊重する。キャッシュ有効時、`k8cache` は盲目的にキャッシュ応答を返さない。`handleCacheAuthorization` (`backend/cmd/server.go:334`) が `k8cache.IsAllowed(contextKey, kContext, r)` (`server.go:350`) を呼び、そのコンテキストについて要求ユーザに権限があることを確認してからキャッシュ済みの GET を返す。キャッシュはクラスタのアクセス判定をループに残したままの性能層である。

サーバが kubeconfig を一切保存しないステートレスモードがある。`backend/cmd/stateless.go` は kubeconfig を `KUBECONFIG` リクエストヘッダで受け取り、フロントは kubeconfig を持つときこれを設定する (`frontend/src/lib/k8s/api/v1/clusterRequests.ts:151`)。これはマルチテナント配信のために通常のモデルを反転させる。サーバはクラスタ資格情報を持たず、各リクエストが自分の分を運ぶ。

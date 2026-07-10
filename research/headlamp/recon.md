# recon: headlamp

調査メモ。自分用の密度でよい。出典は必ず URL / `file:line` を添える。AI 臭い水増しはしない。src は `research/headlamp/src`、commit は pin 済み。

## 基本情報

- repo: `kubernetes-sigs/headlamp` (git remote で確認。旧 `headlamp-k8s/headlamp` から Kubernetes SIG UI 配下に移動済み。README 冒頭の NOTICE 参照)
- pinned commit: `dab1a6c5c0039c73ba4e3ab6df8775824a46e3b9` (2026-07-06, PR #6343 のマージコミット) / 近いタグ: `v0.43.0` (HEAD はその 1 コミット後)
- 言語 / ビルド: Go バックエンド (`backend/`, go 1.26, 約 17k 行 非テスト) + TypeScript/React フロントエンド (`frontend/`, React 18 + MUI + react-router v5, 約 115k 行 非テスト)。プラグイン SDK は `plugins/headlamp-plugin`
- ライセンス: Apache-2.0 (`LICENSE`)
- CNCF 成熟度: Sandbox (受理 2023-05-17。CNCF プロジェクトページで確認。ただし 2025 年に Kubernetes SIG UI のサブプロジェクト化しリポも `kubernetes-sigs` org へ移動。CNCF ランドスケープ上は依然 Sandbox 表記)
- カテゴリ (tools.ts の CATEGORY_ORDER から): `Developer Tools` (拡張可能な Kubernetes 管理 UI。メトリクス/ログ/トレースの Observability というより、クラスタ運用のためのダッシュボード。Kubernetes Dashboard / Lens / k9s と同じ棚)

## 歴史の素材

タイムライン (各出典は sources.md 参照):

- 2020 年、ベルリンの Kinvolk GmbH (Flatcar Container Linux / Inspektor Gadget で知られる) が Headlamp を OSS として公開。リポ内にも痕跡: `frontend/src/lib/k8s/apiProxy/index.ts:17-23` に「originally taken from the K8dash project」「Copyright © 2020 Kinvolk GmbH」。フロントの API 層は K8dash (Eric Herbrandson, Apache-2.0) を出発点に改変したもの。最初の公開コミットは 2020-06-30 頃、`v0.1.0` タグは 2020-10-16 (GitHub API)
- 動機: 「オープンソースでモダン、かつ柔軟・高度にカスタマイズ可能な Kubernetes 用 UI が必要だった」(Headlamp 公式ブログ 2023-10-12)。既存 UI (Kubernetes Dashboard 等) の「一覧・閲覧」機能に、書き込み/操作・RBAC 反映・プラグイン拡張を足す狙い
- 2021-04-29、Microsoft が Kinvolk を買収 (Azure 公式ブログ、Brendan Burns 名義)。Headlamp は Apache-2.0 のまま OSS 継続。以後 Microsoft が主要スポンサー (AKS の `aks-desktop` は Headlamp ベース、ADOPTERS.md 参照)
- 2023-05-17、CNCF Sandbox 受理 (CNCF プロジェクトページ、cncf/sandbox issue #25)。Microsoft が CNCF に寄贈。公式アナウンスブログは 2023-10-12
- 2025 年 (KubeCon+CloudNativeCon Europe 2025 London の Microsoft キーノートで発表)、Headlamp が Kubernetes 本体プロジェクトの一部 = SIG UI サブプロジェクト化。リポが `headlamp-k8s/headlamp` から `kubernetes-sigs/headlamp` へ移動 (README の NOTICE、cloudnativenow 記事)。コンテナイメージは当面 `ghcr.io/headlamp-k8s` に残置

## アーキテクチャの素材

トップレベルのコンポーネント:

- **Go バックエンドサーバ (`backend/cmd/`)**: gorilla/mux ベースの HTTP サーバ。役割は (1) フロントの静的配信 (SPA)、(2) 各クラスタ Kubernetes API へのリバースプロキシ、(3) 認証 (OIDC / トークン Cookie)、(4) プラグイン配信、(5) Helm・port-forward・drain 等の補助 API、(6) WebSocket マルチプレクサ。エントリは `backend/cmd/server.go:45` `main` → `StartHeadlampServer` (`headlamp.go:1374`)
- **React フロントエンド (`frontend/src/`)**: TypeScript + MUI。K8s リソースの一覧/詳細/編集。API アクセスは `frontend/src/lib/k8s/` (v1 = `api/v1/clusterRequests.ts`、v2 = `api/v2/fetch.ts` + React Query hooks)。バックエンドを常に経由し、直接 kube-apiserver を叩かない
- **プラグインシステム (`frontend/src/plugin/` + `plugins/headlamp-plugin`)**: フロントを実行時に拡張。バックエンドが `/plugins/list` でプラグイン一覧を配信し、フロントが各 `main.js` を fetch → 実行 → `Registry` 経由で UI に注入
- **デスクトップアプリ (`app/`)**: 同じバックエンド+フロントを Electron で梱包 (Linux/macOS/Windows)

### 代表オペレーションの end-to-end トレース: UI からのリソース取得がバックエンドを経て kube-apiserver に届くまで

1. フロント: `request(path)` (`frontend/src/lib/k8s/api/v1/clusterRequests.ts:95`) → `clusterRequest()` (同 `:123`)。現在のクラスタ名を付けて `fullPath = /clusters/{cluster}/{path}` を組み立て (`:155`、`CLUSTERS_PREFIX`)。`fetch(url, { credentials: 'include', ... })` で `getAppUrl()+fullPath` に送信 (`:161-173`)。`credentials: 'include'` によりトークン Cookie が同送される
2. バックエンド: ルータが `PathPrefix("/clusters/{clusterName}/{api:.*}")` にマッチ (`backend/cmd/headlamp.go:1884`、`handleClusterAPI`)。`CacheEnabled` なら `CacheMiddleWare` を挟む
3. `clusterRequestHandler` (`headlamp.go:1772`): `getContextKeyForRequest(r)` で kubeconfig コンテキストキーを解決 → `KubeConfigStore.GetContext(contextKey)` で `*kubeconfig.Context` を取得 (`:1788-1798`)
4. 宛先 URL を組み立て: `url.Parse(kContext.Cluster.Server)` (`:1805`)、`r.URL.Host/Path/Scheme` をクラスタのものに書き換え、`r.URL.Path = mux.Vars(r)["api"]` で `/clusters/{name}/` プレフィックスを剥がす (`:1828-1830`)
5. 認証注入: `auth.GetTokenFromCookie(r, clusterName)` でトークンを取り出し `Authorization: Bearer <token>` を設定 (`:1845-1850`)。プロキシ認証ヘッダの掃除も実施 (`:1853`)
6. `kContext.ProxyRequest(w, r)` (`:1857`) → `backend/pkg/kubeconfig/kubeconfig.go:387`。初回は `SetupProxy()` (`:431`) が `httputil.NewSingleHostReverseProxy(clusterURL)` を生成し (`:437`)、RESTConfig 由来の TLS/認証を積んだ round tripper を `userAgentRoundTripper` (Headlamp の User-Agent 付与、`:40-51`) で包んで `proxy.Transport` に設定。以後 `proxy.ServeHTTP` で kube-apiserver に転送 (`:395`)
7. 応答はプロキシ経由でそのままフロントへ。`CacheEnabled` 時は `k8cache` が GET 応答をキャッシュし、非 GET で無効化 (`server.go:cacheMiddlewareHandler`)

設計判断:

- **すべてバックエンド経由**: フロントは kube-apiserver を直接叩かない。トークンはサーバ側 Cookie に保持し、プロキシがヘッダに載せ替える。これで CORS とトークン露出を回避しつつマルチクラスタを一元化
- **リバースプロキシはコンテキスト単位でキャッシュ**: `Context.proxy` フィールド (`kubeconfig.go:71`) に遅延生成した `*httputil.ReverseProxy` を保持
- **RBAC はサーバではなくクラスタが強制**: Headlamp は素通しプロキシ。権限判定は kube-apiserver 側。フロントは `SelfSubjectAccessReview` 相当で UI を出し分けるが、実際の拒否は API サーバが行う

## 内部実装の素材

主要ディレクトリ:

- `backend/cmd/`: サーバ本体。`headlamp.go` (3045 行、ルート登録の巨大ファイル)、`server.go` (起動・キャッシュミドルウェア)、`multiplexer.go` (WebSocket 多重化)、`stateless.go` (kubeconfig をヘッダで受ける stateless モード)
- `backend/pkg/`: `kubeconfig` (コンテキスト管理・プロキシ)、`auth` (OIDC・トークン Cookie)、`k8cache` (K8s 応答キャッシュ)、`plugins` (プラグイン配信・監視)、`portforward`、`helm`、`serviceproxy`、`telemetry` (OpenTelemetry)、`clusterinventory` (ClusterProfile からの動的クラスタ検出)
- `frontend/src/lib/k8s/`: リソース型ごとのモデル (`KubeObject.ts` 基底) と API 層 (`api/v1` レガシー、`api/v2` = React Query)
- `frontend/src/plugin/`: プラグインのロード・登録・i18n
- `plugins/headlamp-plugin`: プラグイン開発 SDK (`@kinvolk/headlamp-plugin`)、`pluginctl` CLI

中核データ構造:

- `kubeconfig.Context` (`backend/pkg/kubeconfig/kubeconfig.go:63-80`): 1 クラスタ = 1 コンテキスト。`Cluster` / `AuthInfo` (client-go の api 型)、`OidcConf`、遅延生成の `proxy *httputil.ReverseProxy`、`Source` (KubeConfig / DynamicCluster / InCluster / ClusterInventory のビットフラグ、`:56-61`)、`ClusterID`。`ContextStore` (`contextStore.go`) が名前→Context のインメモリストア + 変更リスナー
- `Multiplexer` (`backend/cmd/multiplexer.go:124-139`): `connections map[string]*Connection` を cluster+path キーで保持。`upgrader` (gorilla/websocket)。`WSConnLock` (`:150`) が書き込みを mutex 直列化。`Message` (`:106-121`) が `{clusterId, path, query, userId, data, type}` の JSON フレーム。複数の K8s watch を 1 本のクライアント WebSocket (`/wsMultiplexer`, `headlamp.go:853`) に集約

深掘りする 1 パス — プラグインのロードと登録:

1. バックエンドが `GeneratePluginPaths` (`backend/pkg/plugins/plugins.go:236`) で static/user/dev の各プラグインディレクトリを走査、`/plugins/list` (`headlamp.go:449` 付近) で相対パス配列を JSON 配信。`/plugins/` prefix で実ファイルを静的配信 (`headlamp.go:358`)
2. フロント `initializePlugins()` (`frontend/src/plugin/index.ts:119`)。まず各プラグインの `main.js` を `fetch(${getAppUrl()}${path}/main.js)` (`index.ts:459`) と `package.json` (`:467`) で取得
3. 取得した JS を実行すると、プラグインは `registerPlugin`/`window.plugins` に自身を登録。`initializePlugins` が `window.plugins` を走査し各 `plugin.initialize(new Registry())` を呼ぶ (`index.ts:122-126`)
4. `Registry` (`frontend/src/plugin/registry.tsx`) が拡張ポイントを公開: `registerSidebarEntry` (`:301`)、`registerRoute` (`:430` 付近)、`registerAppBarAction`、`registerDetailsViewSection` (`:245`)、`registerKubeObjectGlance` (`:363`) 等。プラグインはこれらでサイドバー項目・ルート・詳細画面セクションを注入
5. i18n は `initializePluginsI18n` (`index.ts:701`) がプラグインの翻訳を統合

驚いた/非自明な点:

- フロント API 層のルーツが K8dash (`apiProxy/index.ts:17-23` に明記)。歴史の一次資料がコードコメントに残っている
- プラグインは実行時に任意 JS を fetch して実行する。信頼境界はプラグインの配置元 (static/user dir) に依存。`plugins.go` に監視 (`Watch`, `:69`) と削除ガード (`isSubdirectory`, `:638`) がある
- `stateless.go`: kubeconfig をサーバに保存せずリクエストヘッダ (`KUBECONFIG`) で受ける「ステートレス」モードがある (`clusterRequests.ts:151` でフロントが `opts.headers['KUBECONFIG']` を付ける)。マルチテナント配信向け
- `k8cache` によるサーバ側 K8s 応答キャッシュは認可を尊重: `IsAllowed` (`server.go:handleCacheAuthorization`) でユーザ権限を確認してからキャッシュ配信

## 採用事例の素材

出典は ADOPTERS.md (リポ内、一次資料) と各社リンク。捏造なし。

- Microsoft — Headlamp に貢献・社内利用し、AKS desktop (`Azure/aks-desktop`) の基盤に採用 (ADOPTERS.md)
- Oracle — Oracle Cloud Native Environment (OCNE) の UI (OCNE UI) を Headlamp とプラグインで実装 (ADOPTERS.md)
- EPAM Systems — `edp-headlamp` として KubeRocketCI に統合 (ADOPTERS.md)
- Virginia Tech — 学内 IT Common Platform の UI として 6 クラスタを管理、独自プラグインを開発 (ADOPTERS.md)
- Swisscom — CNF (Cloud Native Network Function) 管理 UI (ADOPTERS.md)
- Orange — マネージドデータサービスの開発者向け UI (ADOPTERS.md)
- KA-NABELL (日本、トレカ EC) — マイクロサービス DevOps の運用ハブ、Knative プラグイン等を開発・貢献 (ADOPTERS.md)
- Millennium bcp、WhizUs GmbH も ADOPTERS.md に記載

GitHub シグナル (gh repo view / API, 2026-07-08 時点):

- Stars 6,835、Forks 922、コントリビュータ約 281 名 (contributors API 最終ページ)、作成 2019-11-08
- 最新リリース `v0.43.0` (2026-06-16 公開)
- OpenSSF Best Practices バッジ (project 7551)、OpenSSF Scorecard あり (README)

## 代替・エコシステム

エコシステム: 公式プラグイン集 (`headlamp-k8s/plugins`)、プラグインマーケットプレイス、`@kinvolk/headlamp-plugin` SDK + `pluginctl`。デスクトップアプリ (Electron)。Helm 連携、port-forward、Prometheus メトリクス表示、OpenTelemetry 計装。Kubernetes SIG UI サブプロジェクト。

主な代替 (本質的な差):

- **Kubernetes Dashboard** (公式): クラスタ内 Web UI。閲覧中心で拡張性は低い。Headlamp は書き込み操作・プラグイン拡張・マルチクラスタ・デスクトップ配布で差別化
- **Lens / OpenLens**: デスクトップ中心の高機能 IDE 的 UI。Lens 本体は商用寄り (Mirantis)。Headlamp は Apache-2.0 で web/desktop 両対応、プラグインで拡張
- **k9s**: ターミナル (TUI) の Kubernetes ナビゲータ。GUI ではない。速い運用向け。Headlamp はブラウザ GUI で非エンジニアにも届く
- **Octant** (VMware, アーカイブ): プラグイン型ダッシュボードだった先行例。開発終了。Headlamp が実質後継的ポジション

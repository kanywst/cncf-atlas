# recon: easegress

調査メモ。自分用の密度。出典は sources.md の番号を `(n)` で参照。読んだ `file:line` は src (pinned commit) で確認済み。

## 基本情報

- repo: easegress-io/easegress (git remote で確認 (1))。go.mod のモジュールパスは今も `github.com/megaease/easegress/v2` (4)。元々 megaease/easegress として公開され、独立 org easegress-io に移った。
- pinned commit: `3bdb1923a213334fad95dd98ca35dac7dd4c391c` (2026-07-01, "Harden Helm admin API defaults (#1524)")。近いタグ: **v2.11.0** (2026-03-17)。src は depth 1 の shallow clone なので `git describe` は効かない。HEAD は v2.11.0 より後の main tip。
- 言語 / ビルド: Go (go 1.26, toolchain go1.26.1 (4))。`make` / `go build` 系。`cmd/server`, `cmd/client`, `cmd/builder`。
- ライセンス: Apache-2.0 (1)(5)。
- CNCF 成熟度: **Sandbox**。2023-12-19 受理 (6)(7)。
- カテゴリ (CATEGORY_ORDER): **API Gateway** (tools.ts に既存)。7 層 API Gateway + Service Mesh サイドカーにもなる (8)。

## 歴史の素材

- 出自: MegaEase (megaease.com) が開発。前身は **Ease Gateway**、後に Easegress に改名 (8)(10)。gh homepageUrl も `https://megaease.com/easegress/` (1)。
- 動機: 既存ゲートウェイ (Nginx 等) はクラウドネイティブ以前の設計で、監視やサービスディスカバリが弱い。Nginx の C+Lua は C が難解で Lua が表現力不足、という問題意識から Go で新世代ゲートウェイを作った (10)。
- GitHub repo 作成 2021-05-28、初回リリース **v1.0.0 が 2021-06-02** (1)(9)。
- **v2.0.0 (2022-08 頃)**: 2 番目のメジャーリリース。トラフィックオーケストレーションを大幅強化し、プロトコル非依存の pipeline を導入 (11)。設計上の反省点として、v1.x では resilience (CircuitBreaker/Timeout/Retry 等) を独立 filter として実装していたのを「制御ロジックと業務ロジックが混ざる誤り」と判断し、v2.0 で **Proxy filter に埋め込む**形へ変更した (11)。これはコードでも確認できる (下記 `InjectResiliencePolicy`)。
- CNCF Sandbox 受理 2023-12-19。2023 H2 バッチ (Logging operator, K8sGPT, kcp, Copa, KCL, Kuasar など) と同時 (6)(7)。
- 直近の方向性: AI/LLM ゲートウェイ機能。`pkg/filters/aigatewayproxy`, `pkg/object/aigatewaycontroller` があり、OpenAI/Anthropic 等へのプロキシと Anthropic↔OpenAI 変換を実装 (1)(src)。
- 注記: MegaEase 創業者 Chen Hao は 2023 に逝去。プロジェクトは CNCF Sandbox 化で継続。伝記的詳細は本サイトの射程外なので深追いしない。

## アーキテクチャの素材

トップレベルは「オブジェクトを Supervisor が管理し、etcd 埋め込みクラスタで設定を共有する」構造。

- **オブジェクトモデル**: すべての管理対象は `supervisor.Object` (pkg/supervisor/registry.go:30)。カテゴリは優先度順に SystemController → BusinessController → Pipeline → TrafficGate (registry.go:102-125)。TrafficObject は `Init(superSpec, muxMapper)` を持つ (registry.go:61)。
- **TrafficGate (データプレーン入口)**: `HTTPServer` (pkg/object/httpserver) がリスナー。他に GRPCServer, MQTTProxy など (pkg/object 配下)。
- **Pipeline + Filter (オーケストレーション)**: `Pipeline` オブジェクト (pkg/object/pipeline) が filter を並べた flow を実行。filter は `pkg/filters/*` に多数 (proxy, validator, ratelimiter, corsadaptor, opafilter, waf, aigatewayproxy 等)。
- **Controller (コントロールプレーン/バックグラウンド)**: TrafficController が namespace 単位で HTTPServer/Pipeline を保持しハンドラを引ける (pkg/object/trafficcontroller)。他に AutoCertManager, MeshController, 各種 ServiceRegistry, StatusSyncController など。
- **クラスタ (etcd 埋め込み)**: `pkg/cluster`。`go.etcd.io/etcd/server/v3/embed` を各ノードに埋め込む (cluster.go:31, `embed.Etcd` フィールド cluster.go:123, `embed.StartEtcd` cluster.go:586)。Raft/leader election で HA。`Cluster` インタフェースは Get/Put/Watch/Syncer/STM を公開 (cluster_interface.go:33)。設定は etcd に置かれ全ノードで共有される。

### 代表オペレーション: HTTP リクエストが pipeline を通る流れ (end-to-end)

`file:line` は pinned commit で確認済み。

1. `mux.ServeHTTP` (pkg/object/httpserver/mux.go:338)。先頭で ACME (`/.well-known/acme-challenge/`) を特別処理 (mux.go:344)、そうでなければ現行 `muxInstance.serveHTTP` に転送 (mux.go:357)。
2. `muxInstance.serveHTTP` 内: リクエストボディを ByteCountReader で包む (mux.go:452)、トレーススパン生成 (mux.go:457)、`context.New(span)` で内部コンテキスト作成 (mux.go:459)、`httpprot.NewRequest` でリクエスト化し `ctx.SetRequest(DefaultNamespace, req)` (mux.go:463-467)。
3. ルーティング: `routers.NewContext(req)` → `mi.search(routeCtx)` でルート決定 (mux.go:472-473)、`ctx.SetRoute` (mux.go:474)。ルート未一致なら失敗レスポンス (mux.go:533-537)。
4. バックエンド解決: `backend := route.route.GetBackend()` (mux.go:539)、`mi.muxMapper.GetHandler(backend)` でハンドラ (= Pipeline) を取得 (mux.go:540)。MuxMapper 実体は TrafficController の Namespace.GetHandler (pkg/object/trafficcontroller/trafficcontroller.go:123)。
5. リライト/ペイロード取得: `route.route.Rewrite` (mux.go:548)、`req.FetchPayload(maxBodySize)` (mux.go:557、上限超過は 413)。
6. 実行: global filter が無ければ `handler.Handle(ctx)` (mux.go:572)、あれば `globalFilter.Handle(ctx, handler)` (mux.go:574)。`Handler` インタフェースは `Handle(ctx) string` のみ (pkg/context/context.go:35)。
7. `Pipeline.Handle` (pkg/object/pipeline/pipeline.go:357) → `doHandle` (pipeline.go:371)。flow を順に回し各 `node.filter.Handle(ctx)` を呼ぶ (pipeline.go:390)。結果文字列で `JumpIf` を引き、次ノードへ分岐 or `END` へ (pipeline.go:399-406)。各 filter の Duration/Result を FilterStat に記録 (pipeline.go:391)。
8. 終端 filter 例: `Proxy.Handle` (pkg/filters/proxies/httpproxy/proxy.go:343)。mirror pool を非同期に (proxy.go:346)、candidate pool を Match で選び (proxy.go:351)、`sp.handle(ctx, false)` で ServerPool 経由でバックエンドへ (proxy.go:358)。
9. レスポンス: `serveHTTP` の defer で `mi.sendResponse` (mux.go:367 定義、defer は mux.go:482)。`ctx.GetResponse` を stdw に書き戻し、アクセスログ/メトリクス/スパン終了 (mux.go:499-530)。

要点: pipeline は「filter を並べ、各 filter が返す result 文字列で JumpIf 分岐する有向グラフ実行機」。result が空文字なら正常継続、非空かつ JumpIf 未定義なら END で打ち切り (pipeline.go:399-401)。

## 内部実装の素材

### 主要ディレクトリ

- `pkg/supervisor` — オブジェクトのライフサイクル管理と登録 (registry.go, supervisor.go, spec.go)。
- `pkg/object/*` — TrafficGate / Pipeline / Controller の実装。`httpserver`, `pipeline`, `trafficcontroller`, `meshcontroller`, `aigatewaycontroller`, 各 `*serviceregistry` など。
- `pkg/filters/*` — filter 実装群と登録レジストリ (filters.go, registry.go)。
- `pkg/cluster` — 埋め込み etcd、Layout (キー空間)、Syncer/Watcher/Mutex/STM。
- `pkg/context` — リクエスト実行コンテキストと Handler/MuxMapper インタフェース。
- `pkg/protocols` — HTTP/MQTT 等のプロトコル抽象 (Request/Response)。
- `pkg/resilience` — CircuitBreaker/RateLimiter/Retry/TimeLimiter のポリシ。
- `cmd/server`, `cmd/client`, `cmd/builder` — サーバ本体 / CLI (egctl) / カスタムビルダ。

### 中核データ構造

- **`supervisor.Object`** (pkg/supervisor/registry.go:30): Category/Kind/DefaultSpec/Status/Close。TrafficObject は加えて Init/Inherit (registry.go:61)。カテゴリ定数と起動優先順 registry.go:102-125。
- **`filters.Filter`** (pkg/filters/filters.go:54): Name/Kind/Spec/Init/Inherit/**Handle(ctx) result**/Status/Close。`Kind` メタ構造体 (filters.go:33) が Name/Description/**Results** (取りうる result 一覧)/CreateInstance/DefaultSpec を持つ。`Spec` 共通インタフェース (filters.go:91) と `BaseSpec` (filters.go:113)。resilience を受ける filter は別途 `Resiliencer.InjectResiliencePolicy` (filters.go:86)。
- **`pipeline.Pipeline`** (pkg/object/pipeline/pipeline.go:63): `filters map[string]Filter` と `flow []FlowNode` と `resilience map`。`Spec` は Flow/Filters/Resilience/Data (pipeline.go:73)。**`FlowNode`** (pipeline.go:81) が肝: FilterName/FilterAlias/Namespace/**JumpIf map[result]target**/(解決済み filter)。`ValidateJumpIf` (pipeline.go:112) が result が Kind.Results に含まれるか、jump 先が存在するかを後方から検証。
- **`cluster.Cluster`** (pkg/cluster/cluster_interface.go:33): etcd 上の KV/Watch/Syncer/STM を公開。実体 `cluster` 構造体が `*embed.Etcd` を保持 (cluster.go:117-123)。

### 追う価値のあるパス: filter 登録と result 駆動分岐

- 各 filter パッケージの `init()` で `filters.Register(&Kind{...})` (pkg/filters/registry.go:29)。`kinds` グローバルマップに Name で登録、重複はパニック (registry.go:34,50)。`GetKind(name)` (registry.go:76) で引ける。
- Pipeline 構築時、`Spec.ValidateJumpIf` (pipeline.go:112) が各 FlowNode の JumpIf を検証し、`filters.GetKind(spec.Kind()).Results` (pipeline.go:123) に対して result 名の妥当性を確認。ここが「filter が宣言した Results 集合」と「pipeline の分岐」を型的に結び付けている。
- 実行時 `doHandle` (pipeline.go:371) は result="" を「正常継続」、非空 result を JumpIf テーブルで解決 (pipeline.go:399)。未登録なら END。これで「validator が invalid を返したら fallback filter へ飛ぶ」といった宣言的オーケストレーションが成立する。

### 気付き

- v2 の設計判断がコードに出ている: resilience は独立 filter ではなく Proxy に注入される (`Proxy.InjectResiliencePolicy` proxy.go:362 が mainPool/candidatePools に配る)。歴史 (11) の「filter から Proxy 埋め込みへ」がそのまま見える。
- Handler 抽象が極小 (`Handle(ctx) string` だけ, context.go:35) なので、HTTPServer から見た Pipeline は「文字列を返す 1 メソッド」に過ぎない。プロトコル非依存 pipeline の土台。
- 埋め込み etcd をライブラリとして各ノードに同梱 (別プロセス etcd を立てない)。運用の単純さと引き換えにバイナリが etcd を内包する。

## 採用事例の素材

出典付きのみ。ADOPTERS ファイルは repo に無い (確認済み)。

- **MegaEase 自身** が本番製品として利用・開発元 (megaease.com/easegress) (8)(1)。
- **CNCF landscape / project ページ**に Sandbox として掲載 (6)。
- **Open Policy Agent Ecosystem** に Easegress エントリあり (OPA filter 連携) (12)。
- GitHub シグナル (gh api, 2026-07-08 取得 (1)): stars 5,873 / forks 495 / contributors 69。repo 作成 2021-05-28、最終 push 2026-07-01。Docker Hub `megaease/easegress` の pulls バッジあり (5)。
- 個別企業の名指し採用事例は信頼できる一次情報 (ADOPTERS / ケーススタディ / 公開トーク) を確認できず。**捏造しない**。write 時は「MegaEase 発・CNCF Sandbox」までに留め、企業名は出さない。

## 代替・エコシステム

- **統合先**: Kubernetes Ingress Controller (pkg/object/ingresscontroller), EaseMesh サイドカー (meshcontroller), Knative FaaS, サービスレジストリ (Eureka/Consul/Nacos/Zookeeper/etcd; pkg/object/*serviceregistry), MQTT+Kafka, WebAssembly 拡張 (wasmhost), LLM ゲートウェイ (aigatewaycontroller) (8)。Portal (Web UI) は別リポ easegress-portal。
- **代替**:
  - **Envoy** (CNCF Graduated): C++ の高性能 L4/L7 プロキシ。データプレーンとして xDS で外部コントロールプレーン (Istio 等) から設定。Easegress は etcd 埋め込みで自己完結する点が対照的。
  - **Kong** (Independent/商用): Nginx+Lua/OpenResty ベース、プラグインエコシステムが広い。Easegress は Go の filter で拡張し C/Lua を避ける設計 (10)。
  - **Apache APISIX** (ASF): Nginx+Lua+etcd。etcd を設定ストアに使う点は Easegress と近いが、APISIX は外部 etcd、Easegress は埋め込み etcd。
  - **Traefik** (Independent): Go 製、Kubernetes/Docker のサービスディスカバリ自動化が売り。Easegress は pipeline/filter によるトラフィックオーケストレーションと Mesh/MQTT/LLM まで含む守備範囲の広さが違い。
- 差別化の芯: 「pipeline に filter を並べ、各 filter の result 文字列で JumpIf 分岐する宣言的オーケストレーション」+「埋め込み etcd による自己完結 HA クラスタ」。

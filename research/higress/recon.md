# recon: higress

調査メモ。自分用の密度。出典は sources.md の番号で参照。commit 固定なので Internals は下記 sha に対してのみ有効。

## 基本情報

- repo: `higress-group/higress` (canonical)。go.mod の module path は `github.com/alibaba/higress/v2` のまま (CNCF 寄贈で org が higress-group に移ったが import path は未変更)。(S1)(S2)
- pinned commit: `bd9c4c5104727ef5dfe24e23d2ba4786795db828` (main, 2026-07-07)。近い release tag: `v2.2.3` (2026-06-25)。HEAD はそれより数コミット先。clone は depth 1 の shallow なので `git describe` は不可。(S1)
- 言語 / ビルド: Go (control plane、Go 1.24.4)。データプレーンは Envoy。Wasm プラグインは Go / Rust / JS。Go ファイル約 975、Rust 約 22。[src: go.mod, find]
- ライセンス: Apache-2.0。(S1)
- CNCF 成熟度: Sandbox。TOC 投票通過を CNCF が 2026-03-25 に公表。(S3)
- カテゴリ (CATEGORY_ORDER から): API Gateway。
- GitHub: star 8,816 / fork 1,186 / contributors 約 182 / created 2022-10-27。参照日 2026-07-09。(S8)

## 歴史の素材

- Alibaba 社内で誕生。Tengine (Nginx フォーク) の reload が long-connection サービスに与える影響と、gRPC / Dubbo に対する負荷分散能力の不足を解消するために作られた。(S2)
- Alibaba Cloud はこれを基盤に商用 API Gateway 製品を構築し、99.99% 可用性を提供と主張。社内では Tongyi Bailian (通義百煉) model studio、PAI 機械学習プラットフォーム等の中核 AI アプリを支える。(S2)
- リポジトリ作成 2022-10-27。以降 v0.x → v1.0.0 → v2.x と進み、AI Gateway / MCP Server ホスティング機能に軸足を移した。(S1)(S8)
- 2026-03-25、CNCF TOC 投票を通過し CNCF Sandbox 入り。CNCF は「Envoy と Istio 上に構築された AI ネイティブ API Gateway。トラフィック / マイクロサービス / AI の 3 種のゲートウェイを単一コントロールプレーンに統合」と紹介。(S3)

## アーキテクチャの素材

Higress = 改造版 Istio Pilot (control plane) + Envoy (data plane) + Wasm プラグイン機構。K8s Ingress (+ nginx 互換アノテーション) や Gateway API を Istio 内部 config に翻訳し、Pilot が xDS に compile して Envoy に push する。

### トップレベル構成

- `cmd/higress/main.go` — エントリ。cobra root command を実行。[src: cmd/higress/main.go:26]
- `pkg/bootstrap/server.go` — サーバ組み立て。Istio の xDS `DiscoveryServer` を内蔵 (`xds.NewDiscoveryServer`, server.go:344) し、GVK ごとにカスタム generator を登録 (server.go:346-351, `pkg/ingress/mcp/generator.go`)。
- `pkg/ingress/` — Ingress → Istio config 翻訳層。中核。
  - `translation/translation.go` — `IngressTranslation` (ingress v1 と Knative ingress をまとめる薄いラッパ)。
  - `config/ingress_config.go` — `IngressConfig`。翻訳の本体 (約 2,300 行)。
  - `kube/annotations/` — nginx ingress 互換アノテーションのパーサ群 (cors, canary, rewrite, retry, timeout, auth, ip_access_control など約 25 種)。
  - `kube/gateway/` — Gateway API 対応。
- `registry/` — サービスディスカバリ。nacos / consul / eureka / zookeeper / direct を watch し ServiceEntry を生成 (`registry/reconcile`)。マイクロサービスゲートウェイ用途。
- `plugins/wasm-go/`, `plugins/wasm-rust/` — Wasm プラグイン群。wasm-go extensions は 59 個 (ai-proxy, ai-cache, jwt-auth, ext-auth, waf, oidc, mcp-server, mcp-router など)。ai-proxy は 61 の LLM プロバイダ実装を持つ。
- `istio/` — フォークした Istio (api / pilot / pkg)。Higress は upstream Istio をそのまま vendor せず改造版を同梱。

### 代表操作: K8s Ingress → Envoy ルート (end-to-end)

1. `cmd/higress/main.go:26` → cobra root → `pkg/bootstrap/server.go:152 NewServer` → `initConfigController` (server.go:220)。
2. server.go:239 `translation.NewIngressTranslation(...)` が `IngressConfig` を生成 → `s.configStores` に append → `configaggregate.MakeCache` でラップ (server.go:245) → `s.environment.ConfigStore` にセット (server.go:252)。つまり Higress の Ingress ストアは Istio Pilot にとって単なる config source。
3. xDS が特定 GVK の config を要求すると `ConfigStore.List(typ, ns)` → `IngressTranslation.List` (translation.go:163) → `IngressConfig.List` (ingress_config.go:288)。
4. `IngressConfig.List` は対象 GVK を Gateway / VirtualService / DestinationRule / EnvoyFilter / ServiceEntry / WasmPlugin に限定 (ingress_config.go:289-296)、`listFromIngressControllers` (ingress_config.go:324) を呼ぶ。
5. `listFromIngressControllers`: 各クラスタの ingress controller から生 Ingress を list (ingress_config.go:352-353) → 作成時刻でソート (`SortIngressByCreationTime`, :357) → `createWrapperConfigs` (:358) → GVK で分岐 (:361-372)。
6. VirtualService なら `convertVirtualService` (ingress_config.go:486): 各 Ingress に対し `ingressController.ConvertHTTPRoute` (:522) で HTTP ルートを構築 → nginx 互換アノテーションを `annotationHandler.ApplyRoute` (:530) で適用 → canary Ingress 統合 (:536) → weighted cluster の合計 100 正規化 (:542)。
7. 返る `[]config.Config` は Istio の VirtualService / Gateway / DestinationRule / EnvoyFilter / ServiceEntry / WasmPlugin。Pilot の generator (server.go:346-351) がこれを Envoy xDS (RDS/CDS/LDS) に compile し、Envoy データプレーンへ push。

要点: Higress は「Ingress を直接 Envoy にするコントローラ」ではなく、「Ingress とアノテーションを Istio config に翻訳し、内蔵の Istio Pilot に xDS 生成させる」構造。ホットリロード不要で経路変更が即時反映される (nginx ingress 比で反映が約 10 倍速い、と README が sealos の記事を引いて主張)。(S2)(S7)

## 内部実装の素材

### 中核データ構造

- `IngressConfig` (ingress_config.go:104-) — `istiomodel.ConfigStoreController` と `istiomodel.IngressStore` を実装 (ingress_config.go:79-80)。`remoteIngressControllers` / `remoteGatewayControllers` (マルチクラスタ)、各種 EventHandler スライス、`cachedEnvoyFilters`、`RegistryReconciler` (サービスディスカバリ) を保持。
- `common.WrapperConfig` / `WrapperHTTPRoute` / `ConvertOptions` — 翻訳の中間表現。`convertVirtualService` が `ConvertOptions` (ingress_config.go:487-494) にルート・ホスト・サービスラッパを溜めて組み立てる。
- Wasm プラグインは `convertWasmPlugin` (ingress_config.go:838) / `convertIstioWasmPlugin` (:1123) が Higress の `WasmPlugin` CRD を Istio の `extensions.WasmPlugin` に変換。EnvoyFilter 経由で Envoy の HTTP フィルタチェーンに Wasm モジュールを差し込む。

### 追う価値のあるパス: Wasm プラグインのリクエスト処理

- プラグインは higress-group が保守する Go SDK (`github.com/higress-group/wasm-go`, `github.com/higress-group/proxy-wasm-go-sdk`) で書く。upstream の proxy-wasm-go-sdk / tetratelabs をフォークして拡張している点に注意。
- 例: `plugins/wasm-go/extensions/request-block/main.go`。`init()` で `wrapper.SetCtx` にコールバックを登録 (main.go:34-39): `ParseConfigBy(parseConfig)`, `ProcessRequestHeadersBy(onHttpRequestHeaders)`, `ProcessRequestBodyBy(onHttpRequestBody)`。
- `onHttpRequestHeaders` (main.go:131) はブロック条件に一致すると `proxywasm.SendHttpResponseWithDetail(config.blockedCode, "request-block.url_blocked.exact", ...)` (main.go:143) で即応答を返し `types.ActionContinue` を返す。設定は `gjson` で JSON をパース (main.go:54 parseConfig)。
- これが「out-of-the-box プラグイン」の実体。ai-proxy はこの機構で 61 プロバイダの LLM API を OpenAI 互換プロトコルに正規化する。

### 驚いた点 / 非自明な選択

- Higress は Istio を「使う」のではなく Pilot をフォークして `istio/` に同梱し、Ingress ストアを ConfigStore として差し込む。Istio コントロールプレーンをそのまま流用しつつ CRD を Ingress + アノテーションで隠蔽する設計。
- nginx ingress からの移行を最優先に、アノテーション互換パーサを 25 種近く個別実装している (`kube/annotations/`)。marketing でなくコードとして「Nginx Ingress からのシームレス移行」を担保。
- サービスディスカバリが K8s だけでなく Nacos / Consul / Eureka / ZooKeeper に対応 (`registry/`)。Alibaba 系マイクロサービス (Dubbo) 由来の要件。

## 採用事例の素材 (出典必須)

CNCF 公式ブログ (2026-03-25) が本番採用として列挙: Alibaba Group, Ant Group, BOSS Zhipin, Cathay Insurance, Ctrip, DJI, Kuaishou, Sealos, Vipshop。用途は cloud-native トラフィックルーティングに加え AI Gateway / MCP サービス。(S3)

リポジトリ ADOPTERS.md (本番) では: antdigital (Ant Digital), kuaishou (LLM Gateway), Trip.com=Ctrip (LLM/MCP Gateway), vipshop (LLM/MCP/Inference Gateway), labring=sealos (Ingress Gateway)。(S4)

Alibaba Cloud は Higress を基盤に商用 API Gateway 製品を提供 (README)。(S2) sealos は数万の ingress の監視を nginx ingress から Higress に移行した事例をブログ化。(S7)

GitHub シグナル: star 8,816 / fork 1,186 / contributors 約 182。参照日 2026-07-09。(S8)

Higress 上に構築された OSS: HiMarket, HiClaw (CNCF ブログが言及)。(S3)

## 代替・エコシステム

- **Istio ingress gateway** — Higress は改造 Istio を内蔵する点で近縁。ただし Higress は Ingress + nginx アノテーション / Gateway API を第一級に扱い、Wasm プラグインハブと AI Gateway 機能を上乗せ。
- **Envoy Gateway** — 同じく Envoy データプレーン + Gateway API。Envoy Gateway は Gateway API 準拠が主眼、Higress は AI/MCP と nginx 移行に寄せている。
- **APISIX (Apache)** — Nginx/OpenResty (Lua) ベース。Higress は Envoy/Wasm ベースで、hmac-auth-apisix プラグインなど互換も一部意識。
- **Kong** — Nginx/OpenResty + Lua プラグイン。エンタープライズ寄り。Higress の差別化は AI Gateway (61 LLM プロバイダ) と MCP Server ホスティング。
- 統合: Nacos / Consul / Eureka / ZooKeeper (サービスディスカバリ)、Gateway API、openapi-to-mcpserver (higress-group)、Wasm Plugin Hub。

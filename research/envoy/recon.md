# recon: Envoy

調査メモ。L4/L7 プロキシ本体のコードを読んだ記録。出典は URL とリポジトリ内 `path:line` で残す。`src/` は pinned commit のクローン。

## 基本情報

- repo: [envoyproxy/envoy](https://github.com/envoyproxy/envoy)
- pinned commit: `6a45c7d9fee960d6457c44205faf6307157efc24` (2026-06-22 06:44 UTC)
- 近いタグ: `v1.38.2` (2026-06-10 リリース)。`VERSION.txt` は `1.39.0-dev`、`API_VERSION.txt` は `3.0.0`
- 言語 / ビルド: C++ (C++17/20 主体、ツール群に Go/Python/Rust/Starlark) / Bazel (`WORKSPACE`, `MODULE.bazel`, ルート `BUILD`)
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認、`gh api` の `license.spdx_id` も `Apache-2.0`)
- CNCF 成熟度: Graduated (2017-09-13 incubating で受理、2018-11-28 graduated)
- カテゴリ (バケット): Service Mesh & Networking
- エントリポイント: `source/exe/main.cc:16` の `main()` -> `Envoy::MainCommon::main`

## 歴史の素材

- 2015-05 Matt Klein が Twitter から Lyft へ。Lyft は monolith から microservice へ移行中で 30+ サービス。ELB/CloudWatch が P50/P99 レイテンシを出せず、ネットワーク観測性が最大の動機だった ([Medium: How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f))。
- 既存の NGINX/HAProxy では L4/L7 ルーティング以上の知性が足りず、多言語サービス環境では Finagle 型のライブラリ実装より out-of-process プロキシが適すると判断。性能のため modern C++ を選択。開発開始 2015-05、MVP デプロイ 2015-09 初旬 (同上)。
- 2016 初頭までに Lyft 全サービスが Envoy 経由 (client-side LB)、夏には edge と service-to-service の両方をカバーし数百サービス・毎秒数百万リクエストを処理 (同上)。
- 2016-09-14 OSS 公開。直後に Google/Apple/Microsoft/eBay のエンジニアから反応があり、想定を超える採用 ([5 years of Envoy OSS, Matt Klein](https://mattklein123.dev/2021/09/14/5-years-envoy-oss/))。
- 2017-09-13 CNCF の 11 番目のホストプロジェクトとして寄贈 ([Envoy joins the CNCF, Lyft Eng](https://eng.lyft.com/envoy-joins-the-cncf-dc18baefbc22))。2018-11-28 Kubernetes/Prometheus に続く 3 番目の graduated プロジェクトに ([CNCF project page](https://www.cncf.io/projects/envoy/))。

## アーキテクチャの素材

トップレベル `source/` は `common` / `server` / `exe` / `extensions` に分かれる。中核は `common` のネットワーク・HTTP スタック、拡張機能 (filter/codec 等) は `extensions/` にプラグインとして並ぶ。設定モデルは `api/` の protobuf (xDS, API v3)。

起動フロー:

- `source/exe/main.cc:16` `main()` が `MainCommon::main` を呼ぶ。
- `source/exe/main_common.cc:155` `MainCommon::main` -> `MainCommonBase::run()` (`source/exe/main_common.cc:77`)。`Serve` モードで `runServer()` を呼び、Server インスタンスのイベントループを回す。

スレッディングモデル (Envoy の核心思想): メインスレッドが設定とライフサイクルを管理し、固定数の worker スレッドが各自の libevent dispatcher で non-blocking にコネクションを処理する。worker 間でロックを共有しない。設定更新は immutable snapshot を thread-local スロットへ posting して差し替える。実装は `source/common/thread_local/thread_local_impl.h:20` の `InstanceImpl` と `SlotImpl::runOnAllThreads` (`:47`)。

リクエスト処理は filter chain で構成される。L4 は network read/write filter、L7 は HTTP Connection Manager (HCM) という network filter が HTTP codec を駆動し、その内側で HTTP decoder/encoder filter chain を回す。Istio など service mesh はこの HCM + xDS をデータプレーンとして使う ([Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/))。

## 内部実装の素材

代表オペレーションとして「ダウンストリームから来た HTTP リクエストが filter chain に入りルートが決まるまで」を end-to-end で追う。すべて `source/common/http/conn_manager_impl.cc`。

- `ConnectionManagerImpl::onData` (`:515`): network read filter のデータ入口。codec 未生成なら `createCodec(data)` (`:525`)。過負荷 (overload manager の load shed point) なら GOAWAY / 503 で早期返却 (`:519`, `:528-540`)。
- 本体は `codec_->dispatch(data)` (`:546`)。codec が HTTP フレームをパースし、新ストリームごとに `newStream` を呼ぶ。戻り値の `Status` を見て buffer flood / protocol error / overload を分類しエラー処理 (`:548-559`)。
- `ConnectionManagerImpl::newStream` (`:410`): `ActiveStream` を生成 (`:430`) し `streams_` 連結リストへ (`LinkedList::moveIntoList`, `:469`)。`maxRequestsPerConnection` 到達なら drain 開始 (`:434-445`)。バッファアカウント (メモリ課金) を stream に紐付け (`:419-428`)。
- `ActiveStream::decodeHeaders` (`:1354`): codec がヘッダ完了で呼ぶ。`request_headers_` を move 保持 (`:1366`)、protocol 判定 (`:1375`)、`validateHeaders()` (`:1388`)、Host 必須チェック (`:1448-1453`)、`:path` チェック (`:1470-1475`)。route config の snapshot をここで固定 (`:1394-1405`、scoped routes は `snapScopedRouteConfig()`)。
- ルート確定: `refreshCachedRoute()` (`:1553`) -> 実体 `:1811` -> `snapped_route_config_->route(cb, *request_headers_, ...)` (`:1827`) で `RouteConfig` を引き、`cached_route_` にキャッシュ。
- filter chain 生成: `filter_manager_.createDownstreamFilterChain()` (`:1564`)。upgrade (WebSocket) 受理/拒否をここで判定 (`:1565-1591`)。
- decode 開始: `filter_manager_.decodeHeaders(*request_headers_, end_stream)` (`:1600`)。以降は各 decoder filter (rate limit, ext_authz, router など) を順に通す。終端の Router filter がクラスタを選び upstream へ。

中核データ構造:

- `ConnectionManagerImpl`: HTTP を喋る network read filter 本体。1 ダウンストリームコネクション = 1 インスタンス。`source/common/http/conn_manager_impl.h`。
- `ConnectionManagerImpl::ActiveStream` (`source/common/http/conn_manager_impl.h:145`): 1 HTTP リクエスト/レスポンスの全状態。`request_headers_` (`:457`)、`filter_manager_` (`:473`)、`cached_route_` (`:512`) を保持。`LinkedObject` で侵入リスト化。
- `FilterManager` / `DownstreamFilterManager` (`source/common/http/filter_manager.h:34-35`): decoder/encoder filter chain の実行・iteration 制御・watermark backpressure。`decodeHeaders` 同 `:315`。
- `Buffer::OwnedImpl` (`source/common/buffer/buffer_impl.h:643`): Envoy の I/O バッファ抽象。内部は `Slice` (`:37`) を `SliceDeque` (`:426`) で連結し、ゼロコピー寄りの append/drain を実現。
- `ThreadLocal::InstanceImpl` / `SlotImpl` (`source/common/thread_local/thread_local_impl.h:20`, `:37`): worker スレッド横断の状態配布。

非自明な設計判断: thread-local による「ほぼロックフリー」設計。slot は main スレッドで即破棄され、index は再利用される。コールバックは `this` を直接キャプチャしてはならず index を手で渡す規約になっている (`source/common/thread_local/thread_local_impl.h:60-65` のコメント)。`still_alive_guard_` (`:69`) という `shared_ptr<bool>` を weak 参照することで、slot 破棄直後に worker へ post された callback が dangling 参照するレースを実用上の共通ケースで防ぐ。並行性をロックでなく「不変スナップショットの差し替え + 単一スレッド所有」で解くのが Envoy 全体の流儀。

## 採用事例の素材

リポジトリに `ADOPTERS.md` は存在しない (確認済み)。出典付きで名前を挙げられるもののみ:

- Lyft: 起源にして本番運用元。全 edge/service 間トラフィックを Envoy 経由 ([Medium: How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f))。
- Google / Apple / Microsoft / eBay: OSS 公開直後に採用に動いたと Matt Klein が言及 ([5 years of Envoy OSS](https://mattklein123.dev/2021/09/14/5-years-envoy-oss/))。
- Istio: データプレーンに Envoy を採用。istiod が xDS (LDS/RDS/CDS/EDS/SDS) で各 Envoy を設定 ([Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/))。

採用規模シグナル: GitHub stars 28,455 / forks 5,442 (`gh api repos/envoyproxy/envoy`, 2026-06-22)。CNCF プロジェクトページは contributors 8,444 / health score 84 と表示 ([CNCF project page](https://www.cncf.io/projects/envoy/), 2026-06-22)。

## 代替・エコシステム

- エコシステム/統合: Istio (sidecar + ambient データプレーン)、Envoy Gateway / Gateway API、Contour・Emissary-ingress (Ingress)、AWS App Mesh、gRPC との相互運用。WebAssembly (proxy-wasm) と Lua で拡張可能。
- 代替プロジェクトと本質差:
  - NGINX / HAProxy: 高速だが設定は基本静的 (reload 前提)。Envoy は xDS による動的設定とホットリスタートが核。
  - Traefik: Go 製、Kubernetes ネイティブで導入は容易だが、L7 機能の深さと xDS エコシステムは Envoy が広い。
  - linkerd2-proxy: Rust 製の軽量サイドカー。Linkerd 専用で汎用 edge プロキシではない。Envoy は汎用データプレーンとして service mesh 非依存。
- 差別化の核: ユニバーサルデータプレーン API (xDS v3) を中心に据え、proxy を「設定で動く汎用部品」にした点。多数の service mesh / ingress が Envoy を共通基盤として再利用している。

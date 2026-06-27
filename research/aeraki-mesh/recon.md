# recon: Aeraki Mesh

調査メモ。Istio を補完して HTTP 以外の L7 プロトコルをサービスメッシュで扱うためのコントロールプレーン。コードは実物を読んだ。`file:line` は `research/aeraki-mesh/src` 配下の pinned commit に対応。

## 基本情報

- repo: `aeraki-mesh/aeraki`
- pinned commit: `56e4de0f28d7bb0feab9d899eec08a28a62ad27a` (2025-05-12, master) / 近いタグ: `1.4.1` (2023-08-20)。HEAD はこのタグの後ろ、master 上の開発版。`git describe` はタグなしと返す (shallow + tag 未到達)。
- 言語 / ビルド: Go (go 1.24, `go.mod:3`) / `make build` (`Makefile`: `CGO_ENABLED=0 go build -o out/.../aeraki ./cmd/aeraki/main.go`)
- ライセンス: Apache License 2.0 (`LICENSE` の本文ヘッダで確認、`README.md:178`、GitHub API は `Apache-2.0`)
- CNCF 成熟度: Sandbox (2022-06-17 受理)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Service Mesh & Networking
- main エントリポイント: `cmd/aeraki/main.go:48` (`func main`)

用語メモ。

- L7 (Layer-7): OSI 第7層、アプリケーションプロトコル (Dubbo, Thrift, Kafka など)。
- EnvoyFilter: Istio の CRD (Custom Resource Definition)。Envoy プロキシの設定に低レベルなパッチを当てる API。
- RDS (Route Discovery Service): Envoy が動的にルート設定を取得する xDS サブプロトコル。Envoy 本体の RDS は HTTP 専用。
- MCP over xDS (Mesh Configuration Protocol): Istiod が設定リソースを配信する xDS ベースのプロトコル。
- VIP (Virtual IP): ServiceEntry に割り当てる仮想 IP。EnvoyFilter のリスナ名のマッチ条件に使う。
- mTLS (mutual TLS): 双方向 TLS 認証。

## 歴史の素材

- 作者は Huabing (Robin) Zhao (GitHub `zhaohuabing`)、現 Tetrate、CNCF Ambassador。`MAINTAINERS.md` の筆頭メンテナで Company は Tetrate.io。出典: [Zhaohuabing Blog (2021-09-27)](https://www.zhaohuabing.com/post/2021-09-27-aeraki/)。
- 解決したい課題は README に明記。Istio など主要メッシュは HTTP/gRPC 以外の L7 サポートが薄く、その他プロトコルを素の TCP として扱う。Envoy の RDS は HTTP 専用なので Dubbo/Thrift はリスナのインラインルートしか使えず、ルート変更時に既存接続が切れる。新しい独自プロトコルをメッシュに載せるには Envoy filter とコントロールプレーンを自前で書く必要がある (`README.md:46-58`)。
- リポジトリ作成は 2020-11-05 (GitHub API `created_at`)。
- 2022-06-17 に CNCF TOC の評価を通過し Sandbox 入り。Baidu, Zhihu, Alauda, Tencent Music, DiDi らの貢献に謝辞。出典: [Zhaohuabing Blog (2022-06-17)](https://www.zhaohuabing.com/post/2022-06-17-aeraki-mesh-cncf-sandbox/)、[CNCF project page](https://www.cncf.io/projects/aeraki-mesh/)。
- 本番マイルストーン: Tencent Music が IstioCon 2022 で Istio + Aeraki の運用を発表。Istio + Aeraki は 2022 年北京冬季五輪のストリーミングを支えたと作者ブログが記載。出典: [IstioCon 2022 session](https://events.istio.io/istiocon-2022/sessions/tencent-music-aeraki/)、[Zhaohuabing Blog (2022-04-26)](https://www.zhaohuabing.com/post/2022-04-26-aeraki-tencent-music-istiocon2022/)。

## アーキテクチャの素材

Aeraki はデータプレーンを持たない。Istio + Envoy の上に乗る「2 つの役割を持つコントロールプレーン」。

1. EnvoyFilter ジェネレータ (master のみ): Istiod を MCP over xDS で監視し、ServiceEntry / VirtualService / Gateway / Aeraki 独自 CRD の変化を受けて Envoy 設定の EnvoyFilter を生成し、Istio API server に書き戻す。
2. MetaProtocol 用 RDS サーバ (全レプリカ): MetaProtocol Proxy (データプレーン) からの RDS 購読に対し、MetaRouter から計算したルートを gRPC で push する。Envoy RDS が HTTP 専用なのに対し、任意 L7 用の動的ルート配信を提供する (`README.md:71`)。

コンポーネント構成 (`internal/bootstrap/server.go:103` `NewServer`)。

- `istio.NewController` (`server.go:113`) — Istiod を MCP over xDS で watch。実体は `internal/controller/istio/controller.go:69` の `xdsMCP *adsc.ADSC`、`controller.go:131` で `adsc.New` 接続。
- `envoyfilter.NewController` (`server.go:120`) — config 変化で EnvoyFilter を作る本体。`server.go:122` で configController にハンドラ登録し `envoyFilterController.ConfigUpdated(event)` を呼ぶ。
- `xds.NewCacheMgr` (`server.go:126`) と `xds.NewServer` (`server.go:132`) — MetaProtocol RDS。
- ジェネレータ map: HTTP 以外プロトコルごとに `Generator` 実装を差す。`cmd/aeraki/main.go:145` `initGenerators` で Thrift/Kafka/Zookeeper/MetaProtocol を登録 (`main.go:146-151`)、Dubbo と Redis は controller manager の client が要るので `server.go:144-145` で後から追加。
- 横スケール可能な controller 群 (`server.go:254` `createScalableControllers`) と、単一インスタンスのみ動く controller 群 (`server.go:303` `createSingletonControllers`)。後者は ServiceEntry に mesh 全体で一意な VIP を割り当てる。VIP を EnvoyFilter のマッチ条件に使うため一意性が必要、というのが非自明な設計判断 (`server.go:296-302` のコメントで明言)。

スケーラビリティ設計 (非自明な点その2): EnvoyFilter 生成は leader election で master 1 台のみ実行 (`server.go:341-351`、`leaderelection.EnvoyFilterController`)。一方 RDS サーバは全レプリカで動く (`server.go:352-368` で master/slave 関係なく `xdsServer.Run`)。書き込み系を 1 台に絞り、読み取り配信系を水平スケールさせる分業。

## 内部実装の素材

### 代表的な中核オペレーション: ServiceEntry 変化 → EnvoyFilter 生成 → Istio へ push

1. Istiod の MCP から config 変化イベントを受信。`istio.Controller` が登録済みハンドラを叩き、`envoyfilter.Controller.ConfigUpdated(event)` を呼ぶ (`server.go:122-124`)。
2. `ConfigUpdated` は単に `pushChannel` にイベントを送るだけ (`internal/envoyfilter/controller.go:513-515`)。
3. `mainLoop` (`controller.go:97`) が `pushChannel` を select し、`debounce.New(debounceAfter=1s, debounceMax=10s, ...)` (`controller.go:116`) で debounce してから `callback` を発火。callback は `pushEnvoyFilters2APIServer` を呼び、失敗時は最大 3 回 `ConfigUpdated` で再投入 (`controller.go:100-115`)。
4. `pushEnvoyFilters2APIServer` (`controller.go:128`) がまず `generateEnvoyFilters()` (`controller.go:129`) を呼び、次に既存の EnvoyFilter を `manager=aeraki` ラベルで一覧 (`controller.go:135-137`)。生成結果との差分で削除 (`controller.go:140-149`) / 変更 (`proto.Equal` 比較、`controller.go:156`) / 新規 (`controller.go:171-178`) を Istio clientset 経由で reconcile。FieldManager は `constants.AerakiFieldManager`。
5. `generateEnvoyFilters` (`controller.go:200`) は config store から ServiceEntry を全件取得 (`controller.go:202`)。各 port 名から `protocol.GetLayer7ProtocolFromPortName(port.Name)` で L7 種別を判定 (`controller.go:222`)。port 名は `tcp-metaprotocol-xxx` のように `-` 区切りの 2 番目で判定する規約 (`internal/model/protocol/instance.go:113-119`)。
6. 該当ジェネレータがあれば (`controller.go:223`) `envoyFilterContext` (`controller.go:226`、関連 VirtualService と MetaRouter を解決して `EnvoyFilterContext` を組む `controller.go:342`) を作り、`generator.Generate(ctx)` を呼ぶ (`controller.go:233`)。
7. 例として MetaProtocol ジェネレータ (`internal/plugin/metaprotocol/generator.go:40` `Generate`) は sidecar 経路で `generateSidecarEnvoyFilters` (`generator.go:83`) を呼び、各 metaprotocol port に対し `envoyfilter.GenerateReplaceNetworkFilter(...)` を呼ぶ (`generator.go:97-104`)。フィルタ名 `envoy.filters.network.meta_protocol_proxy`、型 URL `type.googleapis.com/aeraki.meta_protocol_proxy.v1alpha.MetaProtocolProxy`。
8. `GenerateReplaceNetworkFilter` (`internal/envoyfilter/network_filter.go:45`) は `generateNetworkFilter(..., EnvoyFilter_Patch_REPLACE)` を呼ぶ (`network_filter.go:48-49`)。生成パッチは `ApplyTo: networking.EnvoyFilter_NETWORK_FILTER` で、outbound listener (`<VIP>_<port>`) の `wellknown.TCPProxy` フィルタを REPLACE する (`network_filter.go:96-114`)。これで素の TCP プロキシをプロトコル対応プロキシに差し替える。

要するに Aeraki は宣言的な ServiceEntry/MetaRouter を読んで、Istio が標準では張れない L7 用 Envoy 設定 (EnvoyFilter) を機械生成する翻訳器。

### MetaProtocol RDS パス (もう一つの役割)

- `xds.Server` (`internal/xds/server.go:52` `NewServer`) は gRPC で RDS を提供。`serverv3.NewServer` を作り `routeservice.RegisterRouteDiscoveryServiceServer` で登録 (`server.go:75-76`)。TLS は mTLS 必須 (`initXdsServer` が `tls.RequireAndVerifyClientCert` を設定、`bootstrap/server.go:197`)。
- `xds.CacheMgr` (`internal/xds/cache_mgr.go:62` `NewCacheMgr`) が go-control-plane の `SnapshotCache` を保持。`updateRouteCache` (`cache_mgr.go:115`) は購読者がいなければスキップ (`cache_mgr.go:116-119`)、ServiceEntry から `generateMetaRoutes` (`cache_mgr.go:141`) でルートを作り全 node に SetSnapshot。
- `constructRoute` (`cache_mgr.go:207`) が MetaRouter の各 route を `metaroute.Route` に変換。weighted cluster、hash policy、mirror、request/response mutation までサポート (`cache_mgr.go:231-307` `constructAction`)。

### 中核データ構造 (3-5)

- `protocol.Instance` (`internal/model/protocol/instance.go:22`): プロトコル種別を表す `string` 型。Dubbo/Thrift/Mongo/Redis/MySQL/Kafka/Zookeeper/MetaProtocol/Unsupported の定数 (`instance.go:24-43`)。`RegisterProtocol` で動的追加も可 (`instance.go:60`)。
- `envoyfilter.Generator` interface (`internal/envoyfilter/generator.go:22`): `Generate(context *model.EnvoyFilterContext) ([]*model.EnvoyFilterWrapper, error)` の 1 メソッド (`generator.go:23`)。プロトコルごとの拡張点。
- `model.EnvoyFilterContext` (`internal/model/config.go:59`): ジェネレータへの集約入力。MeshConfig / Gateway / ServiceEntry / VirtualService / MetaRouter を 1 つに束ねる (`config.go:62-79`)。
- `model.EnvoyFilterWrapper` (`internal/model/config.go:52`): 生成結果。Name/Namespace/`*networking.EnvoyFilter` を持つ (`config.go:53-55`)。Name が Istio 上の一意キー。
- `xds.CacheMgr` (`internal/xds/cache_mgr.go:53`): RDS の `SnapshotCache` と config store、push channel を保持 (`cache_mgr.go:54-59`)。

### 非自明な設計判断 (まとめ)

- VIP の一意割り当てを単一 controller でやる理由は EnvoyFilter のリスナマッチに VIP を使うから (`bootstrap/server.go:296-302`)。Istio はサイドカースコープで VIP を割るので mesh 全体では一貫しない、それを Aeraki が補正する。
- 書き込み (EnvoyFilter 生成) は leader 1 台、読み取り配信 (RDS) は全レプリカという非対称スケール。

## 採用事例の素材

出典付きの組織のみ。専用 ADOPTERS ファイルは repo に無し (`find -iname '*adopter*'` で 0 件)。利用者収集は [issue #105](https://github.com/aeraki-mesh/aeraki/issues/105) で行われている (`README.md:169`)。

- Tencent Music: IstioCon 2022 で Istio + Aeraki 運用を登壇。出典: [IstioCon 2022 session](https://events.istio.io/istiocon-2022/sessions/tencent-music-aeraki/)。`MAINTAINERS.md` に Tencent Music 所属メンテナ (`whitefirer`) あり。
- Tencent: メンテナ `Xunzhuo` が Tencent 所属 (`MAINTAINERS.md`)。README に tRPC (Tencent 独自 RPC)、qza (Tencent Music)、videoPacket (Tencent Media Data Platform)、Tencent iGame が MetaProtocol 対応プロトコルとして列挙 (`README.md:92-95`)。
- README の "Supported protocols" に Alauda、bRPC (Baidu OSS) の言及 (`README.md:91,95`)。
- GitHub シグナル (2026-06-26 時点、GitHub API): stars 761、forks 141、contributors 約 34 (非匿名、`per_page=1` の Link ヘッダ last page=34)、open issues 21、最終 push 2025-12-05、archived=false。

注意: 上記以外の named adopter は確証ソースが無いので断定しない。

## 代替・エコシステム

- エコシステム (同 org): `meta-protocol-proxy` (データプレーン、C++ Envoy filter)、`api`、`client-go`、`meta-protocol-control-plane-api`、`aerakictl` (デバッグ CLI)、`website`。Aeraki は `github.com/aeraki-mesh/client-go` と `github.com/aeraki-mesh/api` に依存 (`go.mod`)。
- 統合先: Istio (必須、MCP over xDS で連携、`controller/istio/controller.go`)、Envoy (EnvoyFilter 経由)。バージョン互換は厳密で、Aeraki 1.4.x は Istio 1.18.x + MetaProtocol Proxy 1.4.x (出典: [install docs](https://www.aeraki.net/docs/v1.x/install/))。
- 代替と差。
  - 素の Istio + 手書き EnvoyFilter: 可能だが各プロトコルで filter とルーティングを自前実装する必要。Aeraki は MetaProtocol で codec interface 実装だけに作業を縮小 (`README.md:72`)。
  - Istio の Dubbo/Thrift/MySQL/MongoDB/Redis ネイティブフィルタ: インラインルートのみでルート変更時に接続断、動的 RDS が無い (`README.md:50`)。Aeraki は MetaProtocol で独自 RDS を持ち動的ルート更新が可能。
  - Cilium / Linkerd 等のメッシュ: L7 は主に HTTP/gRPC 中心で、Dubbo/Thrift/独自 RPC の宣言的ルーティングは守備範囲外。Aeraki の本質的差は任意の request/response 型 L7 を codec 追加だけでメッシュに載せる点。

## getting started (最小構成)

前提: Kubernetes クラスタ、互換版 Istio (Aeraki 1.4.x なら Istio 1.18.x)。Istio の ConfigMap に Aeraki プロトコル用の DNS capture / metrics 設定を追加する必要がある (出典: [install docs](https://www.aeraki.net/docs/v1.x/install/))。

```bash
git clone https://github.com/aeraki-mesh/aeraki.git
cd aeraki
export AERAKI_TAG=1.4.1
make install
```

`make install` は `bash demo/install-aeraki.sh` を実行 (`Makefile`)。デモアプリは `make demo` (`bash demo/install-demo.sh default`)、Kafka 版は `make demo-kafka`、bRPC 版は `make demo-brpc`。ソースからのビルドは `make build` (Linux) または `make build IMAGE_OS=darwin` (macOS)、要 Go >= 1.16 と Docker (`README.md:131-141`)。クイックスタート手順は [quickstart](https://www.aeraki.net/docs/v1.x/quickstart/)。

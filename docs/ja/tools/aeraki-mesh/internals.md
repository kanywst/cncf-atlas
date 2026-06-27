# 内部実装

> コミット `56e4de0` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/aeraki/main.go` | プロセスのエントリポイント、フラグ解析、ジェネレータ登録。 |
| `internal/bootstrap/server.go` | controller 群を配線し起動する。 |
| `internal/controller/istio/controller.go` | Istiod を MCP over xDS で監視する。 |
| `internal/envoyfilter/controller.go` | 生成した `EnvoyFilter` を Istio に reconcile する。 |
| `internal/envoyfilter/network_filter.go` | TCP プロキシを差し替える `EnvoyFilter` パッチを組む。 |
| `internal/plugin/metaprotocol/generator.go` | MetaProtocol ジェネレータの実装。 |
| `internal/xds/server.go` | MetaProtocol Proxy 向けの gRPC RDS サーバ。 |
| `internal/xds/cache_mgr.go` | MetaProtocol ルートを計算し snapshot cache から配信する。 |
| `internal/model/config.go` | ジェネレータの集約入力・出力の型。 |
| `internal/model/protocol/instance.go` | プロトコル列挙と port 名の解析。 |

## 中核データ構造

`protocol.Instance` はプロトコル種別を表す string 型です (`internal/model/protocol/instance.go:22`)。Dubbo・Thrift・Mongo・Redis・MySQL・Kafka・Zookeeper・MetaProtocol・Unsupported の定数があります (`internal/model/protocol/instance.go:24-43`)。新しいプロトコルは `RegisterProtocol` で実行時に追加できます (`internal/model/protocol/instance.go:60`)。

`Generator` はプロトコルごとの拡張インターフェースで、メソッドは 1 つです (`internal/envoyfilter/generator.go:22-24`)。

```go
type Generator interface {
    Generate(context *model.EnvoyFilterContext) ([]*model.EnvoyFilterWrapper, error)
}
```

`model.EnvoyFilterContext` はジェネレータへの集約入力で、`MeshConfig`・`Gateway`・`ServiceEntry`・`VirtualService`・`MetaRouter` を束ねます (`internal/model/config.go:59-80`)。`model.EnvoyFilterWrapper` は出力で、`Name`・`Namespace`・`*networking.EnvoyFilter` を持ち、`Name` が Istio 上の一意キーです (`internal/model/config.go:50-56`)。

## 追う価値のあるパス

MetaProtocol ジェネレータが、素の TCP プロキシをプロトコル対応プロキシに差し替える `EnvoyFilter` を生成する経路を取り上げます。

`Generate` は `Gateway` が設定されているかで分岐し、なければ `generateSidecarEnvoyFilters` を呼びます (`internal/plugin/metaprotocol/generator.go:40-44`)。各 MetaProtocol port について outbound/inbound のプロキシを組み、`GenerateReplaceNetworkFilter` を呼びます (`internal/plugin/metaprotocol/generator.go:97-104`)。

```go
envoyfilters = append(envoyfilters,
    envoyfilter.GenerateReplaceNetworkFilter(
        context.ServiceEntry,
        port,
        outboundProxy,
        inboundProxy,
        "envoy.filters.network.meta_protocol_proxy",
        "type.googleapis.com/aeraki.meta_protocol_proxy.v1alpha.MetaProtocolProxy")...)
```

`GenerateReplaceNetworkFilter` は `EnvoyFilter_Patch_REPLACE` 操作で `generateNetworkFilter` を呼びます (`internal/envoyfilter/network_filter.go:45-49`)。outbound パッチは `<address>_<port>` という名前のリスナを対象にし (`internal/envoyfilter/network_filter.go:94-95`)、`NETWORK_FILTER` に適用して、フィルタ名が `wellknown.TCPProxy` であるフィルタチェーンにマッチします (`internal/envoyfilter/network_filter.go:96-104`)。この操作が TCP プロキシを MetaProtocol プロキシに REPLACE します。

呼び出しチェーン:

```text
metaprotocol.Generate
  -> generateSidecarEnvoyFilters
    -> envoyfilter.GenerateReplaceNetworkFilter
      -> generateNetworkFilter (operation = REPLACE)
        -> generateOutboundListenerEnvoyFilters (<addr>_<port> で wellknown.TCPProxy にマッチ)
```

もう 1 つの役割は RDS パスです。`xds.Server.Run` は go-control-plane のサーバを作り、Route Discovery Service サーバとして登録します (`internal/xds/server.go:75-76`)。

```go
srv := serverv3.NewServer(context.Background(), s.cacheMgr.cache(), newCallbacks(s.cacheMgr))
routeservice.RegisterRouteDiscoveryServiceServer(grpcServer, srv)
```

`updateRouteCache` は購読者がいなければスキップし (`internal/xds/cache_mgr.go:116-119`)、`ServiceEntry` を一覧して `generateMetaRoutes` を呼び (`internal/xds/cache_mgr.go:123`)、接続中の全 node に snapshot をセットします (`internal/xds/cache_mgr.go:131-137`)。`constructRoute` は各 `MetaRouter` の route を `metaroute.Route` に変換し、action は `constructAction` が組みます (`internal/xds/cache_mgr.go:207-220`)。

## 読んで驚いた点

port 名がプロトコルの判定材料です。`GetLayer7ProtocolFromPortName` は名前を `-` で分割し 2 番目の要素を parse するので (`internal/model/protocol/instance.go:113-119`)、`tcp-metaprotocol-foo` という port 名は MetaProtocol と判定されます。annotation ではなくこの規約がジェネレータ選択を駆動します。

RDS サーバの mTLS (mutual TLS) 要求は、config だけでなくコードで強制されます。`initXdsServer` は Istio root CA プールとともに `ClientAuth: tls.RequireAndVerifyClientCert` を設定するので (`internal/bootstrap/server.go:194-199`)、MetaProtocol プロキシはルートを受け取るのに有効なクライアント証明書の提示が必須です。

reconcile は差分ではなく全状態です。`pushEnvoyFilters2APIServer` は Aeraki 管理の既存 `EnvoyFilter` を毎回すべて一覧し、集合全体を diff します (`internal/envoyfilter/controller.go:135-178`)。イベントの集中は debounce が吸収します (`internal/envoyfilter/controller.go:116`)。push ごとのコストと引き換えに、より単純な収束保証を得ています。

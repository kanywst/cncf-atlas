# 内部実装

> ソースはコミット `bd9c4c5` (タグ `v2.2.3` の近傍) から読んだ。ここでの主張はすべて file:line を指す。リポジトリは `higress-group/higress`、Go モジュールパスは今も `github.com/alibaba/higress/v2` (`go.mod:1`)。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/higress/` | バイナリ。cobra root command を実行 |
| `pkg/bootstrap/` | server 組み立て、内蔵 Istio xDS `DiscoveryServer`、GVK ごとの generator |
| `pkg/ingress/config/` | `IngressConfig`、Ingress から Istio config への翻訳 |
| `pkg/ingress/translation/` | `IngressTranslation`、Ingress v1 と Knative ingress をまとめるラッパ |
| `pkg/ingress/kube/annotations/` | nginx 互換アノテーションのパーサ群 (約 25 種) |
| `pkg/ingress/kube/gateway/` | Gateway API 対応 |
| `registry/` | Nacos・Consul・Eureka・ZooKeeper・direct からのサービスディスカバリ |
| `plugins/wasm-go/`, `plugins/wasm-rust/` | Envoy のフィルタチェーンで動く Wasm 拡張 |
| `istio/` | フォークした in-tree の Istio (`api`・`client-go`・`istio`・`pkg`・`proxy`) |

## 中核データ構造

`IngressConfig` (`pkg/ingress/config/ingress_config.go:104`) が翻訳の要となる型だ。その目的は 2 つのコンパイル時インターフェース表明が語る。この型は `istiomodel.ConfigStoreController` と `istiomodel.IngressStore` の両方を実装する (`pkg/ingress/config/ingress_config.go:79`, `pkg/ingress/config/ingress_config.go:80`)。`ConfigStoreController` であることが、内蔵 Pilot にこれを config ソースとして扱わせる。この構造体はマルチクラスタ用にクラスタ ID で引く `remoteIngressControllers` と `remoteGatewayControllers` (`pkg/ingress/config/ingress_config.go:105`, `pkg/ingress/config/ingress_config.go:106`)、GVK ごとの `EventHandler` スライス、`cachedEnvoyFilters` スライス (`pkg/ingress/config/ingress_config.go:122`)、サービスディスカバリ用の `RegistryReconciler` (`pkg/ingress/config/ingress_config.go:126`) を保持する。

翻訳の中間表現は `common.ConvertOptions` で、`convertVirtualService` の冒頭で構築される (`pkg/ingress/config/ingress_config.go:487`)。関数が各 Ingress を巡る間に `VirtualServices`・`HTTPRoutes`・`Route2Ingress`・`ServiceWrappers`・`ProxyWrappers` の map を溜める。ラッパ型 (`WrapperConfig`・`WrapperHTTPRoute`) が Ingress とパース済みアノテーション設定を変換の中を通して運ぶ。

Wasm プラグインは 2 段の変換を経る。`convertWasmPlugin` (`pkg/ingress/config/ingress_config.go:838`) が `m.wasmPlugins` から Higress の `WasmPlugin` config を出し、`convertIstioWasmPlugin` (`pkg/ingress/config/ingress_config.go:1123`) が Higress の `WasmPlugin` を Istio の `extensions.WasmPlugin` に変える。Pilot はそれを EnvoyFilter 経由で Envoy の HTTP フィルタチェーンに注入する。

## 追う価値のあるパス

Kubernetes Ingress が Envoy ルートになるまでを追う。

```text
main                              cmd/higress/main.go:26
  -> NewServer                    pkg/bootstrap/server.go:152
       -> initConfigController    pkg/bootstrap/server.go:220
            NewIngressTranslation server.go:239   Ingress ストアを構築
            configStores append   server.go:242
            MakeCache             server.go:245   1 つの ConfigStore に集約
            environment.ConfigStore = ...  server.go:252
  -> (xDS 要求) ConfigStore.List
       -> IngressTranslation.List translation.go:163
            -> IngressConfig.List ingress_config.go:288
                 GVK ガード       ingress_config.go:289
                 listFromIngressControllers  ingress_config.go:324
                   SortIngressByCreationTime ingress_config.go:357
                   createWrapperConfigs      ingress_config.go:358
                   switch typ -> convertVirtualService ingress_config.go:486
                     ConvertHTTPRoute        ingress_config.go:522
                     ApplyRoute (アノテーション) ingress_config.go:530
                     applyCanaryIngresses    ingress_config.go:536
                     normalizeWeightedCluster ingress_config.go:542
```

`initConfigController` が設計判断の具体化する場所だ。`NewIngressTranslation` が `IngressConfig` 裏付けのストアを構築し (`pkg/bootstrap/server.go:239`)、`s.configStores` に append され (`pkg/bootstrap/server.go:242`)、`configaggregate.MakeCache` が集合を 1 つのコントローラに畳み (`pkg/bootstrap/server.go:245`)、`s.environment.ConfigStore` にセットされる (`pkg/bootstrap/server.go:252`)。これ以降、Pilot はユーザ適用 config と同じインターフェースを通じて翻訳済み Istio config を読む。

`IngressConfig.List` は自身が生む 6 つ以外の GVK を拒否し (`pkg/ingress/config/ingress_config.go:289`)、続いて `listFromIngressControllers` がクラスタ横断で生 Ingress を集め、作成時刻でソートしてから (`pkg/ingress/config/ingress_config.go:352`, `pkg/ingress/config/ingress_config.go:357`)、要求型で分岐する (`pkg/ingress/config/ingress_config.go:361`)。作成時刻順のソートが効くのは、後の Ingress が前を上書きでき、canary 統合が安定した順序に依存するからだ。

`convertVirtualService` が Ingress をルーティングに変える。Ingress ごとに `ConvertHTTPRoute` が HTTP ルートを構築し (`pkg/ingress/config/ingress_config.go:522`)、`annotationHandler.ApplyRoute` が nginx 互換アノテーションの挙動を重ね (`pkg/ingress/config/ingress_config.go:530`)、canary Ingress が統合され (`pkg/ingress/config/ingress_config.go:536`)、weighted cluster が合計 100 になるよう正規化される (`pkg/ingress/config/ingress_config.go:542`)。

## 読んで驚いた点

Higress は Istio を外部依存として使わない。Pilot を tree にフォークし、自前の config ストアを差し込む。ゲートウェイ全体が、玄関だけ差し替えた Istio のコントロールプレーンだ。`IngressConfig` は `istiomodel.ConfigStoreController` を満たすので (`pkg/ingress/config/ingress_config.go:79`)、Pilot は config が Istio CRD でなく Ingress 由来だと知ることがない。この再利用こそがアーキテクチャであり、Higress が upstream を import せず `istio/` 配下に改造 Istio を抱える理由だ。

Wasm プラグインのリクエストパスは小さく、読む価値がある。`plugins/wasm-go/extensions/request-block/main.go` を例に取る。`main` は空で (`plugins/wasm-go/extensions/request-block/main.go:32`)、登録は `init` で起きる。`init` は config パースとリクエスト各フェーズのコールバックを付けて `wrapper.SetCtx` を呼ぶ (`plugins/wasm-go/extensions/request-block/main.go:35`)。`ParseConfigBy(parseConfig)` (`main.go:37`)、`ProcessRequestHeadersBy(onHttpRequestHeaders)` (`main.go:38`)、`ProcessRequestBodyBy(onHttpRequestBody)` (`main.go:39`) だ。リクエストがブロック規則に一致すると `onHttpRequestHeaders` (`main.go:131`) が `proxywasm.SendHttpResponseWithDetail` で即応答を返す (`main.go:143`)。設定は `gjson` で JSON からパースされる (`main.go:54`)。この同じ形 (`SetCtx` + フェーズコールバック) で `ai-proxy` プラグインは 37 の LLM プロバイダ (`plugins/wasm-go/extensions/ai-proxy/provider/provider.go:224` に登録) を OpenAI 互換 API に正規化する。

サービスディスカバリは Kubernetes の外にも届く。`registry/` は Nacos・Consul・Eureka・ZooKeeper を watch し、そのエントリを Istio ServiceEntry に変える。だから同じゲートウェイが、クラスタ外に登録された Dubbo 系マイクロサービスへもルーティングする。これは Higress の Alibaba 起源を直接なぞる痕跡だ。そこでは RPC スタックが Kubernetes のサービスディスカバリより先に存在した。

# Internals

> Read from the source at commit `bd9c4c5` (near tag `v2.2.3`). Every claim here points at a file and line. The repository is `higress-group/higress`; the Go module path is still `github.com/alibaba/higress/v2` (`go.mod:1`).

## Code map

| Path | Responsibility |
| --- | --- |
| `cmd/higress/` | The binary; runs the cobra root command |
| `pkg/bootstrap/` | Server assembly, the embedded Istio xDS `DiscoveryServer`, and per-GVK generators |
| `pkg/ingress/config/` | `IngressConfig`, the translation from Ingress to Istio config |
| `pkg/ingress/translation/` | `IngressTranslation`, the wrapper merging Ingress v1 and Knative ingress |
| `pkg/ingress/kube/annotations/` | The nginx-compatibility annotation parsers (about 25 families) |
| `pkg/ingress/kube/gateway/` | Gateway API support |
| `registry/` | Service discovery from Nacos, Consul, Eureka, ZooKeeper, direct |
| `plugins/wasm-go/`, `plugins/wasm-rust/` | Wasm extensions run in Envoy's filter chain |
| `istio/` | The forked, in-tree Istio (`api`, `client-go`, `istio`, `pkg`, `proxy`) |

## Core data structures

`IngressConfig` (`pkg/ingress/config/ingress_config.go:104`) is the type the translation turns on. Its purpose is stated by two compile-time interface assertions: it implements both `istiomodel.ConfigStoreController` and `istiomodel.IngressStore` (`pkg/ingress/config/ingress_config.go:79`, `pkg/ingress/config/ingress_config.go:80`). Being a `ConfigStoreController` is what lets the embedded Pilot treat it as a config source. The struct holds `remoteIngressControllers` and `remoteGatewayControllers` keyed by cluster ID for multi-cluster (`pkg/ingress/config/ingress_config.go:105`, `pkg/ingress/config/ingress_config.go:106`), per-GVK `EventHandler` slices, a `cachedEnvoyFilters` slice (`pkg/ingress/config/ingress_config.go:122`), and a `RegistryReconciler` for service discovery (`pkg/ingress/config/ingress_config.go:126`).

The intermediate representation of a translation is `common.ConvertOptions`, built at the top of `convertVirtualService` (`pkg/ingress/config/ingress_config.go:487`). It accumulates `VirtualServices`, `HTTPRoutes`, `Route2Ingress`, `ServiceWrappers`, and `ProxyWrappers` maps as the function walks each Ingress. The wrapper types (`WrapperConfig`, `WrapperHTTPRoute`) carry an Ingress plus its parsed annotation config through the conversion.

Wasm plugins go through two conversions. `convertWasmPlugin` (`pkg/ingress/config/ingress_config.go:838`) emits Higress `WasmPlugin` config from `m.wasmPlugins`, and `convertIstioWasmPlugin` (`pkg/ingress/config/ingress_config.go:1123`) converts a Higress `WasmPlugin` into Istio's `extensions.WasmPlugin`, which Pilot then injects into Envoy's HTTP filter chain via EnvoyFilter.

## A path worth tracing

Take a Kubernetes Ingress becoming an Envoy route.

```text
main                              cmd/higress/main.go:26
  -> NewServer                    pkg/bootstrap/server.go:152
       -> initConfigController    pkg/bootstrap/server.go:220
            NewIngressTranslation server.go:239   build the Ingress store
            configStores append   server.go:242
            MakeCache             server.go:245   wrap as one ConfigStore
            environment.ConfigStore = ...  server.go:252
  -> (xDS request) ConfigStore.List
       -> IngressTranslation.List translation.go:163
            -> IngressConfig.List ingress_config.go:288
                 GVK guard        ingress_config.go:289
                 listFromIngressControllers  ingress_config.go:324
                   SortIngressByCreationTime ingress_config.go:357
                   createWrapperConfigs      ingress_config.go:358
                   switch typ -> convertVirtualService ingress_config.go:486
                     ConvertHTTPRoute        ingress_config.go:522
                     ApplyRoute (annotations) ingress_config.go:530
                     applyCanaryIngresses    ingress_config.go:536
                     normalizeWeightedCluster ingress_config.go:542
```

`initConfigController` is where the design choice becomes concrete. `NewIngressTranslation` builds the `IngressConfig`-backed store (`pkg/bootstrap/server.go:239`), it is appended to `s.configStores` (`pkg/bootstrap/server.go:242`), `configaggregate.MakeCache` collapses the set into one controller (`pkg/bootstrap/server.go:245`), and it is set as `s.environment.ConfigStore` (`pkg/bootstrap/server.go:252`). After this, Pilot reads translated Istio config through the same interface it uses for user-applied config.

`IngressConfig.List` refuses any GVK outside the six it produces (`pkg/ingress/config/ingress_config.go:289`), then `listFromIngressControllers` collects raw Ingress across clusters and sorts by creation time (`pkg/ingress/config/ingress_config.go:352`, `pkg/ingress/config/ingress_config.go:357`) before branching on the requested type (`pkg/ingress/config/ingress_config.go:361`). Sorting by creation time matters because later Ingress objects can override earlier ones, and canary merging depends on a stable order.

`convertVirtualService` is where an Ingress becomes routing. Per Ingress, `ConvertHTTPRoute` builds the HTTP route (`pkg/ingress/config/ingress_config.go:522`), `annotationHandler.ApplyRoute` layers nginx-compatible annotation behavior onto it (`pkg/ingress/config/ingress_config.go:530`), canary Ingress objects are merged (`pkg/ingress/config/ingress_config.go:536`), and weighted clusters are normalized so weights sum to 100 (`pkg/ingress/config/ingress_config.go:542`).

## Things that surprised me

Higress does not use Istio as an external dependency; it forks Pilot into the tree and injects its own config store. The whole gateway is Istio's control plane with a different front door: `IngressConfig` satisfies `istiomodel.ConfigStoreController` (`pkg/ingress/config/ingress_config.go:79`), so Pilot never learns that its config came from Ingress rather than from Istio CRDs. That reuse is the architecture, and it is why Higress carries a modified Istio under `istio/` instead of importing upstream.

The Wasm plugin request path is small and worth reading. Take `plugins/wasm-go/extensions/request-block/main.go`. `main` is empty (`plugins/wasm-go/extensions/request-block/main.go:32`); registration happens in `init`, which calls `wrapper.SetCtx` with callbacks for config parsing and request phases (`plugins/wasm-go/extensions/request-block/main.go:35`): `ParseConfigBy(parseConfig)` (`main.go:37`), `ProcessRequestHeadersBy(onHttpRequestHeaders)` (`main.go:38`), and `ProcessRequestBodyBy(onHttpRequestBody)` (`main.go:39`). When a request matches a block rule, `onHttpRequestHeaders` (`main.go:131`) returns an immediate response with `proxywasm.SendHttpResponseWithDetail` (`main.go:143`). Config is parsed from JSON with `gjson` (`main.go:54`). This same shape (`SetCtx` plus phase callbacks) is how the `ai-proxy` plugin normalizes 37 LLM providers (registered in `plugins/wasm-go/extensions/ai-proxy/provider/provider.go:224`) to an OpenAI-compatible API.

Service discovery reaches beyond Kubernetes. `registry/` watches Nacos, Consul, Eureka, and ZooKeeper and turns their entries into Istio ServiceEntry, so the same gateway routes to Dubbo-style microservices registered outside the cluster. That is a direct trace of Higress's Alibaba origin, where the RPC stack predates Kubernetes service discovery.

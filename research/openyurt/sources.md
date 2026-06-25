# sources: OpenYurt

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日を添える。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | openyurtio/openyurt (main repo) | <https://github.com/openyurtio/openyurt> | 2026-06-25 |
| 2 | blog | OpenYurt Becomes a CNCF Incubating Project | <https://www.cncf.io/blog/2025/07/02/openyurt-becomes-a-cncf-incubating-project/> | 2026-06-25 |
| 3 | case-study | CNCF project page: OpenYurt | <https://www.cncf.io/projects/openyurt/> | 2026-06-25 |
| 4 | repo | openyurt README (v1.7.0, K8s 1.34, first release date) | <https://github.com/openyurtio/openyurt/blob/master/README.md> | 2026-06-25 |
| 5 | repo | openyurt LICENSE (Apache 2.0) | <https://github.com/openyurtio/openyurt/blob/master/LICENSE> | 2026-06-25 |
| 6 | repo | OpenYurt GitHub org (16 repos) | <https://github.com/openyurtio> | 2026-06-25 |
| 7 | spec | OpenYurt docs: YurtHub core concept | <https://openyurt.io/docs/next/core-concepts/yurthub> | 2026-06-25 |
| 8 | spec | OpenYurt docs: installation summary | <https://openyurt.io/docs/installation/summary> | 2026-06-25 |
| 9 | repo | alt: KubeEdge | <https://kubeedge.io> | 2026-06-25 |
| 10 | repo | gh repo view openyurtio/openyurt (stars 1968 / forks 427 / Go / apache-2.0) | <https://github.com/openyurtio/openyurt> | 2026-06-25 |

## コード anchor (pinned commit `f01cbf5655383d1c695cfb72097827bc9d22fb8b`)

- entrypoint: `cmd/yurthub/yurthub.go:27`
- start/Run: `cmd/yurthub/app/start.go:94`, `:128`, `:172`, `:184`
- proxy ServeHTTP: `pkg/yurthub/proxy/proxy.go:149`, default backend/local `:212-220`, leader hub `:171-189`
- cache on response: `pkg/yurthub/proxy/remote/loadbalancer.go:352` (modifyResponse), `:431` (cacheResponse), `:333` (errorHandler)
- tee reader: `pkg/yurthub/util/util.go:284` (NewDualReadCloser), `:295-336` (dualReadCloser)
- cache manager: `pkg/yurthub/cachemanager/cache_manager.go:112` (CacheResponse), `:140` (QueryCache)
- storage key: `pkg/yurthub/storage/key.go:25` (KeyBuildInfo), `pkg/yurthub/storage/disk/key.go:47` (KeyFunc), `pkg/yurthub/storage/store.go:31` (Store)
- CRDs: `pkg/apis/apps/v1beta2/nodepool_types.go:24,42`, `pkg/apis/raven/v1beta1/gateway_types.go:64`
- pool-scope defaults: `cmd/yurthub/app/options/options.go:126-129`

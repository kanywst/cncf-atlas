# sources: Dapr

各出典に番号を振り、ドキュメント側の引用と対応させる。参照日はすべて 2026-06-22。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | dapr/dapr (pinned `9f2dcfd95ad44178d9553a08c181b0e6ea46232a`) | <https://github.com/dapr/dapr> | 2026-06-22 |
| 2 | repo | dapr/community ADOPTERS.md | <https://github.com/dapr/community/blob/master/ADOPTERS.md> | 2026-06-22 |
| 3 | cncf | Cloud Native Computing Foundation Announces Dapr Graduation | <https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-dapr-graduation/> | 2026-06-22 |
| 4 | cncf | Dapr project page (CNCF) | <https://www.cncf.io/projects/dapr/> | 2026-06-22 |
| 5 | cncf | Dapr joins CNCF Incubator (2021-11-03) | <https://www.cncf.io/blog/2021/11/03/dapr-distributed-application-runtime-joins-cncf-incubator/> | 2026-06-22 |
| 6 | blog | How Dapr has grown since its announcement (Microsoft Open Source Blog, 2020-04-29) | <https://cloudblogs.microsoft.com/opensource/2020/04/29/distributed-application-runtime-dapr-growth-community-update/> | 2026-06-22 |
| 7 | news | Microsoft's Dapr open-source project hits 1.0 (TechCrunch, 2021-02-17) | <https://techcrunch.com/2021/02/17/microsofts-dapr-open-source-project-hits-1-0/> | 2026-06-22 |
| 8 | case-study | How Grafana used Dapr to improve vulnerability scans (CNCF) | <https://www.cncf.io/case-studies/grafana/> | 2026-06-22 |
| 9 | docs | Dapr and service meshes (Dapr Docs FAQ) | <https://docs.dapr.io/concepts/faq/service-mesh/> | 2026-06-22 |
| 10 | wiki | Dapr (Wikipedia) | <https://en.wikipedia.org/wiki/Dapr> | 2026-06-22 |
| 11 | site | Dapr official site / testimonials | <https://dapr.io/testimonials/> | 2026-06-22 |
| 12 | cncf | 2025 State of Dapr Report | <https://www.cncf.io/announcements/2025/04/01/cloud-native-computing-foundation-releases-2025-state-of-dapr-report-highlighting-adoption-trends-and-ai-innovations/> | 2026-06-22 |

## コード上の主要アンカー (repo `dapr/dapr`)

- `cmd/daprd/main.go:25` — エントリポイント (`app.Run()`)
- `cmd/daprd/app/app.go:56` — ランタイム起動
- `pkg/runtime/runtime.go:102` — `DaprRuntime` 構造体
- `pkg/runtime/compstore/compstore.go:42` — `ComponentStore`
- `pkg/api/http/directmessaging.go:97` — HTTP `onDirectMessage`
- `pkg/messaging/direct_messaging.go:163` — `directMessaging.Invoke`
- `pkg/messaging/direct_messaging.go:311` — `invokeRemote`
- `pkg/api/grpc/daprinternal.go:44` — `CallLocal` (受信側)
- `pkg/messaging/method/normalize.go:46` — `NormalizeMethod`
- `pkg/messaging/v1/invoke_method_request.go:37` — `InvokeMethodRequest`

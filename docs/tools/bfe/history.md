# History

## Origin

BFE (Beyond Front End) began as an internal traffic platform at Baidu. Work on the platform started around 2012 to handle the company's incoming web traffic. By the end of 2020 it forwarded on the order of a trillion requests per day, peaking above ten million requests per second (README overview, source [2]).

The piece that became this open-source project is the forwarding engine: the data-plane process that actually proxies HTTP. Baidu published the engine on GitHub in July 2019 (the repository's `created_at` is 2019-07-31, source [3]). The design rationale is documented at book length in baidu/bfe-book, available in both English and Chinese, which is the primary source for the project's design thinking (source [4]).

## Timeline

| Year | Milestone |
| --- | --- |
| 2012 | Baidu starts building the internal BFE traffic platform (source [2]) |
| 2019 | Forwarding engine open-sourced on GitHub (source [3]) |
| 2020 | Accepted into the CNCF Sandbox on 2020-06-25 (source [1]) |
| 2020 | Engine forwards roughly a trillion requests per day at peak above 10M req/s (source [2]) |
| 2026 | v1.8.2 released on 2026-05-08 (source [3]) |

## How it evolved

The repository is the data plane only. Over time the project split configuration management into separate control-plane repositories under the same organisation: API-Server, Conf-Agent, and Dashboard, plus ingress-bfe for Kubernetes (source [7]). This keeps the forwarding engine focused on traffic and lets configuration be generated, validated, and pushed by other components.

The engine's feature surface grew through its module system. The repository ships 30 built-in modules under `bfe_modules/`, covering access logging, rewriting, blocking, several authentication schemes, compression, tracing, and a WebAssembly plugin host (`mod_wasmplugin`). New capabilities tend to arrive as modules rather than changes to the core forwarding loop.

The load balancer also gained an integration point for Envoy's external processing: the GSLB (Global Server Load Balance) layer can run in an EPP mode that calls an external processor, importing Envoy's `go-control-plane` types (`bfe_balance/bal_gslb/bal_gslb.go:39`).

## Where it stands now

BFE remains a CNCF Sandbox project. As of the documented commit the version is v1.8.2, released 2026-05-08 (source [3]). Development happens on the `develop` branch; the documented commit `d8d6dcb` sits just after the v1.8.2 release. The data plane and the control-plane repositories continue to be maintained separately under the bfenetworks organisation (source [7]).

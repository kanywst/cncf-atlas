# sources: BFE

各出典に番号を振り、recon / ドキュメント側の引用と対応させる。アクセス日は 2026-06-26。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | case-study / project page | BFE on CNCF (maturity: Sandbox, accepted 2020-06-25) | <https://www.cncf.io/projects/bfe/> | 2026-06-26 |
| 2 | repo | bfenetworks/bfe README (overview, features, components) | <https://github.com/bfenetworks/bfe> | 2026-06-26 |
| 3 | repo / api | GitHub API repos/bfenetworks/bfe (stars 6249, forks 942, created 2019-07-31, v1.8.2 published 2026-05-08) | <https://api.github.com/repos/bfenetworks/bfe> | 2026-06-26 |
| 4 | book | baidu/bfe-book: In-depth Understanding of BFE | <https://github.com/baidu/bfe-book> | 2026-06-26 |
| 5 | blog | 4 Service Proxy Projects From CNCF (Cloud Native Now) | <https://cloudnativenow.com/features/4-service-proxy-projects-from-cncf/> | 2026-06-26 |
| 6 | repo | bfenetworks/bfe ADOPTERS.md | <https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md> | 2026-06-26 |
| 7 | repo | bfenetworks org (api-server, conf-agent, dashboard, ingress-bfe) | <https://github.com/bfenetworks> | 2026-06-26 |
| 8 | docs | bfe overview (data plane / control plane) | <https://github.com/bfenetworks/bfe/blob/develop/docs/en_us/introduction/overview.md> | 2026-06-26 |

## ローカルで確認した一次情報 (src)

- pinned commit `d8d6dcb5c49e586f19b433acfee57fb57412ea7a`、`VERSION` = `1.8.2`、`LICENSE` = Apache 2.0、`go.mod` = `go 1.22`。
- 主要な path:line は recon.md に記載 (`bfe.go:52`, `bfe_server/reverseproxy.go:663`, `bfe_route/host_table.go:41/114/141`, `bfe_basic/condition/build.go:29`, `bfe_balance/bal_gslb/bal_gslb.go:48`, `bfe_balance/bal_slb/bal_rr.go:251`, `bfe_module/bfe_callback.go:33-41` 等)。

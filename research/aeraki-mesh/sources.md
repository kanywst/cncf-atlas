# sources: Aeraki Mesh

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日は 2026-06-26。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | aeraki-mesh/aeraki (main repo, README) | <https://github.com/aeraki-mesh/aeraki> | 2026-06-26 |
| 2 | case-study / blog | CNCF project page: Aeraki Mesh | <https://www.cncf.io/projects/aeraki-mesh/> | 2026-06-26 |
| 3 | blog | Aeraki Mesh 正式成为 CNCF 沙箱项目 (2022-06-17) | <https://www.zhaohuabing.com/post/2022-06-17-aeraki-mesh-cncf-sandbox/> | 2026-06-26 |
| 4 | blog | Aeraki Mesh 紹介 (作者ブログ, 2021-09-27) | <https://www.zhaohuabing.com/post/2021-09-27-aeraki/> | 2026-06-26 |
| 5 | talk | IstioCon 2022: Tencent Music's service mesh practice with Istio and Aeraki | <https://events.istio.io/istiocon-2022/sessions/tencent-music-aeraki/> | 2026-06-26 |
| 6 | blog | IstioCon 2022 分享: Tencent Music (作者ブログ, 2022-04-26) | <https://www.zhaohuabing.com/post/2022-04-26-aeraki-tencent-music-istiocon2022/> | 2026-06-26 |
| 7 | docs | Aeraki Mesh install guide (v1.x) | <https://www.aeraki.net/docs/v1.x/install/> | 2026-06-26 |
| 8 | docs | Aeraki Mesh quickstart (v1.x) | <https://www.aeraki.net/docs/v1.x/quickstart/> | 2026-06-26 |
| 9 | repo | data plane: aeraki-mesh/meta-protocol-proxy | <https://github.com/aeraki-mesh/meta-protocol-proxy> | 2026-06-26 |
| 10 | repo | adopters collection issue #105 | <https://github.com/aeraki-mesh/aeraki/issues/105> | 2026-06-26 |
| 11 | website | Aeraki Mesh project site | <https://www.aeraki.net/> | 2026-06-26 |
| 12 | landscape | CNCF Landscape: Aeraki Mesh | <https://landscape.cncf.io/?selected=aeraki-mesh> | 2026-06-26 |

## GitHub シグナル (GitHub API, 2026-06-26)

- stars 761 / forks 141 / open issues 21 / contributors 約 34 (非匿名) / 最終 push 2025-12-05 / archived=false / license `Apache-2.0` / created 2020-11-05。

## コード上の主要アンカー (commit 56e4de0)

| 主張 | path:line |
| --- | --- |
| main エントリ | `cmd/aeraki/main.go:48` |
| ジェネレータ登録 | `cmd/aeraki/main.go:145-152` |
| サーバ構築 | `internal/bootstrap/server.go:103` |
| VIP 単一 controller の理由 | `internal/bootstrap/server.go:296-302` |
| EnvoyFilter 生成 reconcile | `internal/envoyfilter/controller.go:128-180` |
| ServiceEntry 走査 + プロトコル判定 | `internal/envoyfilter/controller.go:200-246` |
| Generator interface | `internal/envoyfilter/generator.go:22-24` |
| NETWORK_FILTER REPLACE パッチ | `internal/envoyfilter/network_filter.go:45-114` |
| RDS gRPC サーバ | `internal/xds/server.go:52-87` |
| RDS ルート生成 | `internal/xds/cache_mgr.go:115-229` |
| データ構造 | `internal/model/config.go:52-80`, `internal/model/protocol/instance.go:22-43` |

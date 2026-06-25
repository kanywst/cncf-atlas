# sources: Contour

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日は 2026-06-24。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | projectcontour/contour (GitHub) | <https://github.com/projectcontour/contour> | 2026-06-24 |
| 2 | repo | pinned commit `8f970f0` (`main`, ローカル clone) | <https://github.com/projectcontour/contour/commit/8f970f082e645bf0be5119c376ac4f4d40a19acd> | 2026-06-24 |
| 3 | site | Contour 公式サイト | <https://projectcontour.io/> | 2026-06-24 |
| 4 | site | Getting Started (install / quickstart) | <https://projectcontour.io/getting-started/> | 2026-06-24 |
| 5 | site | Contour Adopters | <https://projectcontour.io/resources/adopters/> | 2026-06-24 |
| 6 | blog | TOC accepts Contour as Incubating project (CNCF) | <https://www.cncf.io/blog/2020/07/07/toc-accepts-contour-as-incubating-project/> | 2026-06-24 |
| 7 | repo | Donate Contour to CNCF (cncf/toc PR #330) | <https://github.com/cncf/toc/pull/330> | 2026-06-24 |
| 8 | repo | cncf/foundation project-maintainers.csv | <https://github.com/cncf/foundation/blob/main/project-maintainers.csv> | 2026-06-24 |
| 9 | repo | CONTRIBUTING.md (governance / proposal process 参照) | <https://github.com/projectcontour/contour/blob/main/CONTRIBUTING.md> | 2026-06-24 |
| 10 | repo | LICENSE (Apache-2.0) | <https://github.com/projectcontour/contour/blob/main/LICENSE> | 2026-06-24 |
| 11 | api | `gh api repos/projectcontour/contour` (stars/forks/license/created) | <https://api.github.com/repos/projectcontour/contour> | 2026-06-24 |
| 12 | site | Ingress / HTTPProxy / Gateway API config docs | <https://projectcontour.io/docs/main/> | 2026-06-24 |

## コード上の主要アンカー (pinned commit)

| 領域 | パス | 行 |
| --- | --- | --- |
| main エントリ | `cmd/contour/contour.go` | 30 |
| serve / doServe | `cmd/contour/serve.go` | 384 |
| xDS gRPC 登録 | `cmd/contour/serve.go` | 905-906 |
| DAG builder 構築 | `cmd/contour/serve.go` | 1087-1167 |
| EventHandler | `internal/contour/handler.go` | 45-244 |
| onUpdate | `internal/contour/handler.go` | 249-286 |
| Builder.Build | `internal/dag/builder.go` | 59-127 |
| DAG 構造体 | `internal/dag/dag.go` | 60 |
| Route 構造体 | `internal/dag/dag.go` | 307 |
| RouteCache.OnChange | `internal/xdscache/v3/route.go` | 62-142 |
| SnapshotHandler | `internal/xdscache/v3/snapshot.go` | 35-163 |
| ConstantHash | `internal/xds/v3/hash.go` | 23-36 |
| RegisterServer | `internal/xds/v3/server.go` | 38-40 |
| ビルドコマンド | `Makefile` | 111-112 |
| 依存バージョン | `versions.yaml` | metadata/versions |

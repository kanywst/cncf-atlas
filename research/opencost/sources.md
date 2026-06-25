# sources: OpenCost

各出典に番号を振り、`recon.md` の `(出典N)` と対応。アクセス日は 2026-06-24。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | blog | OpenCost Advances to CNCF Incubation (公式) | <https://opencost.io/blog/cncf-incubation/> | 2026-06-24 |
| 2 | blog | Apptio: Celebrating OpenCost's Journey to CNCF Incubation | <https://www.apptio.com/blog/opencost-cncf-incubation/> | 2026-06-24 |
| 3 | blog | CNCF: OpenCost, a new CNCF Sandbox Project (2022-12-06) | <https://www.cncf.io/blog/2022/12/06/opencost-a-new-cncf-sandbox-project-for-real-time-kubernetes-cost-monitoring/> | 2026-06-24 |
| 4 | blog | CNCF: OpenCost advances to the CNCF Incubator (2024-10-31) | <https://www.cncf.io/blog/2024/10/31/opencost-advances-to-the-cncf-incubator/> | 2026-06-24 |
| 5 | project-page | CNCF Projects: OpenCost (受理日/昇格日) | <https://www.cncf.io/projects/opencost/> | 2026-06-24 |
| 6 | blog | Introducing OpenCost (公式, 仕様と発起企業) | <https://opencost.io/blog/introducing-opencost/> | 2026-06-24 |
| 7 | repo-api | GitHub API repos/opencost/opencost (star/fork/license/created) | <https://github.com/opencost/opencost> | 2026-06-24 |
| 8 | repo | ADOPTERS.MD @ commit 4d117aa | <https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD> | 2026-06-24 |
| 9 | blog | Grafana Labs: How Grafana Labs uses and contributes to OpenCost | <https://grafana.com/blog/2023/02/02/how-grafana-labs-uses-and-contributes-to-opencost-the-open-source-project-for-real-time-cost-monitoring-in-kubernetes/> | 2026-06-24 |
| 10 | repo | README.md / CLAUDE.md @ commit 4d117aa (install, API, env) | <https://github.com/opencost/opencost/blob/develop/README.md> | 2026-06-24 |
| 11 | docs | OpenCost Documentation (install / Prometheus / UI) | <https://www.opencost.io/docs/> | 2026-06-24 |

## コード出典 (pin commit `4d117aabe116695ddd11100497827983b1892959`)

- entrypoint: `cmd/costmodel/main.go:11`
- route 登録: `pkg/cmd/costmodel/costmodel.go:33,55`
- handler: `pkg/costmodel/aggregation.go:330`
- compute: `pkg/costmodel/allocation.go:32,219`
- datasource 抽象: `core/pkg/source/datasource.go:11,49`
- Prometheus 実装: `modules/prometheus-source/pkg/prom/metricsquerier.go:525`
- 中核型: `core/pkg/opencost/allocation.go:55`, `asset.go:31`, `cloudcost.go:14`, `window.go:75`
- bingen: `core/pkg/opencost/bingen.go`

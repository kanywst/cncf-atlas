# sources: eraser

各出典に番号を振り、recon / ドキュメント側の引用 (S1 形式) と対応させる。参照日は 2026-07-08。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| S1 | repo | eraser-dev/eraser README (Apache-2.0, Trivy, quick start) | <https://github.com/eraser-dev/eraser> | 2026-07-08 |
| S2 | case-study | Eraser project page (CNCF, Sandbox) | <https://www.cncf.io/projects/eraser/> | 2026-07-08 |
| S3 | repo | gh repo view eraser-dev/eraser (stars 611 / forks 71 / created 2021-05-28 / pushed 2026-04-09) | <https://github.com/eraser-dev/eraser> | 2026-07-08 |
| S4 | proposal | [Sandbox] Eraser (cncf/sandbox issue #24, 申請文・community ownership・plugin 主張) | <https://github.com/cncf/sandbox/issues/24> | 2026-07-08 |
| S5 | talk | Eraser: Cleaning up Vulnerable Images from Kubernetes Nodes (KubeCon NA 2023, sched) | <https://kccncna2023.sched.com/event/1R2q9/> | 2026-07-08 |
| S6 | talk | 同上 (container-security talks アーカイブ、Peter Engelbert & Ashna Mehrotra) | <https://talks.container-security.site/kubecon%20+%20cloudnative%20north%20america%202023/Eraser-Cleaning-up-Vulnerable-Images-from-Kuberne/> | 2026-07-08 |
| S7 | video | Cleaning Your Kubernetes Clusters (Open at Microsoft) | <https://learn.microsoft.com/en-us/shows/open-at-microsoft/cleaning-your-kubernetes-clusters> | 2026-07-08 |
| S9 | case-study | Use Image Cleaner on Azure Kubernetes Service (AKS)、Eraser 内部利用 | <https://learn.microsoft.com/en-us/azure/aks/image-cleaner> | 2026-07-08 |

## 補足 (コード出典、pinned commit 20576a24)

- CRD 型: `api/v1/imagelist_types.go`, `api/v1/imagejob_types.go`
- imagelist reconcile: `controllers/imagelist/imagelist_controller.go`
- imagejob fan-out: `controllers/imagejob/imagejob_controller.go`
- scan ジョブ生成: `controllers/imagecollector/imagecollector_controller.go`
- 削除ロジック: `pkg/remover/remover.go`, `pkg/remover/helpers.go`
- 実行中/非実行判定: `pkg/utils/utils.go:129-170`
- CRI クライアント: `pkg/cri/client.go`
- スキャナ interface: `pkg/scanners/template/scanner_template.go`

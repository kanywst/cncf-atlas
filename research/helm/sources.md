# sources: Helm

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日は 2026-06-22。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | helm/helm (source, pinned `74fa4fce`) | <https://github.com/helm/helm> | 2026-06-22 |
| 2 | docs | The History of the Project (Helm) | <https://helm.sh/community/history/> | 2026-06-22 |
| 3 | blog | Helm 3 Preview pt1: A History of Helm | <https://helm.sh/blog/helm-3-preview-pt1/> | 2026-06-22 |
| 4 | announcement | CNCF Announces Helm Graduation | <https://www.cncf.io/announcements/2020/04/30/cloud-native-computing-foundation-announces-helm-graduation/> | 2026-06-22 |
| 5 | blog | Helm now a CNCF graduated project (Microsoft OSS) | <https://opensource.microsoft.com/blog/2020/05/01/helm-package-manager-kubernetes-now-cncf-graduated-project> | 2026-06-22 |
| 6 | blog | Helm 3 Preview: Alpha release and what's next (CNCF) | <https://www.cncf.io/blog/2019/05/16/helm-3-preview-helm-3-alpha-release-available-and-whats-next/> | 2026-06-22 |
| 7 | docs | Helm installation guide | <https://helm.sh/docs/intro/install/> | 2026-06-22 |
| 8 | comparison | Timoni: Compared to other tools | <https://timoni.sh/comparison/> | 2026-06-22 |
| 9 | blog | Introducing Timoni (Stefan Prodan) | <https://medium.com/@stefanprodan/introducing-timoni-next-gen-package-manager-for-kubernetes-29df39683000> | 2026-06-22 |
| 10 | article | Kustomize vs. Helm: What's the Difference? (IBM) | <https://www.ibm.com/think/insights/kustomize-vs-helm> | 2026-06-22 |
| 11 | article | Kustomize vs Helm (Spacelift) | <https://spacelift.io/blog/kustomize-vs-helm> | 2026-06-22 |
| 12 | article | Top 13 deployment & templating tools (Glasskube) | <https://dev.to/glasskube/our-top-13-deployment-templating-tools-for-kubernetes-4mei> | 2026-06-22 |
| 13 | article | What is Helm in Kubernetes? (IBM) | <https://www.ibm.com/think/topics/helm> | 2026-06-22 |
| 14 | repo-file | ADOPTERS.md (helm/helm) | <https://github.com/helm/helm/blob/main/ADOPTERS.md> | 2026-06-22 |

## コード上のアンカー (path:line)

- main entrypoint: `cmd/helm/helm.go:35`
- install CLI: `pkg/cmd/install.go:132` / `:159` / `:347`
- install action: `pkg/action/install.go:284` 以下 (296/308/313/352/366/375/378/394/415/423/465/472)
- renderResources: `pkg/action/action.go:279`
- engine: `pkg/engine/engine.go:82` / `:285` / `:190` / renderable `:137`
- Release struct: `pkg/release/v1/release.go:30`
- Chart struct: `pkg/chart/v2/chart.go:38`
- Driver interface: `pkg/storage/driver/driver.go:99`
- secret driver default: `pkg/action/action.go:675`、encode `pkg/storage/driver/util.go:38`、type `pkg/storage/driver/secrets.go:284`
- build: `Makefile:70`、`go.mod` (go 1.26.0)

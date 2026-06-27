# sources: clusterpedia

各出典に番号を振り、ドキュメント側の引用と対応させる。参照日はすべて 2026-06-27 (コード anchor は pinned commit `bece343b72527405e1a3ff86aca449e7ed9fe3d9`)。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | clusterpedia-io/clusterpedia (README, code) | <https://github.com/clusterpedia-io/clusterpedia> | 2026-06-27 |
| 2 | repo | README.md (main) | <https://github.com/clusterpedia-io/clusterpedia/blob/main/README.md> | 2026-06-27 |
| 3 | case-study/site | CNCF project page (Sandbox, 2022-06-17 acceptance) | <https://www.cncf.io/projects/clusterpedia/> | 2026-06-27 |
| 4 | blog | Demo Video: Complex Retrieval of Resources in a Multi-Cloud Environment | <https://clusterpedia.io/blog/2022/03/01/demo-video-clusterpedia-complex-retrieval-of-resources-in-a-multi-cloud-environment/> | 2026-06-27 |
| 5 | docs | DaoCloud community docs: Clusterpedia | <https://docs.daocloud.io/en/community/clusterpedia> | 2026-06-27 |
| 6 | blog | CNCF: Karmada and Open Cluster Management | <https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/> | 2026-06-27 |
| 7 | blog | Quickly Deploy Clusterpedia with Helm | <https://clusterpedia.io/blog/2022/04/11/quickly-deploy-clusterpedia-with-helm/> | 2026-06-27 |
| 8 | docs | Clusterpedia Installation | <https://clusterpedia.io/docs/installation/> | 2026-06-27 |
| 9 | docs | Clusterpedia Import Clusters | <https://clusterpedia.io/docs/usage/import-clusters/> | 2026-06-27 |
| 10 | docs | Clusterpedia Sync Cluster Resources | <https://clusterpedia.io/docs/usage/sync-resources/> | 2026-06-27 |
| 11 | repo | clusterpedia-io/clusterpedia-helm (chart) | <https://github.com/clusterpedia-io/clusterpedia-helm> | 2026-06-27 |
| 12 | api | GitHub REST API repo metadata (stars/forks/contributors) | <https://api.github.com/repos/clusterpedia-io/clusterpedia> | 2026-06-27 |

## 確定済みの数値・事実 (参照日 2026-06-27)

- Stars 878 / Forks 126 / Open issues 65 / Contributors 41 (`gh api`)。
- ライセンス Apache-2.0 (`LICENSE` + `gh api` の `spdx_id`)。
- repo 作成 2021-10-08、最終 push 2026-06-18。
- 最新安定タグ v0.9.1 (2026-04-16 release)。pinned HEAD はそれより先の main commit。
- CNCF Sandbox 受理日 2022-06-17 (出典 #3)。
- Maintainer 3名 (`MAINTAINERS.md`): @calvin0327 (DaoCloud), @Iceber (DaoCloud), @wuyingjun-lucky (China Mobile Cloud)。

## 未確認 / 保留

- 裏取り可能な named adopter は未発見。ADOPTERS ファイル無し。ドキュメントでも顧客名の明示なし。捏造しない。
- helm chart の正式な `helm repo add` ホスト URL は公式手順が git clone 方式を案内しており、ホスト型 repo URL は未確定。getting-started では git clone + `helm dependency build` 経路を採る。

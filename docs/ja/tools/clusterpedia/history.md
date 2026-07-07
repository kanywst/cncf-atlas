# 歴史

## 起源

Clusterpedia は DaoCloud が作り、2021 年末に OSS 化した。GitHub リポジトリの作成は 2021-10-08。創始 sponsor は DaoCloud の Iceber Gu (Cai Wei) で、現在もメンテナを務める。背景は [Clusterpedia.io ブログ](https://clusterpedia.io/blog/2022/03/01/demo-video-clusterpedia-complex-retrieval-of-resources-in-a-multi-cloud-environment/) と [DaoCloud community docs](https://docs.daocloud.io/en/community/clusterpedia) に書かれている。

解こうとした課題はこうだ。多数の Kubernetes クラスタを運用すると、全クラスタの資源を横断検索できる場所が 1 つもない。各クラスタは自前の apiserver と etcd を持つので、「fleet 全体の Deployment を見せて」という問いは各クラスタを順に叩くことを意味する。名前は Wikipedia をもじったもので、クラスタ状態の検索可能な百科事典という発想を表している ([README](https://github.com/clusterpedia-io/clusterpedia/blob/main/README.md))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | リポジトリ作成 (2021-10-08)、DaoCloud が OSS 化 |
| 2022 | 2022-06-17 に CNCF Sandbox 受理 ([CNCF プロジェクトページ](https://www.cncf.io/projects/clusterpedia/)) |
| 2026 | v0.9.1 リリース (2026-04-16)。pinned commit `bece343` はそのタグより先の main 上 |

## どう進化したか

Clusterpedia は 2022-06-17 に CNCF Sandbox に入り、より広いマルチクラスタの文脈に位置づけられた。KubeFed の EOL 後、マルチクラスタ管理の空白は 2 つの角度から埋められた。Karmada が orchestration を、Open Cluster Management が fleet ガバナンスを担い、Clusterpedia は資源状態の検索と observability を担った。[Karmada と Open Cluster Management に関する CNCF ブログ](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/) はこれらを競合ではなく補完として整理している。

コードベースは 4 バイナリ構成 (`apiserver`・`binding-apiserver`・`clustersynchro-manager`・`controller-manager`) に落ち着き、`make all` でビルドする (`Makefile:21`)。ストレージ層はプラガブルで、裏の DB を差し替えられる。デフォルトのストレージ層は MySQL と PostgreSQL に対応し、README には将来 graph database 層と Elasticsearch 層を足す意図が書かれている。

## 現在地

最新の安定タグは v0.9.1 (2026-04-16 リリース)。さらに Kubernetes バージョン追従タグ (例 `v0.9.1-k8s1.32.13`) を切り、Aggregated API をホスト Kubernetes バージョンに合わせる運用をしている。ガバナンスは Member / Reviewer / Approver / Maintainer の role 階層を OWNERS ファイルで定義する (`GOVERNANCE.md`)。メンテナは 3 名 (`MAINTAINERS.md`): Calvin Chen (@calvin0327, DaoCloud)、Iceber Gu (@Iceber, DaoCloud)、wuyingjun (@wuyingjun-lucky, China Mobile Cloud)。開発は活発で、最終 push は 2026-06-18 に観測された。

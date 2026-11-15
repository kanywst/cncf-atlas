# 歴史

## 起源

OCM はもともと IBM と Red Hat が開発した ([CNCF ブログ, 2026-11-10](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/))。Red Hat Advanced Cluster Management for Kubernetes (RHACM) のオープンソース upstream で、Red Hat は adopters ファイルに、founding member として OCM を RHACM の基盤コンポーネントに使っていると書いている ([ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md))。

解こうとした課題は README に書かれている。クラスタを 1 つしか持たない人はいないし、多数のベンダーにまたがる多様なクラスタ群の管理は簡単であるべきだ、というもの。目標は "multicluster everything" で、Kubernetes SIG Multicluster と揃えたベンダー中立な API を掲げる ([README](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/README.md))。

コードはコンポーネントごとに別々のリポジトリから始まった。`registration` リポジトリの Initial commit は 2020-03-30 ([commit](https://github.com/open-cluster-management-io/registration/commit/b3484a7ee6))。`api` リポジトリは 2020-03-11、`work` は 2020-04-16、`registration-operator` は 2020-04-27、`addon-framework` は 2020-08-24、`placement` は 2021-04-22、CLI の `clusteradm` は 2021-05-20 に作られた ([GitHub API, organization repositories](https://api.github.com/orgs/open-cluster-management-io/repos))。

## 年表

| 日付 | マイルストーン |
| --- | --- |
| 2020-03 | `api` と `registration` のリポジトリ作成。work、operator、add-on フレームワークも 2020 年中に続く。 |
| 2021-04 | `placement` リポジトリ作成。 |
| 2021-11-09 | CNCF Sandbox に採択 ([CNCF](https://www.cncf.io/projects/open-cluster-management/), [cncf/sandbox#227](https://github.com/cncf/sandbox/issues/227))。 |
| 2022-10 | CNCF のアップデート記事が 70 人超・15 社超のコントリビュータを報告し、KubeFed のアーカイブ後の後継と位置づける ([CNCF ブログ](https://www.cncf.io/blog/2022/10/31/open-cluster-management-november-2022-update/))。 |
| 2023-05-25 | registration、work、placement、registration-operator を 1 つの `ocm` リポジトリに統合 ([merge commit](https://github.com/open-cluster-management-io/ocm/commit/d49263f7e6))。 |
| 2023-09-18 | 統合後のリポジトリからの最初のリリース `v0.11.0` ([releases](https://github.com/open-cluster-management-io/ocm/releases))。 |
| 2025-06-16 | `v1.0.0`: CEL ベースのクラスタ選択と、Argo CD の pull モデル add-on。 |
| 2025-09-17 | Incubation 申請を開始 ([cncf/toc#1884](https://github.com/cncf/toc/issues/1884))。 |
| 2025-10-22 | `v1.1.0`: gRPC ベースの hub と spoke の接続、Kueue MultiKueue と OpenTelemetry の add-on。 |
| 2026-01-30 | `v1.2.0`: Placement の高度な設定、hosting cluster の自動解決、argocd-agent 連携。 |
| 2026-05-09 | `v1.3.0`: ManifestWork のリソース適用順序、AddOnTemplate API が v1beta1 に。 |
| 2026-10-07 | `v1.4.0`: PlacementDecision を SIG Multicluster の PlacementDecision API に同期、ManifestWork の apply メトリクスとログ、NetworkPolicy。 |
| 2026-11-04 | TOC 投票が締まり、Incubating に移行 ([cncf/toc#2360](https://github.com/cncf/toc/issues/2360))。 |

リリース日は GitHub の releases ページから。1.0 から 1.4 の機能概要は CNCF の Incubation 発表による ([CNCF ブログ, 2026-11-10](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/))。

## どう進化したか

初期の設計では関心ごとに別リポジトリと別リリースを持っていた (registration、work、placement、operator)。2023 年 5 月、メンテナは `consolidate-code-from-0.11.0` というブランチで中核の 4 リポジトリを `ocm` に取り込み、古いリポジトリをアーカイブした ([merge commit](https://github.com/open-cluster-management-io/ocm/commit/d49263f7e6), [GitHub API, organization repositories](https://api.github.com/orgs/open-cluster-management-io/repos))。API 型と add-on フレームワークは今も別リポジトリにあり、`ocm` には `vendor/open-cluster-management.io/` として vendor されている。

後半のリリースには 2 本の流れがある。1 本目は転送経路。既定は今も hub の kube-apiserver (`pkg/work/spoke/options.go:40`) だが、work エージェントは ManifestWork の取得元として MQTT、gRPC、Kafka も受け付けるようになった (`pkg/work/spoke/options.go:56-57`)。1.1 では gRPC ベースの hub と spoke (managed cluster) の接続が入り、hub 側の `server` バイナリが受け持つ (`cmd/server/main.go:37-38`)。2 本目は SIG Multicluster との整合。hub はクラスタごとに ClusterProfile (SIG Multicluster のクラスタインベントリのオブジェクト) を公開でき、PlacementDecision を SIG 側の PlacementDecision 型へコピーできる。基準コミット時点ではどちらも alpha の feature gate の後ろにある (`vendor/open-cluster-management.io/api/feature/feature.go:139,150`; [cluster-inventory-api](https://github.com/kubernetes-sigs/cluster-inventory-api))。

## 現在地

基準コミット (`b4e4b23`, 2026-11-13) の時点で、OCM は CNCF Incubating プロジェクトで、最新リリースは `v1.4.0`。そのコミットの README はまだ sandbox project と書いている (`README.md:10`) が、これは level change より前の記述。Incubation 時点で CNCF は、8 組織の 27 メンテナ、16 カ国 84 組織の 537 コントリビュータ、1,370 の pull request を報告している ([CNCF ブログ, 2026-11-10](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/))。2026-11-15 時点で `ocm` リポジトリは 1,133 stars、193 forks ([GitHub API](https://api.github.com/repos/open-cluster-management-io/ocm))。

# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS` ファイルはなく、Clusterpedia を本番運用していると名指しする公開ケーススタディ・トーク・エンジニアリングブログも見つからなかった。採用企業の捏造を避けるため、ここでは個別組織を列挙しない。最も確実な関係は出自とメンテナ構成だ。3 名のメンテナのうち 2 名がプロジェクトを OSS 化した DaoCloud 所属、1 名が China Mobile Cloud 所属である (`MAINTAINERS.md`)。

## 採用のシグナル

[GitHub REST API repo metadata](https://api.github.com/repos/clusterpedia-io/clusterpedia) から計測 (観測日 2026-06-27):

| シグナル | 値 |
| --- | --- |
| Stars | 878 |
| Forks | 126 |
| Contributors | 41 |
| Open issues | 65 |
| リポジトリ作成 | 2021-10-08 |
| 最終 push | 2026-06-18 |

リリース頻度: 最新安定タグは v0.9.1 (2026-04-16)、加えて `v0.9.1-k8s1.32.13` のような Kubernetes バージョン追従タグを切る。プロジェクトは 2022-06-17 に CNCF Sandbox に受理された ([CNCF プロジェクトページ](https://www.cncf.io/projects/clusterpedia/))。

## エコシステム

Clusterpedia はマルチクラスタ基盤を置き換えるのではなく、その上に乗るよう作られている。README によれば、Cluster API・Karmada・Clusternet・vCluster・KubeVela が管理するクラスタを自動 import できる。クラスタ間ネットワークは意図的に他ツールへ委ね、README はその層として Submariner・Skupper・tower を挙げる ([README.md](https://github.com/clusterpedia-io/clusterpedia/blob/main/README.md))。

ストレージ層はプラガブル。デフォルトの `internalstorage` バックエンドは MySQL と PostgreSQL に対応し、README には graph database 層と Elasticsearch 層を足す意図が書かれている。公式 Helm chart は別リポジトリ [clusterpedia-io/clusterpedia-helm](https://github.com/clusterpedia-io/clusterpedia-helm) にあり、Bitnami の PostgreSQL・MySQL subchart を取り込む。

## 代替候補

Clusterpedia はマルチクラスタ管理の検索・observability の隅を占める。下記のツールは隣接する問題を扱うので、勝敗ではなくどの層が必要かで見るのが誠実だ。

| 代替 | 違い |
| --- | --- |
| Karmada | クラスタ横断でワークロードを orchestration / スケジューリングする (配置と federation)。Clusterpedia は資源状態を read / 検索するだけ。競合でなく組合せ ([CNCF ブログ](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/))。 |
| Open Cluster Management | fleet ガバナンスとポリシー配布が主眼。Clusterpedia はその上にクラスタ横断の資源検索を足す。 |
| クラスタ個別の `kubectl` | ベースライン: 各クラスタを別々に問い合わせる。Clusterpedia は中央 DB と引き換えに 1 つの OpenAPI 互換エンドポイントと豊かな検索を得る。 |
| Prometheus / observability スタック | メトリクス・トレース・ログを集約する。Clusterpedia は Kubernetes 資源オブジェクトそのものを集約し `client-go` で問い合わせ可能に保つ。 |

多数のクラスタ (異なる Kubernetes バージョンのクラスタを含む) の資源を 1 つの `kubectl` 互換エンドポイントで検索したいなら Clusterpedia を選ぶ。仕事がワークロードの配置やスケジューリングで検索でないなら、Karmada のような federation ツールを選ぶ。

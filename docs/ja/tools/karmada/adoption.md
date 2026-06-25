# 採用事例・エコシステム

## 誰が使っているか

リポジトリの `ADOPTERS.md` は実名を持たず、公式 adopters ページと issue #4540 へ誘導するだけである。実名採用企業の一次情報は [Karmada Adopters ページ](https://karmada.io/adopters/) で、40 以上の組織が並ぶ。そこから一部を抜粋する (いずれも同ページ出典、参照 2026-06-24):

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Alibaba Cloud | 掲載採用企業 | [karmada.io/adopters](https://karmada.io/adopters/) |
| Bloomberg | 掲載採用企業 | [karmada.io/adopters](https://karmada.io/adopters/) |
| DaoCloud | 掲載採用企業 | [karmada.io/adopters](https://karmada.io/adopters/) |
| Huawei | 掲載採用企業 | [karmada.io/adopters](https://karmada.io/adopters/) |
| iQIYI | 掲載採用企業 | [karmada.io/adopters](https://karmada.io/adopters/) |
| Shopee | 掲載採用企業 | [karmada.io/adopters](https://karmada.io/adopters/) |
| Trip.com | 掲載採用企業 | [karmada.io/adopters](https://karmada.io/adopters/) |
| Vivo | 掲載採用企業 | [karmada.io/adopters](https://karmada.io/adopters/) |
| Wellhub | 掲載採用企業 | [karmada.io/adopters](https://karmada.io/adopters/) |
| ZTO | 掲載採用企業 | [karmada.io/adopters](https://karmada.io/adopters/) |

adopters ページは企業ごとのワークロード詳細を載せていないため、ユースケース欄は掲載採用企業であること以上を意味しない。プロジェクトの起源では共同発起企業として First Automobile Works, ICBC, SPD Bank, Qutoutiao, VIPKid, xiaohongshu も挙げられている ([CNCF blog](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/))。

## 採用のシグナル

- GitHub: 5,503 stars / 1,149 forks / 746 open issues / 71 watchers ([GitHub API](https://api.github.com/repos/karmada-io/karmada), 2026-06-24)。
- コントリビュータ: GitHub API は 307 アカウントを返す (2026-06-24, bot 含む)。2023-12 の incubation 時点で CNCF は 20+ 国・60+ 組織から 500+ contributor、maintainer 7 名と公表しており、両者は数え方が異なり直接比較できない ([CNCF blog](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/))。
- リリース頻度: `v1.18.0` が直近の stable リリース (2026-05-30)、`v1.19.0-alpha.0` が進行中 ([GitHub API](https://api.github.com/repos/karmada-io/karmada))。
- 2025-03 に正式な Adopter Group プログラムが発足 ([CNCF blog](https://www.cncf.io/blog/2025/03/26/karmada-launches-adopter-group/))。

## エコシステム

- **GitOps**: Flux と Argo のインタプリタ customization を同梱し、GitOps 配信ツールと併用できる。
- **クラスタ横断ネットワーク/ディスカバリ**: multi-cluster Service (MCS) でクラスタ横断のサービスディスカバリ。
- **オートスケール**: FederatedHPA と CronFederatedHPA でクラスタ横断スケール。`karmada-metrics-adapter` が支える。
- **クラスタ横断クエリ**: `karmada-search` が全メンバークラスタを横断する検索とキャッシュを提供。
- **CRD ワークロード**: サードパーティインタプリタが Flink, Ray, Kubeflow の CRD をカバーし、ネイティブワークロードと同様に配布・レプリカ分割できる。

## 代替候補

Karmada は Kubernetes ネイティブテンプレートを保ちつつ、独立した propagation/override ポリシーと動的なクラスタ横断スケジューリング/レプリカ分割を足しており、自動化寄りに位置する。Open Cluster Management は placement とポリシー/ガバナンス寄り。Fleet は Git 駆動の配信で progressive rollout は弱い ([CNCF blog, 2022-09-26](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/))。

| 代替 | 違い |
| --- | --- |
| Open Cluster Management | ガバナンス/ポリシー寄り。Red Hat ACM の土台。 |
| Rancher Fleet | ラベルターゲティングの GitOps 配信。progressive rollout は弱い。 |
| Clusternet | CNCF Sandbox のマルチクラスタ管理。スコープは小さめ。 |
| KubeFed | 非推奨の federation v2。Karmada はその後継。 |

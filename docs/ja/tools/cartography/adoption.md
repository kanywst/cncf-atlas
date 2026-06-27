# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS` ファイルは存在しないため、下表に挙げる名指しの利用者は出典を示せるものに限る。この短い表を利用者の全体像と読まないでほしい。あくまで出典のある部分集合である。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Lyft | Cartography を社内で構築し、IAM グラフを通じて管理者権限への攻撃経路を見つけた。後に CNCF へ寄贈 | [Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7) |
| SubImage (YC W25) | Cartography の上に「攻撃者視点」のインフラ製品を構築 | [Launch HN](https://news.ycombinator.com/item?id=43161332) |

## 採用のシグナル

名指しの採用企業が少ないため、GitHub のシグナルの方が良い指標になる。2026-06-26 時点 ([GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography)):

- スター: 3,940
- フォーク: 526
- オープン issue: 106
- 作成: 2019-02-27
- 主要言語: Python
- 最新リリース: `0.138.1` (2026-06-19)

リリースは頻繁で (固定した master コミット `cdf66e2` は `0.138.1` より 6 コミット先行)、メンテナ一覧は MAINTAINERS.md に記録されている。CNCF は 2024-08-23 に Sandbox レベルで受理した ([CNCF project page](https://www.cncf.io/projects/cartography/))。

## エコシステム

Cartography は Neo4j 5 community データベース上で動作し (README.md:36)、AWS (boto3 経由)、GCP、Azure、GitHub、Okta、Kubernetes など 30 以上のプロバイダから SDK と API を通じて取得する (README.md:81-99)。さらに CVE (Common Vulnerabilities and Exposures) データ、Trivy、Syft、Semgrep、Docker Scout などの脆弱性ソースと統合する。同梱の `cartography-rules` コマンドはグラフに対してセキュリティチェックを走らせる (README.md:71-79)。

## 代替候補

Cartography が際立つのは、関係性が一級市民である点だ。資産をグラフとして格納し、Cypher で到達経路を辿れる。トレードオフは Neo4j を運用し Cypher を学ぶ必要があること。SQL ベースのインベントリツールは慣れたツールで照会しやすいが、関係を辿れるグラフではなく join としてモデル化する ([CloudQuery comparison](https://www.cloudquery.io/blog/cloudquery-vs-cloud-asset-inventory-tools))。

| 代替 | 違い |
| --- | --- |
| CloudQuery / Steampipe | SQL ベースのクラウド資産インベントリ。関係はグラフでなく join なので攻撃経路の探索が難しい ([CloudQuery comparison](https://www.cloudquery.io/blog/cloudquery-vs-cloud-asset-inventory-tools))。 |
| Prowler / ScoutSuite | point-in-time のコンプライアンス監査。構成を採点するが、リソース横断の関係グラフは作らない。 |
| AWS Config / Azure Resource Graph / GCP Cloud Asset Inventory | 単一プロバイダにスコープされたクラウドネイティブのインベントリ。マルチクラウド・マルチアカウント横断が弱い。 |

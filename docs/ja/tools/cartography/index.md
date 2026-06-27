# Cartography

> Cartography はクラウドや SaaS の資産と資産どうしの関係を Neo4j グラフに取り込み、露出や到達経路を Cypher でクエリできるようにする。

- **カテゴリ**: Security & Compliance
- **CNCF 成熟度**: Sandbox
- **言語**: Python
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cartography-cncf/cartography](https://github.com/cartography-cncf/cartography)
- **ドキュメント基準コミット**: `cdf66e2` (master, 2026-06-25)

## 何をするものか

Cartography はインフラ資産と資産どうしの関係を [Neo4j](https://www.neo4j.com) グラフデータベースに取り込む Python ツールである (README.md:12)。データがグラフに入ったら、Neo4j のクエリ言語 Cypher でプロバイダ横断の問いを投げる。肝は関係性だ。どの IAM (Identity and Access Management) プリンシパルがどのリソースに到達できるか、どの計算ノードがインターネットに露出しているか、どのアカウントが何を所有しているか、といった問いである。

もともとは Lyft の中で、攻撃者が IAM グラフを通じて管理者権限に到達する最短経路を見つける目的で作られ、後に同じグラフが防御側にも有用だと分かった ([Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7))。CNCF (Cloud Native Computing Foundation) は 2024-08-23 に Sandbox レベルで受理した ([CNCF project page](https://www.cncf.io/projects/cartography/))。

AWS (Amazon Web Services)、GCP (Google Cloud Platform)、Azure、GitHub、Okta、Kubernetes など 30 以上のプロバイダ用コネクタと、脆弱性ソースを備える (README.md:81-99)。各コネクタは同じ形を持つ。プロバイダの API (Application Programming Interface) から取得し、グラフに load し、古いデータを削除する、という流れである。

## いつ使うか

- 複数のクラウドや SaaS にまたがって運用し、横断的な問い (インターネットに露出したホストのうち管理者ロールを引き受けられるのはどれか、など) を 1 箇所で投げたいとき。
- 単なるインベントリ一覧ではなく関係性をモデル化したく、Cypher を学ぶ用意があるとき。
- 時系列で差分を取れるスナップショットが欲しい、またはセキュリティチェックのためにルールエンジンへ渡したいとき。
- 単一アカウントの point-in-time なコンプライアンス採点だけが目的なら不向き。Prowler のような専用監査ツールがグラフ DB なしで答える。
- Neo4j インスタンスを運用できないなら不向き。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと sync の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [cartography-cncf/cartography](https://github.com/cartography-cncf/cartography) (ソース、README、LICENSE、pyproject.toml)、参照 2026-06-26。
2. [Cartography | CNCF project page](https://www.cncf.io/projects/cartography/) (Sandbox、2024-08-23 受理)、参照 2026-06-26。
3. [Cartography joins the CNCF](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7) (Lyft Engineering、歴史と寄贈)、参照 2026-06-26。
4. [Launch HN: SubImage (YC W25)](https://news.ycombinator.com/item?id=43161332) (Cartography 上に構築)、参照 2026-06-26。
5. [CloudQuery vs Cloud Asset Inventory Tools](https://www.cloudquery.io/blog/cloudquery-vs-cloud-asset-inventory-tools) (代替の比較)、参照 2026-06-26。
6. [GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography) (stars、forks、リリース)、参照 2026-06-26。
7. [CNCF Sandbox application issue](https://github.com/cncf/sandbox/issues/58)、参照 2026-06-26。

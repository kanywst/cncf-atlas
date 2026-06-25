# Cloud Custodian

> クラウドリソースを照会し、フィルタで絞り込み、タグ付け・停止・削除などのアクションを実行する YAML ポリシーエンジン。ガバナンスルールを場当たり的なスクリプトではなくコードとして管理する。

- **カテゴリ**: Security & Compliance
- **CNCF 成熟度**: Incubating
- **言語**: Python
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cloud-custodian/cloud-custodian](https://github.com/cloud-custodian/cloud-custodian)
- **ドキュメント基準コミット**: `3d8a562` (0.9.51 系, 2026-06-22)

## 何をするものか

Cloud Custodian (パッケージと CLI の名前は `c7n`) はクラウドガバナンスのためのルールエンジンである。ポリシーは YAML で書く。各ポリシーは対象の `resource` 型、集合を絞り込む `filters` のリスト、残ったものに実行する `actions` のリストを持つ。CLI コマンド `custodian run` がポリシーをクラウドアカウントに対して評価し、マッチした内容のレポートを書き出す。

ポリシーの実行方法は大きく 2 つある。既定の `pull` モードはオンデマンドでプロバイダ API を照会し、フィルタを適用して結果にアクションする。サーバレスモードはポリシーを AWS Lambda 関数としてデプロイし、CloudTrail イベント・スケジュール・AWS Config をトリガに動かす。実行時だけでなく継続的にルールが自分自身を施行する。同じ DSL が検出と是正を 1 ファイルにまとめる。

出発点は AWS であり、現在も AWS 中心で `c7n/resources/` 配下に約 120 のリソースファイルを持つ。`tools/` 配下の別パッケージが Azure・GCP・Oracle Cloud・Tencent Cloud・Kubernetes admission・IaC スキャンを追加し、通知 (`c7n_mailer`)・マルチアカウント実行 (`c7n_org`) のヘルパも揃う。

## いつ使うか

- AWS・Azure・GCP を横断してクラウドリソースの検出と是正を 1 つの宣言的言語で行いたい場合 (クラウドごとのスクリプトを避けたい)。
- 継続的な施行が必要な場合: 未タグのインスタンス停止、公開スナップショットの削除、スケジュールやイベントによる時間外シャットダウンなど。
- 検出と是正を同じツールで行いたい場合 (検出だけのスキャナではなく)。
- ガバナンスの境界が Kubernetes admission control の場合は不向き。Kyverno や OPA Gatekeeper のほうが API サーバに近い。
- 姿勢評価とレポートだけが必要な場合も不向き。読み取り専用スキャナのほうが簡潔。

## このディープダイブの構成

- [歴史](./history): Capital One での起源、CNCF Sandbox、Incubating 昇格。
- [アーキテクチャ](./architecture): レジストリ駆動の DSL と `pull` 実行の流れ。
- [採用事例・エコシステム](./adoption): 出典付きの採用組織、GitHub シグナル、周辺ツール。
- [内部実装](./internals): ソースから読んだ Policy・レジストリ・クエリの型。
- [はじめに](./getting-started): `c7n` のインストールと EC2 への最初のポリシー実行。

## 出典

1. [cloud-custodian/cloud-custodian on GitHub](https://github.com/cloud-custodian/cloud-custodian) (2026-06-24)
2. [Cloud Custodian becomes a CNCF incubating project](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/) (2026-06-24)
3. [Cloud Custodian - CNCF project](https://www.cncf.io/projects/cloud-custodian/) (2026-06-24)
4. [c7n on PyPI](https://pypi.org/project/c7n/) (2026-06-24)
5. [cloudcustodian/c7n on Docker Hub](https://hub.docker.com/r/cloudcustodian/c7n) (2026-06-24)
6. [Cloud Custodian ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) (2026-06-24)
7. [Cloud Custodian GOVERNANCE.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/GOVERNANCE.md) (2026-06-24)
8. [Cloud Custodian README.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/README.md) (2026-06-24)
9. [Cloud Custodian docs](https://cloudcustodian.io/) (2026-06-24)
10. [GitHub REST API repos/cloud-custodian/cloud-custodian](https://api.github.com/repos/cloud-custodian/cloud-custodian) (2026-06-24)

# 採用事例・エコシステム

## 誰が使っているか

プロジェクトは本番運用している組織を `ADOPTERS.md` に列挙している。CNCF の Incubating 発表記事はそのうちの一部を本番ユーザとして挙げている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Capital One | 起源。本番のクラウドガバナンス | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| Intuit | 本番のクラウドガバナンス | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| JP Morgan Chase & Co | 本番のクラウドガバナンス | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| Siemens | 本番のクラウドガバナンス | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| HBO Max | 本番のクラウドガバナンス | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| Databricks | 本番のクラウドガバナンス | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| CyberArk | 本番のクラウドガバナンス | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| Zapier | 本番のクラウドガバナンス | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |
| Premise Data | 本番のクラウドガバナンス | [ADOPTERS.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/ADOPTERS.md) |

`ADOPTERS.md` の全リストには Avalara・Code 42・Grupo・Sage も載る。CNCF 発表記事は別途 Capital One・Code 42・HBO Max・Intuit・JP Morgan Chase & Co・Siemens・Premise Data・Zapier を本番ユーザとして挙げている ([CNCF blog, 2022-09-14](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/))。これら出典の範囲を超える採用組織はここでは主張しない。

## 採用のシグナル

- GitHub (2026-06-24 観測): スター 6,014、フォーク 1,625、コントリビュータ約 418 名、リポジトリ作成 2016-03-01 ([GitHub REST API](https://api.github.com/repos/cloud-custodian/cloud-custodian))。
- 2022 年の CNCF Incubating 時点で、コントリビュータ 350 名以上、貢献組織 130 以上、ダウンロード 1.5 億超を報告 ([CNCF blog, 2022-09-14](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/))。
- 配布: PyPI に `c7n`、Docker Hub にコンテナイメージ `cloudcustodian/c7n` ([PyPI](https://pypi.org/project/c7n/), [Docker Hub](https://hub.docker.com/r/cloudcustodian/c7n))。

## エコシステム

リポジトリは `tools/` 配下に周辺ツールを同梱する。

- `c7n_mailer`: ポリシー結果の通知を送る (主に SQS 経由)。
- `c7n_org`: 多数の AWS アカウント・Azure サブスクリプション・GCP プロジェクトを横断してポリシーを実行する。
- `c7n_left`: IaC のシフトレフトスキャン。Terraform 向けに `c7n_terraform`。
- `c7n_kube`: Kubernetes admission control。
- `c7n_awscc`: AWS Cloud Control API によるリソース網羅。
- プロバイダパッケージ: `c7n_azure`・`c7n_gcp`・`c7n_oci`・`c7n_tencentcloud`・`c7n_openstack`。

標準的な本番パターンは、サーバレスモードを AWS Lambda と CloudWatch Events または AWS Config と組み合わせて継続的に施行する形である ([README.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/README.md))。

## 代替候補

| 代替 | 違い |
| --- | --- |
| OPA Gatekeeper / Kyverno | Kubernetes admission のためのポリシー as code。クラウドプロバイダのリソース統制ではなく API サーバに位置する |
| Prowler / ScoutSuite / Steampipe | セキュリティ評価・クエリ寄り。c7n が検出と組み合わせる是正アクションやイベント駆動施行を持たない検出のみ |
| AWS Config Rules / Azure Policy | 単一クラウドのネイティブ。c7n は 1 つの DSL で AWS・Azure・GCP を横断する |

Cloud Custodian は、複数クラウドを横断して 1 つの宣言的言語でクラウドプロバイダのリソースの検出と是正を行いたい場合に向く。ポリシー境界がクラスタ API なら Kubernetes admission エンジン、姿勢レポートだけが必要なら読み取り専用スキャナのほうが向く。

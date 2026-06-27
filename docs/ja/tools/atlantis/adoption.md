# 採用事例・エコシステム

## 採用組織

ここで挙げる採用組織は、pin commit 時点のプロジェクトの `ADOPTERS.md` に記載された組織のみである (出典 8)。より広い CNCF ケーススタディは主張しないため、テーブルはこのファイルが述べる内容に限定する。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| [Lambda](https://lambda.ai) | Lambda の内部プラットフォーム向けセルフサービスインフラのオーケストレーション | [ADOPTERS.md](https://github.com/runatlantis/atlantis/blob/main/ADOPTERS.md) |
| [Rapid7](https://www.rapid7.com/) | Kubernetes 上の per-project Atlantis インストールでチームの全 Terraform デプロイを統括 | [ADOPTERS.md](https://github.com/runatlantis/atlantis/blob/main/ADOPTERS.md) |
| [CloudScript](https://www.cloudscript.com.br/) | 企業顧客横断のマルチクラウド Kubernetes プラットフォーム標準化 | [ADOPTERS.md](https://github.com/runatlantis/atlantis/blob/main/ADOPTERS.md) |
| [Vend](https://vend.com/) | 複数クラウドプロバイダにまたがる複数チームのインフラ運用 | [ADOPTERS.md](https://github.com/runatlantis/atlantis/blob/main/ADOPTERS.md) |

公開当初の記事は、初期の Hootsuite 社内利用を歴史的数値として記録している。78 contributors、144 Terraform リポジトリ、全 Terraform 変更で Atlantis を利用、というものだ (出典 2)。

## 採用シグナル

2026-06-26 に pin commit に対して `gh repo view` で測定: stars 9,155、forks 1,285。GitHub API が報告するライセンスは `apache-2.0`、リポジトリ作成日は 2018-02-06。プロジェクトは OpenSSF (Open Source Security Foundation) Best Practices バッジを持ち、README からリンクされている。メンテナンスは複数社で分担され、`MAINTAINERS.md` は Dylan Page (Lambda)・PePe Amengual (Slalom)・Rui Chen (Meetup) を Maintainer として、加えて複数の Core Contributor を列挙する (出典 14)。プロジェクトは 2024-06-18 に受諾された CNCF Sandbox プロジェクトである (出典 6)。

## エコシステム

Atlantis は置き換えではなく統合する。VCS 側では GitHub・GitLab・Gitea (Forgejo を含む)・Bitbucket Cloud と Server・Azure DevOps をサポートする。エンジン側では Terraform と OpenTofu の両方を実行でき、`terraform_distribution: opentofu` で選択する。カスタム Docker イメージと `run` ワークフローステップの組み合わせが周辺ツールを取り付ける標準的な方法だ。DRY な構成のための Terragrunt (出典 11)、`policy_check` ステップでの Conftest または Open Policy Agent Rego、コスト見積もりのための Infracost。OpenTofu との組み合わせは第一級のパスとして文書化されている (出典 12)。

## 代替

Atlantis はセルフホストで state を持たない側の端にいる。Pull Request を自動化し、state・ポリシー・drift detection は自前の backend とツールに委ねる。商用 TACOS 製品はそれらの関心事を内蔵する。

| 代替 | 違い |
| --- | --- |
| Spacelift | OPA ポリシーステージ・private module registry・drift detection・stack 依存を内蔵した商用 TACOS。Atlantis はこれらをユーザに委ねる (出典 9)。 |
| env0 | SaaS 中心の TACOS。看板機能は TTL 付き ephemeral environment (出典 9)。 |
| Digger (OpenTaco) | OSS。既存の CI (GitHub Actions、GitLab CI) 内で Terraform を実行し、シークレットを CI runner に留める。2025-11 に OpenTaco へリブランド (出典 10)。 |
| HashiCorp HCP Terraform / Scalr | マネージドな state + 実行。Atlantis は state を持たずユーザの backend に委ねる。 |
| Terragrunt | 競合ではない。Atlantis の `run` ステップから呼び出して併用するのが一般的 (出典 11)。 |

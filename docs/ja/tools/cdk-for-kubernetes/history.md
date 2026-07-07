# 歴史

## 起源

CDK8s は 2020 年 5 月に Amazon Web Services (AWS) が発表しました。主たる作者は Elad Ben-Israel で、AWS CDK・jsii・projen の作者でもあります。動機は、AWS CDK が CloudFormation に対して使う Construct Programming Model (CPM) を Kubernetes マニフェストにも持ち込むことでした。これにより、手書きの YAML や Go テンプレートではなく、型・ループ・再利用可能な抽象を備えた実プログラミング言語でワークロードを定義できます ([AWS containers blog](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/))。

同年、`cdk8s+` (cdk8s-plus) という高レベルの intent ベース API がベータに入り、生のリソース層の上に Pod や Deployment といった型付きクラスを提供しました。2020 年 11 月には CNCF (Cloud Native Computing Foundation) に Sandbox 成熟度で受理されました ([CNCF プロジェクトページ](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2020 | AWS が cdk8s を発表。高レベル API `cdk8s+` がベータ入り ([AWS blog](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/)) |
| 2020 | 2020-11-10 に CNCF Sandbox に受理 ([CNCF](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/)) |
| 2021 | 一般提供 (GA) を宣言。Go サポート追加。専用 org `cdk8s-team` へ移管 ([AWS What's New](https://aws.amazon.com/about-aws/whats-new/2021/10/cdk-kubernetes-cdk8s-available/)) |

## どう進化したか

核となる発想は Construct Programming Model です。同じ construct 抽象が AWS CDK (CloudFormation 向け)、CDKTF (Terraform 向け)、cdk8s (Kubernetes 向け) を記述します。多言語パッケージ化は jsii が担い、TypeScript ソースを Python・Java・Go・.NET 向けパッケージへコンパイルします ([AWS containers blog](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/))。

2021 年 10 月の GA で、対応言語に Go を追加し、AWS Labs org から専用の `cdk8s-team` GitHub org へ移りました。これは AWS 製品ではなく独立した CNCF プロジェクトであることを示すものです ([AWS What's New](https://aws.amazon.com/about-aws/whats-new/2021/10/cdk-kubernetes-cdk8s-available/))。

コードベースも単一リポジトリではなく、この org に分割されています。アンブレラの `cdk8s-team/cdk8s` リポジトリは website・横断 issue・ドキュメントを持ち、合成エンジンは `cdk8s-team/cdk8s-core` にあって npm に `cdk8s` という名前で配布されます。コマンドラインツール (`cdk8s-cli`) と高レベル API (`cdk8s-plus`) はそれぞれ別リポジトリです。

## 現在地

CDK8s は引き続き CNCF Sandbox プロジェクトです ([CNCF](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/))。`cdk8s-core` エンジンのリリースは頻繁で、本稿執筆時点の最新リリースは 2026-06-23 公開の `v2.70.80` です (GitHub Releases)。本ディープダイブは 2026-06-25 のコミット `558f788` を基準としています。

ビルドは projen と jsii を使います。`npm run build` ターゲットは `projen build` を実行し、`package:python`・`package:java`・`package:dotnet`・`package:go` の各ターゲットが言語別の配布物を生成します (`cdk8s-core` の `package.json`)。ランタイムは peer dependency として `constructs ^10` に依存し、`yaml`・`fast-json-patch`・`follow-redirects` を bundle します。

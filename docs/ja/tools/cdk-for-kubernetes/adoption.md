# 採用事例・エコシステム

## 誰が使っているか

`cdk8s-core` リポジトリにもアンブレラの `cdk8s-team/cdk8s` リポジトリにも ADOPTERS ファイルは無く、本調査では特定の本番利用者を名指しできる公開ケーススタディ・トーク・エンジニアリングブログを見つけられませんでした。採用企業を捏造するのではなく、本ページは測定可能なシグナルのみを報告します。

出典付きで述べられるのは起源とガバナンスです。cdk8s は AWS から生まれ、AWS は公式ブログで継続的に発信しています ([AWS containers blog](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/))。そして CNCF Sandbox プロジェクトです ([CNCF プロジェクトページ](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/))。

## 採用のシグナル

2026-06-26 に GitHub API で測定。スターはアンブレラリポジトリに付き、コントリビュートは実装リポジトリに集まる点に注意してください。

| リポジトリ | スター | フォーク | 備考 |
| --- | --- | --- | --- |
| [cdk8s-team/cdk8s](https://github.com/cdk8s-team/cdk8s) (アンブレラ) | 4830 | 313 | website・ドキュメント・横断 issue |
| [cdk8s-team/cdk8s-core](https://github.com/cdk8s-team/cdk8s-core) (エンジン) | 86 | 33 | コントリビュータ約 59 名 (匿名含む) |

リリース頻度は高く、エンジンは 2026-06-23 までに `v2.70.80` に達しており、頻繁な自動リリースを示します。パッケージは npm に `cdk8s` として配布され ([npm](https://www.npmjs.com/package/cdk8s))、jsii (JavaScript Interop Interface) を通じて PyPI・Maven Central・NuGet・Go モジュールとしても配布されます。

## エコシステム

プロジェクトは `cdk8s-team` org の下で複数リポジトリに分かれています。

- **`cdk8s-plus`**: 生の `ApiObject` 層の上に Pod や Deployment といった型付きクラスを構築した高レベルの intent ベース API。
- **`cdk8s-cli`**: `cdk8s init` (プロジェクト雛形生成)、`cdk8s import` (CRD や Kubernetes API から型付き construct を生成)、`cdk8s synth` を提供するコマンドラインツール。
- **`cdk8s-cdktf-resolver`**: cdk8s から CDKTF (CDK for Terraform) の出力を参照できる連携。
- **`cdk8s-operator`**: cdk8s コードを Kubernetes operator として実行する。

CDK8s は Helm とも連携します。コアエンジンの `src/helm.ts` が Helm chart を construct ツリーに取り込めます。cdk8s は AWS CDK や CDKTF と同じ `constructs` ライブラリの上に乗るため、抽象やパターンがそれらのツール間で通用します。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Helm | values ファイルに対する Go テンプレートで YAML を描画する。cdk8s はテンプレート文字列ではなく、型と制御構文を持つ実プログラミング言語を使う。 |
| Kustomize | 既存のベース YAML にパッチを重ねる。cdk8s は YAML をコードから 0 から合成する。 |
| jsonnet / ytt (Carvel) | 専用のデータテンプレート言語。cdk8s は汎用言語 (TypeScript・Python・Java・Go・C#) を使う。 |
| Pulumi | 同じく汎用言語でインフラを定義するが、変更をクラスタへ適用する。cdk8s はマニフェストを合成するだけで、適用は `kubectl` や GitOps コントローラに委ねる。 |

型付きでテスト可能、合成可能なマニフェストをチームが既に使う言語で書きたく、適用は別途で構わないなら cdk8s を選びます。プログラミング言語のビルドステップを持たないパッケージング・オーバーレイ形式が欲しいなら Helm や Kustomize を選びます。定義と適用を 1 ツールで済ませたいなら Pulumi を選びます。

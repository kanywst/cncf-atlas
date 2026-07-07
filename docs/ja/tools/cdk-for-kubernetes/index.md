# CDK for Kubernetes (CDK8s)

> Kubernetes マニフェストを汎用プログラミング言語で記述し、素の YAML へ合成するフレームワーク。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Sandbox
- **言語**: TypeScript (jsii で Python・Java・Go・.NET へ配布)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cdk8s-team/cdk8s-core](https://github.com/cdk8s-team/cdk8s-core)
- **ドキュメント基準コミット**: `558f788` (2026-06-25)

## 何をするものか

CDK8s (Cloud Development Kit for Kubernetes) は、手書きの YAML やテンプレートの代わりに、汎用プログラミング言語で Kubernetes マニフェストを書くためのフレームワークです。コードでオブジェクトのツリーを組み立て、合成 (synth) を呼ぶと、素の Kubernetes YAML がディスクに書き出されます。クラスタには一切接続しません。出力を `kubectl apply` で適用するのは利用者の責務です。

このモデルは Construct Programming Model (CPM) に由来します。AWS CDK (CloudFormation 向け) や CDKTF (Terraform 向け) と同じ抽象です。construct はツリー上のノードを指します。CDK8s は 3 つの中核 construct を定義します。`App` (ルート)、`Chart` (1 マニフェストファイルの単位)、`ApiObject` (1 つの Kubernetes リソース) です。多言語サポートは jsii (JavaScript Interop Interface) が担い、TypeScript ソースを Python・Java・Go・.NET 向けパッケージへコンパイルします。

本ディープダイブは `cdk8s-team/cdk8s-core` リポジトリを読みます。これは npm の `cdk8s` パッケージとして配布される合成エンジン本体です。高レベルの intent API (`cdk8s-plus`) と `cdk8s init` / `cdk8s synth` のコマンドラインツール (`cdk8s-cli`) は別リポジトリにあります。

## いつ使うか

- Go テンプレート文字列ではなく、型チェック・ループ・条件分岐・ユニットテストをマニフェストに適用したい。
- すでに TypeScript・Python・Java・Go・C# で開発しており、マニフェストもその言語で保ちたい。
- 多数のリソースにまたがる再利用可能な抽象を組み、ライブラリとして共有したい。
- 既存の Custom Resource Definition (CRD) や Helm chart を取り込み、型付き construct として扱いたい。

向かない場面:

- クラスタへの適用までやってくれるツールが欲しい場合。CDK8s は YAML を合成するだけで、適用には `kubectl`・Argo CD・Flux が別途必要です。
- ビルドステップやプログラミング言語ツールチェーンを持たず、素の宣言的 YAML を好むチームの場合。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと合成の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [cdk8s-team/cdk8s-core](https://github.com/cdk8s-team/cdk8s-core) (実装本体、npm の `cdk8s` として配布)、参照日 2026-06-26。
2. [cdk8s-team/cdk8s](https://github.com/cdk8s-team/cdk8s) (アンブレラリポジトリ)、参照日 2026-06-26。
3. [CNCF プロジェクトページ: CDK for Kubernetes (cdk8s)](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/)、参照日 2026-06-26。
4. [AWS What's New: cdk8s が一般提供開始](https://aws.amazon.com/about-aws/whats-new/2021/10/cdk-kubernetes-cdk8s-available/)、参照日 2026-06-26。
5. [AWS containers blog: cdk8s の GA と Go サポート](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/)、参照日 2026-06-26。
6. [cdk8s.io 公式ドキュメント](https://cdk8s.io)、参照日 2026-06-26。
7. [npm パッケージ: cdk8s](https://www.npmjs.com/package/cdk8s)、参照日 2026-06-26。

# Crossplane

> プラットフォームチームが自前の API を定義し、コントローラがクラウドおよびクラスタ内リソースを宣言された状態へ継続的に reconcile する、Kubernetes ベースのコントロールプレーンフレームワーク。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Graduated
- **言語**: Go (`go 1.25.10`、module `github.com/crossplane/crossplane/v2`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [crossplane/crossplane](https://github.com/crossplane/crossplane)
- **ドキュメント基準コミット**: `56aace77` (2026-06-19、`main`、`v2.3.2` の後)

## 何をするものか

Crossplane は Kubernetes API server の上で動き、それをインフラとアプリケーションのためのコントロールプレーンに変える。自前の状態ファイルは持たない。desired state と observed state はどちらも etcd 内のカスタムリソースとして存在し、コントローラがループで reconcile する。これは Terraform や Pulumi の単発 `apply` モデル (CLI 実行が保存済み state ファイルとの差分を計算する) とは異なる ([Pulumi の比較](https://www.pulumi.com/docs/iac/comparisons/crossplane/) を参照)。

中核の抽象は composition である。プラットフォームチームは `CompositeResourceDefinition` (XRD) を定義して新しいリソース型を作り、その型の各インスタンスを function の pipeline にマップする `Composition` を書く。function が実際の managed リソースおよび Kubernetes リソースを生成する。結果として、アプリケーションチームが基盤のクラウドプロバイダに触れずに利用できるセルフサービス API ができる。

Crossplane v2 (2025 年 8 月) は旧来の patch-and-transform 機構を削除し、composition を完全に function ベースにした。各 function は独立した gRPC サービスなので、composition は YAML・KCL・Python・Go などで書ける。v2 では composition に Crossplane の managed リソースだけでなく任意の Kubernetes リソースを含められるようになった。

## いつ使うか

- アプリケーションチームが、あなたが設計した API を通じてインフラをプロビジョニングし、ロールベースのアクセスとバリデーションを Kubernetes が強制する、プラットフォームエンジニアリング層が欲しいとき。
- 継続的な drift 修正が必要なとき。reconcile が止まらないため、managed リソースへの帯域外変更は宣言された状態へ戻される。
- すでに Kubernetes を運用しており、リソースの状態をロック付きの別の state ファイルではなく etcd に持ちたいとき。
- クラウドリソースとクラスタ内ワークロード (例: データベースオペレータの `Cluster` と `Deployment`) を 1 つの API の背後に composition したいとき。

Kubernetes を運用していない場合や、チームに Kubernetes の運用知識がなく単発のプロビジョニングしか必要としない場合は、適合度が下がる。その場合は Terraform や Pulumi のような CLI ツールのほうが導入コストが低い ([platformengineering.org](https://platformengineering.org/blog/terraform-vs-pulumi-vs-crossplane-iac-tool) を参照)。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [crossplane/crossplane リポジトリ](https://github.com/crossplane/crossplane)
2. [Announcing Crossplane's CNCF Graduation](https://blog.crossplane.io/crossplane-cncf-graduation/)
3. [CNCF announces graduation of Crossplane](https://www.cncf.io/announcements/2025/11/06/cloud-native-computing-foundation-announces-graduation-of-crossplane/)
4. [Crossplane on CNCF projects](https://www.cncf.io/projects/crossplane/)
5. [Crossplane is now a CNCF Incubating project](https://blog.crossplane.io/crossplane-cncf-incubation/)
6. [cncf/toc#1397 Crossplane Graduation Application](https://github.com/cncf/toc/issues/1397)
7. [What's New in v2](https://docs.crossplane.io/latest/whats-new/)
8. [What's Crossplane?](https://docs.crossplane.io/latest/whats-crossplane/)
9. [Functions](https://docs.crossplane.io/latest/packages/functions/)
10. [Compositions](https://docs.crossplane.io/latest/composition/compositions/)
11. [Get started](https://docs.crossplane.io/latest/get-started/)
12. [Pulumi vs. Crossplane](https://www.pulumi.com/docs/iac/comparisons/crossplane/)
13. [Terraform vs Pulumi vs Crossplane](https://platformengineering.org/blog/terraform-vs-pulumi-vs-crossplane-iac-tool)
14. [Introducing function-kro: YAML+CEL Composition](https://blog.crossplane.io/function-kro-yaml-cel/)
15. [crossplane/crossplane ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md)
16. [GitHub API repos/crossplane/crossplane](https://api.github.com/repos/crossplane/crossplane)

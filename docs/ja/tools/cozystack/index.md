# Cozystack

> ベアメタル上にプライベートクラウド (マネージド Kubernetes・VM・データベース) を作るためのフレームワーク。ユーザが触るリソースはすべて薄い宣言で、それが Flux の HelmRelease に変換される。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cozystack/cozystack](https://github.com/cozystack/cozystack)
- **ドキュメント基準コミット**: `f5c408d` (main, 2026-06-27; 最寄りタグ `v1.5.1`)

## 何をするものか

Cozystack はベアメタルのマシン群を、マネージド Kubernetes クラスタ・仮想マシン・マネージドデータベースを社内やテナントに提供するプラットフォームに変える。対象はパブリッククラウドを再販するのではなく自前のクラウドを運用したいホスティング事業者やプラットフォームチームだ。新しいスタックを発明するのではなく、既存の CNCF/Kubernetes プロジェクトを組み合わせる。イミュータブル OS に Talos Linux、GitOps デリバリに Flux、VM に KubeVirt、テナントのコントロールプレーンに Kamaji + Cluster API、Postgres に CloudNativePG、ストレージに LINSTOR / Piraeus、ネットワークに Cilium + Kube-OVN を使う (README, 出典 2)。

バンドルではなくプラットフォームたらしめているのは、単一の API 面だ。テナントは自分の namespace に `Postgres`・`Kubernetes`・`VMInstance` といったオブジェクトを作り、プラットフォームが実体をプロビジョニングする。この API は集約 Kubernetes apiserver である `cozystack-api` が提供し、各オブジェクトを Flux の `HelmRelease` に変換して実際のリコンサイルは Flux に任せる (`pkg/registry/apps/application/rest.go:1605`)。プロビジョニングできるカタログは `packages/apps/` の Helm chart にあるため、新しいマネージドサービスを足すのは Go の変更ではなくパッケージング作業だ。

結果として、見た目はクラウドの REST API だが、裏側は Helm と GitOps で動く API になる。Cozystack 自身はテナントリソース用の別データベースを持たず、Flux の `HelmRelease` オブジェクトが唯一の記録だ。

## いつ使うか

- ベアメタルを運用し、マネージド Kubernetes・VM・DBaaS を 1 つのプラットフォームからテナントに提供したいとき。テナント分離が組み込まれている。
- 運用面を専用の IaaS コントロールプレーンではなく Kubernetes と Flux の中に収めたいとき。
- Postgres・ClickHouse・Kafka などのマネージドサービスの、意見の入ったカタログが欲しく、Helm chart を足して拡張したいとき。
- 既存クラスタへのアプリデリバリだけが目的なら不向き。それには素の Flux や Argo CD の方が軽い。
- すでにパブリッククラウド上におり、IaaS 層を自前で作る必要がないなら不向き。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [cozystack/cozystack リポジトリ](https://github.com/cozystack/cozystack) (source, LICENSE, go.mod, Makefile)、参照日 2026-06-26。
2. [cozystack/cozystack README.md](https://github.com/cozystack/cozystack/blob/main/README.md)、参照日 2026-06-26。
3. [cozystack/cozystack ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md)、参照日 2026-06-26。
4. [CNCF プロジェクトページ: Cozystack](https://www.cncf.io/projects/cozystack/)、参照日 2026-06-26。
5. [Open Source PaaS Cozystack Becomes a CNCF Sandbox Project (CNCF)](https://www.cncf.io/blog/2025/04/28/open-source-paas-cozystack-becomes-a-cncf-sandbox-project/)、参照日 2026-06-26。
6. [Cozystack Becomes a CNCF Sandbox Project (Andrei Kvapil, Ænix)](https://blog.aenix.io/cozystack-becomes-a-cncf-sandbox-project-3702b8906971)、参照日 2026-06-26。
7. [Cozystack Getting Started](https://cozystack.io/docs/getting-started/)、参照日 2026-06-26。
8. [GitHub REST API: repos/cozystack/cozystack](https://api.github.com/repos/cozystack/cozystack)、参照日 2026-06-29。

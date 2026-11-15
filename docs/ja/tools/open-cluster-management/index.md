# Open Cluster Management

> 多数の Kubernetes クラスタを 1 つの hub に登録し、各クラスタ上のエージェントが自分宛ての処理を hub から取りに行く hub-spoke 型の仕組み。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [open-cluster-management-io/ocm](https://github.com/open-cluster-management-io/ocm)
- **ドキュメント基準コミット**: `b4e4b23` (2026-11-13, main, タグ `v1.4.0` の後)

## 何をするものか

Open Cluster Management (OCM) は、1 つの hub クラスタから Kubernetes クラスタ群を管理する。hub では Cluster Manager が動く。各 managed cluster では klusterlet と呼ばれるエージェントが動き、クラスタを hub に登録して hub からの指示を実行する ([README](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/README.md))。hub は普通の Kubernetes クラスタで、OCM が足すのは CRD とコントローラ一式だけ。

中核は 4 つの API。Registration (クラスタインベントリ) は、hub 管理者と managed cluster 管理者の両方が承認するハンドシェイクでクラスタを管理下に入れる。ManifestWork は、1 つの managed cluster に適用すべき Kubernetes マニフェストを包む。Placement はラベル、claim (managed cluster が自分について報告する事実)、taint (ノードと同じく、許容しない限りそのクラスタに処理を載せない印)、スコアでクラスタの集合を選び、結果を PlacementDecision として書く。PlacementDecision はどのコントローラからでも読める。Add-on フレームワークは、他プロジェクトが全 managed cluster にエージェントを配り、hub の資格情報を持たせるための仕組み ([README](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/README.md))。

モデルは pull 型。各 managed cluster のエージェントが hub へ外向きに接続し、hub 上の自分の namespace だけを watch して、見つけたものを適用する。既定のインストールモードでは、hub は managed cluster の資格情報を持たない。OCM はクラスタを作らない (それは Cluster API の仕事) し、独自の GitOps エンジンも持たない。Argo CD、KubeVela、Kueue、KubeStellar といったプロジェクトが OCM の API の上に乗る ([ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md))。

OCM は Red Hat Advanced Cluster Management for Kubernetes の upstream。2021-11-09 に CNCF Sandbox に入り、2026-11-04 に Incubating に移った ([CNCF プロジェクトページ](https://www.cncf.io/projects/open-cluster-management/))。

## いつ使うか

- 数十から数百のクラスタを持っていて、各クラスタのエージェントが健全性、ラベル、claim を更新し続ける 1 つのインベントリが欲しい。
- managed cluster が NAT やファイアウォールの内側にある、または中央のシステムに全クラスタの管理者資格情報を持たせたくない。エージェントは hub へ外向きに接続する。
- マルチクラスタのツール (GitOps コントローラ、バッチスケジューラ、DR システム) を作っていて、標準的なクラスタインベントリ、配置 API、全クラスタへエージェントを配って資格情報を渡す手段が欲しい。
- デプロイは各クラスタの Argo CD に任せ、どのクラスタに何を配るかの判断は 1 か所に置きたい。

素の Deployment を受け取ってレプリカをクラスタ間に分割してくれる単一のコントロールプレーンが欲しいなら、Karmada のほうがそこを標準で多くこなす。クラスタが 2、3 個で GitOps ツールがすでにそれらを対象にしているなら、OCM の hub は余計かもしれない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [open-cluster-management-io/ocm README](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/README.md) (`b4e4b23` 時点)、2026-11-15 参照。
2. [ADOPTERS.md](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) (`b4e4b23` 時点)、2026-11-15 参照。
3. [Open Cluster Management CNCF プロジェクトページ](https://www.cncf.io/projects/open-cluster-management/)、2026-11-15 参照。
4. [Open Cluster Management (OCM) becomes a CNCF Incubating Project](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/)、CNCF ブログ、2026-11-10。
5. [cncf/toc#1884: OCM Incubation Application](https://github.com/cncf/toc/issues/1884)、2026-11-15 参照。
6. [cncf/toc#2360: OCM の Incubation への level change](https://github.com/cncf/toc/issues/2360)、2026-11-15 参照。
7. [cncf/sandbox#227: Sandbox project onboarding](https://github.com/cncf/sandbox/issues/227)、2026-11-15 参照。
8. [Open Cluster Management November 2022 update](https://www.cncf.io/blog/2022/10/31/open-cluster-management-november-2022-update/)、CNCF ブログ、2022-10-31。
9. [Karmada and Open Cluster Management: two new approaches to the multicluster fleet management challenge](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/)、CNCF ブログ、2022-09-26。
10. [open-cluster-management-io/ocm releases](https://github.com/open-cluster-management-io/ocm/releases)、2026-11-15 参照。
11. [OCM Quick Start](https://open-cluster-management.io/docs/getting-started/quick-start/)、2026-11-15 参照。
12. [GitHub REST API: repos/open-cluster-management-io/ocm](https://api.github.com/repos/open-cluster-management-io/ocm)、2026-11-15 参照。
13. [kubernetes-sigs/cluster-inventory-api](https://github.com/kubernetes-sigs/cluster-inventory-api)、2026-11-15 参照。

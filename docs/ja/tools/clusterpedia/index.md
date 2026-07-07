# Clusterpedia

> Clusterpedia は複数 Kubernetes クラスタの資源を1つの relational database に同期し、それを Kubernetes Aggregated API として返す。素の `kubectl` で全クラスタを横断検索できる。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [clusterpedia-io/clusterpedia](https://github.com/clusterpedia-io/clusterpedia)
- **ドキュメント基準コミット**: `bece343` (2026-04-30, main, タグ v0.9.1 より先)

## 何をするものか

Clusterpedia はマルチクラスタのコントロールプレーンコンポーネントで、クラスタ群から Kubernetes 資源を中央ストアに集約し、1 つのエンドポイントで問い合わせられるようにする。クラスタは `PediaCluster` という Custom Resource Definition (CRD、カスタム資源定義) で登録し、この 1 つのオブジェクトが接続認証情報と同期対象資源の一覧の両方を持つ。synchro manager は登録された各クラスタに対して informer を回し、観測したオブジェクトをストレージバックエンド (デフォルトは MySQL か PostgreSQL) に書き込む。

検索側は Kubernetes Aggregated API として登録される。上流 Kubernetes apiserver の list / get ハンドラをそのまま再利用するため、応答は OpenAPI 互換であり、`kubectl`・`client-go`・既存ツールが無改変で動く。標準の list 意味論に加えて、Clusterpedia はクラスタ横断フィルタ、あいまい名前検索、任意のオブジェクトパスに対するフィールド検索、そして異なる Kubernetes バージョンで保存された資源を 1 つの要求バージョンで取得できるバージョン変換を足している。

Clusterpedia はワークロードのスケジューリングや配置はしないし、クラスタ間のネットワーク接続性も解決しない。スコープは状態を中央 DB に集約し、その上で横断 read を提供することだ。プロジェクトは自らを「クラスタの Wikipedia」と表現しており、名前の由来もそこにある。

## いつ使うか

- 多数の Kubernetes クラスタを運用し、全クラスタの資源を 1 つの `kubectl` 互換エンドポイントで検索したいとき。
- ネイティブ API にない検索意味論が必要なとき: クラスタ集合・名前空間集合・owner・あいまい名前・任意オブジェクトフィールドでのフィルタ。
- 異なる Kubernetes バージョンのクラスタ群の資源を 1 つの正規化バージョンで問い合わせたいとき。
- 元クラスタの etcd より長持ちする資源状態の記録が欲しいとき。
- クラスタ横断でワークロードを配置・オーケストレーションしたい場合は不向き。それは Karmada のような federation ツールの仕事。
- メトリクス・トレース・ログが必要な場合は不向き。Clusterpedia が貯めるのは Kubernetes 資源オブジェクトであり、observability テレメトリではない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [clusterpedia-io/clusterpedia リポジトリ](https://github.com/clusterpedia-io/clusterpedia)
2. [README.md (main)](https://github.com/clusterpedia-io/clusterpedia/blob/main/README.md)
3. [CNCF プロジェクトページ (Sandbox, 2022-06-17 受理)](https://www.cncf.io/projects/clusterpedia/)
4. [Demo Video: Complex Retrieval of Resources in a Multi-Cloud Environment](https://clusterpedia.io/blog/2022/03/01/demo-video-clusterpedia-complex-retrieval-of-resources-in-a-multi-cloud-environment/)
5. [DaoCloud community docs: Clusterpedia](https://docs.daocloud.io/en/community/clusterpedia)
6. [CNCF blog: Karmada and Open Cluster Management](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/)
7. [Quickly Deploy Clusterpedia with Helm](https://clusterpedia.io/blog/2022/04/11/quickly-deploy-clusterpedia-with-helm/)
8. [Clusterpedia Installation](https://clusterpedia.io/docs/installation/)
9. [Clusterpedia Import Clusters](https://clusterpedia.io/docs/usage/import-clusters/)
10. [Clusterpedia Sync Cluster Resources](https://clusterpedia.io/docs/usage/sync-resources/)
11. [clusterpedia-io/clusterpedia-helm chart](https://github.com/clusterpedia-io/clusterpedia-helm)
12. [GitHub REST API repo metadata](https://api.github.com/repos/clusterpedia-io/clusterpedia)

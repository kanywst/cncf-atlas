# Chaos Mesh

> Pod・ネットワーク・ファイルシステム・カーネルへの障害をカスタムリソース経由で注入する、Kubernetes ネイティブのカオスエンジニアリングプラットフォーム。

- **カテゴリ**: Chaos Engineering
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [chaos-mesh/chaos-mesh](https://github.com/chaos-mesh/chaos-mesh)
- **ドキュメント基準コミット**: `8c13a9f` (2026-06-22、v2.8.3 の後)

## 何をするものか

Chaos Mesh は Kubernetes クラスタ上で制御された障害注入実験を実行する。障害をカスタムリソースとして記述し、`kubectl` で適用すると、選択された Pod に障害が注入され、実験終了時に復旧される。障害の種類には、Pod の kill、ネットワークの遅延・パケットロス、ディスク逼迫、CPU/メモリ負荷、時刻のずれ、JVM やカーネルの障害注入が含まれる。

システムは 3 つの部品からなる。controller-manager がカオス CRD を watch し、何を注入するか決める。privileged な DaemonSet (`chaos-daemon`) が全ノードに常駐し、対象コンテナの namespace の中で実際の注入を行う。dashboard が実験の設計・観測のための Web UI と API を提供する。

分散システムが現実の障害 (パケットドロップ、遅いディスク、クロックドリフト、ノード停止) を生き延びるかを検証したいチーム向けに作られている。出自は PingCAP が分散データベース TiDB をテストするために作ったもので、その後 CNCF に寄贈された。

## いつ使うか

- Kubernetes 上でワークロードを動かしており、障害注入をバージョン管理された CRD として表現し GitOps フローに載せたい。
- 汎用ツールにない低レベル障害が必要: clock skew (TimeChaos)、カーネル障害、JVM 障害、細粒度の IO 障害。
- 現実的なネットワーク・ノード障害の下で、分散合意・ロックの TTL・リトライロジック・フェイルオーバーを検証したい。
- Kubernetes 上でない場合、またはノードで privileged DaemonSet を動かせない場合は向かない。

## このディープダイブの構成

- [歴史](./history): PingCAP での起源、CNCF のマイルストーン、存在理由。
- [アーキテクチャ](./architecture): 3 つのコンポーネントと reconcile の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): reconcile パイプラインと daemon の注入パスをソースから読む。
- [はじめに](./getting-started): Helm でインストールし最初の実験を動かす。

## 出典

1. chaos-mesh/chaos-mesh, GitHub リポジトリ: <https://github.com/chaos-mesh/chaos-mesh>
2. 基準コミット `8c13a9fb8d69a4299af99de9ddc9370c61ebf247`: <https://github.com/chaos-mesh/chaos-mesh/commit/8c13a9fb8d69a4299af99de9ddc9370c61ebf247>
3. Chaos Mesh moves to the CNCF Incubator: <https://www.cncf.io/blog/2022/02/16/chaos-mesh-moves-to-the-cncf-incubator/>
4. Announcing Chaos Mesh as a CNCF Sandbox Project (PingCAP): <https://www.pingcap.com/press-release/announcing-chaos-mesh-as-a-cncf-sandbox-project/>
5. Chaos Mesh プロジェクトページ (CNCF): <https://www.cncf.io/projects/chaosmesh/>

# Longhorn

> ボリュームごとに専用エンジンとレプリカを持たせる、Kubernetes ネイティブの分散ブロックストレージ。

- **カテゴリ**: Storage & Database
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [longhorn/longhorn-manager](https://github.com/longhorn/longhorn-manager)
- **ドキュメント基準コミット**: `3b8885a` (master, committer date 2026-06-23)

## 何をするものか

Longhorn は Kubernetes 向けの分散ブロックストレージ。専用のストレージ装置を持ち込まずに、ノードのローカルディスクをレプリケーションされた `PersistentVolume` に変える。傘プロジェクトは [longhorn/longhorn](https://github.com/longhorn/longhorn) にあり、このディープダイブが読む Go 製 control plane は [longhorn/longhorn-manager](https://github.com/longhorn/longhorn-manager) にある。

設計の核心は「ボリュームごとのマイクロサービス」だ。全ディスクを 1 つの共有コントローラの後ろにプールするのではなく、Longhorn はボリュームごとに専用のエンジン (ストレージコントローラ) と N 個のレプリカプロセスを与え、それぞれをノードへスケジュールされた別プロセスとして起動する。control plane は `longhorn-manager` で、CRD とコントローラ群からなる DaemonSet。data plane は `longhorn-engine` と `longhorn-instance-manager` で、実際のブロック I/O を担う。

manager 自体は I/O を捌かない。望ましい状態 (`Volume` の spec) と観測状態を突き合わせて収束させる。具体的には `Replica` / `Engine` のカスタムリソースを作り、ノードとディスクへスケジュールし、各ノードの instance manager に gRPC で対応プロセスの起動を依頼する。

## いつ使うか

- 外部 SAN やクラウドのボリュームサービスなしで、手持ちのディスクを使って Kubernetes 上でレプリケーション付き永続ブロックストレージが欲しいとき。
- Rook/Ceph の運用負荷を正当化しづらい、エッジや中小規模クラスタを運用しているとき。
- ボリュームごとのスナップショット、S3 または NFS へのバックアップ、UI を 1 枚のマニフェストで入れたいとき。
- 1 つのシステムでオブジェクトストレージやファイルストレージもネイティブに提供したいとき、あるいは本番レポートが示すように専用ディスクとレプリカ数チューニングへのコミットがチームに難しいときは避ける。正直な反証は [採用事例・エコシステム](./adoption) を参照。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. longhorn/longhorn 傘リポジトリ: <https://github.com/longhorn/longhorn>
2. longhorn/longhorn-manager control plane (コミット `3b8885a` でクローンし精読): <https://github.com/longhorn/longhorn-manager>
3. Longhorn brings cloud native distributed storage to the CNCF Incubator: <https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/>
4. CNCF プロジェクトページ (Longhorn, Incubating): <https://www.cncf.io/projects/longhorn/>
5. Longhorn Accepted into CNCF (Rancher, 2019): <https://www.rancher.com/blog/2019/longhorn-accepted-into-cncf/>
6. CNCF welcomes Longhorn to its sandbox (DEVCLASS): <https://devclass.com/2019/10/29/cncf-welcomes-longhorn-to-its-sandbox/>
7. Persistent Block Storage for Kubernetes: SUSE Storage, powered by Longhorn: <https://www.suse.com/c/persistent-block-storage-for-kubernetes-suse-storage-powered-by-longhorn/>
8. Longhorn プロジェクトサイト: <https://longhorn.io/>
9. Longhorn インストールドキュメント: <https://longhorn.io/docs/latest/deploy/install/>
10. Longhorn Provides Persistent Storage for 35,000 Kubernetes Nodes (Altoros): <https://www.altoros.com/blog/longhorn-provides-persistent-storage-for-35000-kubernetes-nodes/>
11. Why Replicated moved away from recommending Longhorn for kURL: <https://www.replicated.com/blog/why-replicated-has-moved-away-from-recommending-longhorn-for-kurl-storage>
12. Longhorn on Production Clusters: tuning and gotchas (CloudCasa): <https://cloudcasa.io/blog/longhorn-on-production-clusters-storage-configuration-tuning-and-gotchas>
13. Longhorn vs OpenEBS vs Rook/Ceph 2025: <https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025>
14. longhorn/longhorn-engine: <https://github.com/longhorn/longhorn-engine>

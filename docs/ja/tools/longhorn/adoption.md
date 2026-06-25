# 採用事例・エコシステム

## 誰が使っているか

CNCF Incubator 昇格ブログ (2021-11-04) は、ユースケースとともに本番ユーザを名指ししている ([出典 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/))。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Cerner | 医療情報 IT。永続ストレージと高可用なデータレプリケーション。 | [出典 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/) |
| Tribunal Regional Eleitoral do Pará | ブラジル・パラ州の選挙裁判所。Prometheus などのストレージバックエンド。 | [出典 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/) |
| Tyk | OSS の API/サービス管理基盤。動的プロビジョニングされる数百のクラスタノードを裏付ける。 | [出典 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/) |

正直な反証も挙げる。すべての採用が成功談ではない。Replicated は kURL の標準ストレージから Longhorn を外した。drive corruption、mount 失敗、reboot 後の復旧不能を Longhorn 起因と分析している ([出典 11](https://www.replicated.com/blog/why-replicated-has-moved-away-from-recommending-longhorn-for-kurl-storage))。本番向けガイドも、Longhorn はデフォルト任せではなく専用ディスクとレプリカ数チューニングを前提とする点を強調する ([出典 12](https://cloudcasa.io/blog/longhorn-on-production-clusters-storage-configuration-tuning-and-gotchas))。

## 採用のシグナル

2026-06-24 に `gh` で計測:

- `longhorn/longhorn` (傘): スター 7,805、fork 712、contributor 約 162。コミュニティ計測はこの傘リポジトリに集約される。
- 個別の実装リポジトリ: `longhorn-engine` 386 スター、`longhorn-manager` 211、`longhorn-instance-manager` 27。
- `longhorn` GitHub org は 41 リポジトリを持つ。

規模としては、CNCF が昇格時点 (2021-11) で稼働ノード 34,000 以上を提示し、SUSE のエンジニアは後に 35,000 active node に言及した ([出典 3](https://www.cncf.io/blog/2021/11/04/longhorn-brings-cloud-native-distributed-storage-to-the-cncf-incubator/)、[出典 10](https://www.altoros.com/blog/longhorn-provides-persistent-storage-for-35000-kubernetes-nodes/))。

## エコシステム

- **Kubernetes CSI**: 動的プロビジョニング、スナップショット、ボリューム拡張。
- **RWX ボリューム**: 内蔵の NFS share manager 経由で提供。
- **バックアップ**: S3 または NFS ターゲットへ。クラスタのバックアップ/リストアは Velero 連携。
- **可観測性**: Prometheus メトリクス。
- **ワンクリックインストール**: Rancher と SUSE Rancher Prime から。
- **兄弟 data-plane リポジトリ**: `longhorn-engine` (v1 のストレージコントローラ、"World's smallest storage controller"、[出典 14](https://github.com/longhorn/longhorn-engine)) と `longhorn-instance-manager` (engine/replica プロセスを起動する per-node gRPC サービス)、加えて SPDK ベースの v2 engine コンポーネント。

## 代替候補

本質的な差はスコープだ。Longhorn はブロック専業で、レプリカ管理を自前で回す。代替候補はそのシンプルさを、広さや生の速度と引き換えにする ([出典 13](https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025))。

| 代替 | 違い |
| --- | --- |
| Rook/Ceph | block・file・object を 1 システムで提供する代わりに、CRUSH map と placement group の学習コストと高い CPU オーバヘッドを払う。Longhorn は block 専業で運用がシンプル、エッジ/中規模向け。 |
| OpenEBS | エンジンを選べる。Mayastor (NVMe-oF/SPDK、高速) か cStor/Jiva (簡易)。Longhorn は単一製品でレプリカ管理を端から端まで内製する。 |
| Portworx | 商用。アプリ認識スナップショットや DR が強いがライセンス費用がかかる。 |

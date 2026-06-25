# metal3-io

> BareMetalHost CRD で OpenStack Ironic を駆動し、ベアメタルを Kubernetes ネイティブに払い出すプロビジョナ。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [metal3-io/baremetal-operator](https://github.com/metal3-io/baremetal-operator)
- **ドキュメント基準コミット**: `56169b71` (main, 2026-06-24)

## 何をするものか

Metal3 ("Metal Kubed") は物理サーバを一級の Kubernetes リソースとして扱う。中核コンポーネントの baremetal-operator (BMO) は `BareMetalHost` (BMH) カスタムリソースを公開し、宣言した状態へ各ホストを収束させるコントローラを動かす。BMO は API の裏でプロビジョニングを再発明しない。実作業は OpenStack Ironic が担う。IPMI や Redfish での電源制御、PXE や virtual media でのブート、ディスク wipe、OS イメージの書き込みである。

BMO は Kubernetes コントロールプレーンとサーバハードウェアをつなぐ橋渡しだ。CRD と reconcile 状態機械は BMO が、ハードウェアとのやり取りは Ironic が持つ。両者は意図的に分離されており、BMO は実績ある BMaaS エンジンの上に乗る薄い Kubernetes ネイティブなオーケストレータに徹する。

対象は、ワークロードで使う宣言的・コントローラ駆動のモデルでハードウェアも管理したいオンプレ・エッジ基盤の運用者。`cluster-api-provider-metal3` を介して Cluster API の純正 infrastructure backend にもなるため、ベアメタル上に直接 Kubernetes クラスタを立てられる。

## いつ使うか

- オンプレやエッジのサーバを運用し、ホストのライフサイクル (inspect・provision・deprovision) を Kubernetes リソースとして宣言したい。
- Cluster API でベアメタル上に Kubernetes クラスタを構築しており、infrastructure provider が必要。
- BMC 統合を自前で書く代わりに、Ironic の広いベンダ対応 (iLO・iDRAC・iRMC など) を再利用したい。
- 演算子を載せる Kubernetes クラスタが無い場合、あるいはサーバに対応 BMC とネットワーク/virtual media のブート経路が無い場合は不向き。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [metal3-io/baremetal-operator (ソース, pinned `56169b71`)](https://github.com/metal3-io/baremetal-operator)
2. [Metal3.io becomes a CNCF incubating project (CNCF, 2025-08-27)](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)
3. [Metal³: Baremetal Provisioning for Kubernetes (2019-04-30)](https://metal3.io/blog/2019/04/30/Metal-Kubed-Baremetal-Provisioning-for-Kubernetes.html)
4. [Baremetal Operator (2019-09-11)](https://metal3.io/blog/2019/09/11/Baremetal-operator.html)
5. [Introducing Metal³, KubeCon NA 2019 (2019-12-04)](https://metal3.io/blog/2019/12/04/Introducing_metal3_kubernetes_native_bare_metal_host_management.html)
6. [Metal3 Book: Bare Metal Operator introduction](https://book.metal3.io/bmo/introduction)
7. [Metal³ プロジェクトサイト](https://metal3.io/)
8. [Bare Metal in a Cloud Native World (The New Stack)](https://thenewstack.io/bare-metal-in-a-cloud-native-world/)
9. [awesome-baremetal (代替の俯瞰)](https://github.com/alexellis/awesome-baremetal/blob/master/README.md)
10. [Provision Bare Metal K8s with Cluster API & Canonical MAAS (Spectro Cloud)](https://www.spectrocloud.com/blog/how-to-provision-bare-metal-k8s-clusters-with-cluster-api-and-canonical-maas)

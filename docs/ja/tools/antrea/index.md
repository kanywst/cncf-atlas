# Antrea

> Open vSwitch をデータプレーンに使い、Pod ネットワークと NetworkPolicy を提供する Kubernetes ネイティブな CNI。

- **カテゴリ**: Service Mesh & Networking
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache License 2.0
- **リポジトリ**: [antrea-io/antrea](https://github.com/antrea-io/antrea)
- **ドキュメント基準コミット**: `65be43d` (2026-06-24、v2.6.2 タグより後の main)

## 何をするものか

Antrea は Kubernetes 向けの Container Network Interface (CNI、コンテナネットワークインターフェース) プラグインである。CNI は kubelet が新しい Pod をネットワークに接続するときに呼び出す仕様を指す。Antrea はプログラマブルなソフトウェアスイッチである Open vSwitch (OVS) をデータプレーンに使う。各 Node が OVS ブリッジを動かし、Antrea がそのブリッジに OpenFlow エントリを書き込んで Pod トラフィックを転送し、ポリシーを適用する。

Antrea は 3 つの部品から成る。Antrea Controller はクラスタに 1 つだけ動きポリシーを計算する。Antrea Agent は各 Node に常駐しその Node の OVS ブリッジを所有する。Antrea CNI は kubelet が Pod ごとに起動する薄いバイナリで、リクエストを gRPC でローカルの Agent へ転送するだけである。

標準の Kubernetes ネットワークに加え、Antrea は独自の Custom Resource Definition (CRD、カスタムリソース定義) を追加する。Tier と優先度を持つ Antrea NetworkPolicy / ClusterNetworkPolicy、送信元 IP を固定する Egress、Multicast、トラフィックミラーリング、IPFIX フローエクスポートなどである。この可観測性と Windows 対応を実用にしているのが OVS データプレーンである。

## いつ使うか

- Kubernetes NetworkPolicy を超えるポリシーモデルが必要なとき。クラスタスコープのルール、Tier、ルール優先度、FQDN ルール、ポリシーロギング。
- カスタムデータプレーンではなく OVS 由来の成熟したネットワーク可観測性 (IPFIX、NetFlow、sFlow、SPAN) が必要なとき。
- Linux と Windows の Node が混在し、両方で 1 つの CNI を使いたいとき。
- eBPF データプレーンが必須でないとき。eBPF が要件なら Cilium のほうが近い。

## このディープダイブの構成

- [歴史](./history): VMware での起源、1.0 リリース、CNCF への寄贈。
- [アーキテクチャ](./architecture): 3 つのバイナリと CNI ADD の流れ。
- [採用事例・エコシステム](./adoption): 出典付きの採用組織と代替。
- [内部実装](./internals): ポリシー計算と OVS パイプラインをソースから読む。
- [はじめに](./getting-started): Antrea をインストールし Pod に IP が付くことを確認する。

## 出典

1. [antrea-io/antrea (GitHub)](https://github.com/antrea-io/antrea)
2. [Announcing Project Antrea (VMware OSS Blog, 2019-11-18)](https://blogs.vmware.com/opensource/2019/11/18/announcing-project-antrea/)
3. [It's here: Project Antrea 1.0 (VMware OSS Blog, 2021-04-15)](https://blogs.vmware.com/opensource/2021/04/15/its-here-project-antrea-1-0/)
4. [Antrea CNCF project page](https://www.cncf.io/projects/antrea/)
5. [Antrea accepted as a CNCF Sandbox project (antrea.io, 2021-05-05)](https://antrea.io/posts/2021-05-05-antrea-joins-cncf-sandbox/)
6. [VMware's Antrea Brings Programmable Networks to Kubernetes (The New Stack)](https://thenewstack.io/vmwares-antrea-brings-programmable-networks-to-kubernetes/)
7. [Antrea Getting started](https://antrea.io/docs/main/docs/getting-started)
8. [ADOPTERS.md (antrea-io/antrea)](https://github.com/antrea-io/antrea/blob/main/ADOPTERS.md)
9. [Antrea Architecture and Design (docs/design/architecture.md)](https://github.com/antrea-io/antrea/blob/main/docs/design/architecture.md)
10. [Antrea v2.6.2 release](https://github.com/antrea-io/antrea/releases/tag/v2.6.2)

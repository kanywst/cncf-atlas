# 採用事例・エコシステム

## 誰が使っているか

以下の組織はプロジェクトの ADOPTERS ファイルに success story 付きで載っている ([出典 8](https://github.com/antrea-io/antrea/blob/main/ADOPTERS.md))。VMware vSphere Kubernetes Service (VKS) は Antrea をデフォルト CNI として採用している ([出典 6](https://thenewstack.io/vmwares-antrea-brings-programmable-networks-to-kubernetes/))。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Glasnostic | Antrea の Open vSwitch サポートで Kubernetes クラスタ内のサービス相互作用をチューニング | [ADOPTERS.md](https://github.com/antrea-io/antrea/blob/main/ADOPTERS.md) |
| Transwarp | Antrea ClusterNetworkPolicy / NetworkPolicy でマルチテナントのビッグデータ基盤を保護、Egress で送信元 IP を保持、OVS で flannel と Antrea クラスタ間の Pod 間通信 | [ADOPTERS.md](https://github.com/antrea-io/antrea/blob/main/ADOPTERS.md) |
| TeraSky | 社内クラスタと顧客環境で Antrea Cluster Network Policy / Network Policy と Egress を多用 | [ADOPTERS.md](https://github.com/antrea-io/antrea/blob/main/ADOPTERS.md) |
| VMware vSphere Kubernetes Service (VKS) | Antrea をデフォルト CNI として出荷 | [The New Stack](https://thenewstack.io/vmwares-antrea-brings-programmable-networks-to-kubernetes/) |

## 採用のシグナル

2026-06-26 に `gh api repos/antrea-io/antrea` と contributors API で計測 ([出典 1](https://github.com/antrea-io/antrea)):

- スター: 1,794
- フォーク: 477
- オープン issue: 201
- ユニークコントリビュータ: 142
- 最新リリース: v2.6.2 (2026-06-13) ([出典 10](https://github.com/antrea-io/antrea/releases/tag/v2.6.2))

プロジェクトは OpenSSF Best Practices バッジ (project 4173) を取得しており、リポジトリ README に表示されている ([出典 1](https://github.com/antrea-io/antrea))。

## エコシステム

- Flow Aggregator (`cmd/flow-aggregator`) が Agent から IPFIX フローレコードを集約し、Grafana などの外部コレクタへエクスポートする。
- `antctl` (`cmd/antctl`) は Agent と Controller の状態を調べる運用 CLI。
- Theia は別プロジェクトで、Flow Aggregator の出力の上にネットワークフロー可視化を構築する。
- Open vSwitch は Linux Foundation プロジェクトで、Antrea がプログラムするデータプレーン基盤。
- Antrea Multi-cluster (`multicluster/`) はポリシーと Service の到達範囲をクラスタ横断に拡張する。

## 代替候補

Antrea の固有性は OVS データプレーンにある。成熟した可観測性 (IPFIX、NetFlow、sFlow、SPAN) と一級の Windows 対応で、Windows のコードパスが Linux と並んで存在する (各パッケージの `*_windows.go`)。eBPF 系の選択肢は Linux 中心である。

| 代替 | 違い |
| --- | --- |
| Cilium | eBPF データプレーン (OVS 不使用)、CNCF Graduated。eBPF と L7 identity-aware ポリシーが必須なら選ぶ |
| Calico | Tigera の BGP / eBPF データプレーン。BGP ネイティブルーティングと広いマネージド Kubernetes 採用が必要なら選ぶ |
| flannel | NetworkPolicy を内蔵しないシンプルな overlay。基本的な Pod 接続だけで十分なら選ぶ |
| kube-router | BGP ルーティングと Service・ポリシーを 1 デーモンに統合。軽量だが高度なポリシー機能は少ない |
| Weave Net | メッシュ overlay。モデルは単純だが、現在は Antrea ほど活発でない |

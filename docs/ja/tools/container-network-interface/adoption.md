# 採用事例・エコシステム

## 誰が使っているか

CNI コアリポジトリには `ADOPTERS.md` が無いので、誠実な書き方は「ライブラリを直接使う組織のリスト」ではなく「契約を消費する側」だ。消費者はコンテナランタイムと、仕様を実装するプラグインである。

| 消費者 | ユースケース | 出典 |
| --- | --- | --- |
| Kubernetes (kubelet) | Pod 作成時に CNI プラグインを呼ぶ | [Kubernetes Network Plugins](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/) |
| containerd, CRI-O | `libcni` を組み込み、runc / hcsshim を呼ぶ前にプラグインを実行 | `libcni/api.go:17-21` |
| GKE Dataplane V2, Azure CNI Powered by Cilium | CNI 実装 (Cilium) の上に構築されたマネージド提供 | [Kubernetes CNI comparison 2026](https://oneuptime.com/blog/post/2026-02-20-kubernetes-cni-comparison/view) |

Cilium / Calico / Flannel / Multus / AWS VPC CNI はこのライブラリの利用者ではなく仕様の実装である。下のエコシステム節で扱う。

## 採用のシグナル

- GitHub スター: 6,054、フォーク: 1,149 (`gh repo view containernetworking/cni`、観測 2026-06-24)。
- コントリビュータ: 約 148 (GitHub contributors API、観測 2026-06-24)。
- 最新タグ付きリリース: `v1.3.0` (2025-04-07)。本書が基準とするコミットはそれより後の main の作業 (2025-12-15)。

最も強い採用シグナルは間接的だ。Kubernetes は Pod ネットワーキングに CNI を必須とするので、準拠したすべての Kubernetes クラスタはこの契約を通じて CNI プラグインを動かしている ([Kubernetes Network Plugins](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/))。

## エコシステム

参照プラグイン (bridge, host-local, macvlan, ipvlan, portmap, bandwidth) は [containernetworking/plugins](https://github.com/containernetworking/plugins) から提供される。それ以外に、本番のデータプレーンが仕様を実装している。

- Flannel: 最小構成のオーバーレイ。NetworkPolicy 非対応。
- Calico: BGP ルーティングと強力な NetworkPolicy、eBPF データプレーンも。
- Cilium: eBPF ネイティブ、L7 ポリシー、observability、サービスメッシュ機能。
- Multus: 複数の CNI を多重化し、Pod に複数インターフェースを付与するメタプラグイン。
- AWS VPC CNI などクラウド固有プラグイン。Cilium と連結されることが多い。

出典: [Kubernetes CNI comparison 2026](https://oneuptime.com/blog/post/2026-02-20-kubernetes-cni-comparison/view), [Civo: Calico vs Flannel vs Cilium](https://www.civo.com/blog/calico-vs-flannel-vs-cilium)。

## 代替候補

直接の代替は仕様レベルだけだ。Docker の Container Network Model である。下の名前はインターフェースの代替ではなく、CNI の下で選ぶ実装だ。

| 代替 | 違い |
| --- | --- |
| Docker CNM (libnetwork) | Docker と結合した競合仕様。Kubernetes が CNI を選び、CNM は劣勢に ([Nuage](https://www.nuagenetworks.net/blog/container-networking-standards/)) |
| Flannel | CNI 実装: シンプルなオーバーレイ、NetworkPolicy 非対応 |
| Calico | CNI 実装: BGP ルーティングと豊富な NetworkPolicy |
| Cilium | CNI 実装: eBPF データプレーン、L7 ポリシー、observability |

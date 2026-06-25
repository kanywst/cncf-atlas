# Container Network Interface (CNI)

> コンテナランタイムが Pod のネットワーク設定を差し替え可能な実行ファイルに委譲するための、最小でランタイム非依存な仕様と Go ライブラリ。

- **カテゴリ**: Service Mesh & Networking
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [containernetworking/cni](https://github.com/containernetworking/cni)
- **ドキュメント基準コミット**: `7c27007` (2025-12-15、`v1.3.0` より後)

## 何をするものか

CNI は Linux コンテナのネットワークインターフェースを設定するための仕様と Go ライブラリ群である。リポジトリが持つのは 3 つ、書かれた仕様、ランタイムが組み込む参照 Go ライブラリ、サンプルの CLI ツールだ。データプレーンは意図的に同梱しない。`bridge` や `host-local` といった実プラグインは別リポジトリにあり、Calico / Cilium / Flannel などは同じ契約をサードパーティが実装したものである (`README.md:13`)。

契約が狭いのは意図的だ。CNI はコンテナのネットワーク接続性と、コンテナ削除時の割り当てリソース回収だけに関心を持つ (`README.md:13`)。すべてはプロセス境界をまたいで行われる。ランタイムがプラグインバイナリを exec し、意図を環境変数と stdin の JSON で渡し、stdout から JSON の結果を読み取る。

containerd / CRI-O / kubelet のようなランタイムは `libcni` ライブラリをリンクし、ディスク上のネットワーク設定をパースしてプラグインを順に呼び出す。設定の注入、プラグインの探索、結果のキャッシュ、バージョン折衝はライブラリが担うので、各プラグインは小さく保たれる。

## いつ使うか

- コンテナランタイムを作る・拡張していて、Pod をネットワークに接続する標準的な方法が欲しいとき。
- ネットワークプラグインを書いていて、ランタイムごとのコードなしに任意の CNI 準拠ランタイムで動かしたいとき。
- Kubernetes を運用し、いずれも CNI を話すプラグイン (Calico / Cilium / Flannel / Multus) を選んだり連結したりするとき。
- ターンキーなデータプレーンやネットワークポリシーエンジンが欲しい場合は、ここではない。CNI はインターフェースであり、その機能を提供する実装は別途選ぶ。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [containernetworking/cni (GitHub)](https://github.com/containernetworking/cni)
2. [CNI SPEC.md](https://github.com/containernetworking/cni/blob/main/SPEC.md)
3. [cnitool docs](https://github.com/containernetworking/cni/blob/main/Documentation/cnitool.md)
4. [containernetworking/plugins (reference plugins)](https://github.com/containernetworking/plugins)
5. [CNCF hosts Container Networking Interface (CNI)](https://www.cncf.io/blog/2017/05/23/cncf-hosts-container-networking-interface-cni/)
6. [CNCF project page: Container Network Interface (CNI)](https://www.cncf.io/projects/container-network-interface-cni/)
7. [CNCF becomes home to rkt](https://www.cncf.io/announcements/2017/03/29/cloud-native-computing-foundation-becomes-home-pod-native-container-engine-project-rkt/)
8. [Nuage: CNM vs CNI container networking standards](https://www.nuagenetworks.net/blog/container-networking-standards/)
9. [Kubernetes Network Plugins](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/)
10. [Kubernetes CNI comparison 2026 (OneUptime)](https://oneuptime.com/blog/post/2026-02-20-kubernetes-cni-comparison/view)
11. [Civo: Calico vs Flannel vs Cilium](https://www.civo.com/blog/calico-vs-flannel-vs-cilium)

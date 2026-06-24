# Cilium

> Kubernetes 向けの eBPF ベースのネットワーキング・セキュリティ・可観測性。データパスはカーネル内で動き、ポリシーは IP アドレスではなくワークロードの identity に対して書く。

- **カテゴリ**: Service Mesh & Networking
- **CNCF 成熟度**: Graduated
- **言語**: Go (エージェント・operator・コントロールプレーン)、datapath は C を eBPF バイトコードにコンパイル
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cilium/cilium](https://github.com/cilium/cilium)
- **ドキュメント基準コミット**: `fe36ad62` (2026-06-22, `main`、`VERSION` は `1.20.0-dev`)

## 何をするものか

Cilium は Kubernetes 向けの CNI (Container Network Interface) プラグインである。pod 同士を接続し、サービストラフィックをロードバランスし、ネットワークポリシーを適用する。際立つのは処理が起きる場所だ。実際のパケット処理は tc / XDP フックにアタッチされた eBPF プログラムとしてカーネル内で動き、ユーザ空間の Go エージェントはそのプログラムが何をすべきかを決める。

全体をまとめるモデルが identity である。Cilium は各ワークロードのラベル集合を数値の security identity にマッピングし、IP アドレスではなくその identity に対してポリシーを書く。ユーザ空間のエージェント (`cilium-agent`、DaemonSet で各ノードに 1 つ) が設定を計算して eBPF map に書き込み、カーネルがユーザ空間に戻ることなく実トラフィックを処理する。クラスタスコープの operator は IPAM、identity のガベージコレクション、CRD 管理を担う。

datapath の上に、Cilium はフロー可観測性のための Hubble を同梱し、per-node Envoy を使ったサイドカーレスのサービスメッシュを提供する。GKE Dataplane V2 のネットワーキング層であり、EKS / AKS でも選択できる。

## いつ使うか

- Kubernetes を運用していて、kube-proxy を置換し L4 ロードバランシングを iptables ではなく eBPF で行う CNI が欲しい。
- ルールがラベル集合 (identity) を鍵にするため、IP 数ではなくワークロード数に応じてスケールするネットワークポリシーが必要。
- サイドカーを入れずに L7 対応ポリシー (HTTP, gRPC, Kafka) や Hubble によるフローレベルの可観測性が欲しい。
- マルチクラスタネットワーキング (ClusterMesh)、透過暗号化 (WireGuard/IPsec)、BGP、Egress Gateway を 1 つの統合スタックから使いたい。

ノードのカーネルが Cilium の必要とする eBPF 機能には古すぎる場合や、マネージドプラットフォームが置換できない別 CNI に固定している場合は、向かない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [cilium/cilium リポジトリ](https://github.com/cilium/cilium)
2. [cilium/cilium USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md)
3. [cilium/cilium MAINTAINERS.md](https://github.com/cilium/cilium/blob/main/MAINTAINERS.md)
4. [cilium/community GOVERNANCE.md](https://github.com/cilium/community/blob/main/GOVERNANCE.md)
5. [GitHub API repos/cilium/cilium](https://api.github.com/repos/cilium/cilium)
6. [CNCF が Cilium の graduation を発表 (2023-10-11)](https://www.cncf.io/announcements/2023/10/11/cloud-native-computing-foundation-announces-cilium-graduation/)
7. [CNCF projects の Cilium](https://www.cncf.io/projects/cilium/)
8. [CNCF Cilium Project Journey Report](https://www.cncf.io/reports/cilium-project-journey-report/)
9. [Cloud Native Now: The Cilium Story So Far](https://cloudnativenow.com/features/the-cilium-story-so-far/)
10. [Heavybit Kubelist Podcast Ep.30: Cilium and eBPF with Thomas Graf](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-30-cilium-and-ebpf-with-thomas-graf-of-isovalent)
11. [The Register: Cisco acquires Isovalent (2023-12-22)](https://www.theregister.com/2023/12/22/cisco_acquires_isovalent)
12. [The New Stack: Cisco Gets Cilium](https://thenewstack.io/cisco-gets-cilium-what-it-means-for-developers/)
13. [The New Stack: Cilium CNCF Graduation](https://thenewstack.io/cilium-cncf-graduation-could-mean-better-observability-security-with-ebpf/)
14. [Cilium Getting Started](https://docs.cilium.io/en/stable/gettingstarted/)

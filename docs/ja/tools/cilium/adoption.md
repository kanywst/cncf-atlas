# 採用事例・エコシステム

## 誰が使っているか

リポジトリの [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) には 174 件の自己申告エントリがあり、production 利用を対象とするルールが明記されている。以下の組織名はそのファイルから取った。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Google | GKE Dataplane V2 は Cilium ベース | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Amazon Web Services | クラウド/インフラ事業者として掲載 | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Alibaba Cloud | クラウド/インフラ事業者として掲載 | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| DigitalOcean | クラウド/インフラ事業者として掲載 | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Datadog | エンドユーザとして掲載 | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Adobe | エンドユーザとして掲載 | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Capital One | エンドユーザとして掲載 | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| GitLab | エンドユーザとして掲載 | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| ByteDance | エンドユーザとして掲載 | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |
| Canonical | ベンダ/エンドユーザとして掲載 | [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md) |

同ファイルの他のエントリには Equinix, Exoscale, Gcore, Civo, CoreWeave, Kakao, IKEA IT AB, Confluent, Elastic Path, Guidewire, Daimler Truck AG, F5, Cybozu, Bitnami がある。CNCF も採用規模を [Cilium Project Journey Report](https://www.cncf.io/reports/cilium-project-journey-report/) で別途追跡している。

## 採用のシグナル

`cilium/cilium` の GitHub API より、2026-06-22 取得: stars 24,565、forks 3,842、watchers 307、open issues 1,004。リポジトリは 2015-12-16 作成 ([GitHub API](https://api.github.com/repos/cilium/cilium))。GitHub contributors API のコントリビュータ数は anon 含めおよそ 1,300 以上までページネーションする。graduation 時点で CNCF は 7 社のメンテナ企業と 800 人超の個人コントリビュータを挙げた ([CNCF announcement](https://www.cncf.io/announcements/2023/10/11/cloud-native-computing-foundation-announces-cilium-graduation/))。

ガバナンス: メンテナとコミッタは [MAINTAINERS.md](https://github.com/cilium/cilium/blob/main/MAINTAINERS.md) に列挙される。ガバナンス文書とコントリビュータラダーは別リポジトリ [cilium/community](https://github.com/cilium/community/blob/main/GOVERNANCE.md) にある。

## エコシステム

Cilium は複数の層にまたがり、周囲のツールもそれに従う。Hubble (同プロジェクト) は eBPF datapath の上にフロー可視化を提供する。姉妹プロジェクトの Tetragon は eBPF ベースのランタイムセキュリティを加え、Cilium と組む。プラットフォーム統合として、Cilium は GKE Dataplane V2 の基盤であり、EKS / AKS でも選択できる。プロジェクト内の機能には kube-proxy 置換、BGP、WireGuard/IPsec 暗号化、マルチクラスタ向け ClusterMesh、Gateway API と Ingress 対応、Egress Gateway がある ([CNCF announcement](https://www.cncf.io/announcements/2023/10/11/cloud-native-computing-foundation-announces-cilium-graduation/), [The New Stack](https://thenewstack.io/cilium-cncf-graduation-could-mean-better-observability-security-with-ebpf/))。

## 代替候補

Cilium は複数の層にまたがるため、競合も層ごとに異なる。CNI 層の代替は Calico, Flannel, Weave Net, Antrea, AWS VPC CNI。サービスメッシュ層では Istio や Linkerd と重なり、ここでの Cilium の売りは eBPF と per-node Envoy を使ったサイドカーレスメッシュだ ([The New Stack](https://thenewstack.io/cilium-cncf-graduation-could-mean-better-observability-security-with-ebpf/))。

| 代替 | 違い |
| --- | --- |
| Calico | eBPF データプレーンも持つが、Cilium は全体で eBPF が第一級 |
| Flannel | identity ベースポリシーや kube-proxy 置換のないシンプルなオーバーレイ |
| Weave Net | eBPF datapath を持たないオーバーレイネットワーキング |
| Antrea | eBPF ではなく Open vSwitch ベースの datapath |
| AWS VPC CNI | pod を VPC ENI に直結。独自の identity ベースポリシーエンジンは持たない |
| Istio / Linkerd | サービスメッシュ特化。サイドカー (または per-node プロキシ) 方式に対し、Cilium は eBPF + per-node Envoy |

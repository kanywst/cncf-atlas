# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS.md` は無く、検証可能な本番採用の出典も見つからなかった。そのため、このディープダイブでは名前付きの本番採用組織を挙げない。捏造するくらいなら、こう明記する方がましだ。

README は企業名を挙げているが、それは本番リファレンスではなくコントリビュータの所属としてだ。「Tencent、intel、ByteDance、Ant Group、Kanzhun、Purple Mountain Laboratories、Dmall、KuGou、Futu、WeBank、QQ Music、37Games からの 30+ のコントリビュータ」と記している ([README](https://github.com/clusternet/clusternet))。メンテナは Tencent、Intel、Purple Mountain Laboratory に所属する ([MAINTAINERS.md](https://github.com/clusternet/clusternet/blob/main/MAINTAINERS.md))。これらは開発リソースの出所であって、本番利用の証拠ではないと捉えるべきだ。

## 採用のシグナル

2026-06-28 時点で、GitHub はおおよそ次を報告している:

| シグナル | 値 | 出典 |
| --- | --- | --- |
| Stars | 1,440 | [repo metadata](https://api.github.com/repos/clusternet/clusternet) |
| Forks | 208 | [repo metadata](https://api.github.com/repos/clusternet/clusternet) |
| Open issues | 70 | [repo metadata](https://api.github.com/repos/clusternet/clusternet) |
| Contributors | ~48 | [contributors](https://api.github.com/repos/clusternet/clusternet/contributors) |
| Releases | 計 28、最新 `v0.18.1` (2025-08-13) | [releases](https://api.github.com/repos/clusternet/clusternet/releases) |

Clusternet は 2023-03-07 に CNCF の Sandbox 成熟度で受理された ([CNCF Projects](https://www.cncf.io/projects/clusternet/)、申請 [cncf/sandbox#10](https://github.com/cncf/sandbox/issues/10))。

## エコシステム

Clusternet は README のコア機能にある通り、周辺のいくつかのツールと連携する ([README](https://github.com/clusternet/clusternet)):

- Helm は OCI (Open Container Initiative) チャートを含め、HelmChart と HelmRelease CRD を通じて組み込まれている。
- Cluster API で作られたクラスタは自動登録できる。
- マルチクラスタサービスは `mcs-api` (Kubernetes multi-cluster Services API) を使う。
- 監視は Prometheus と Grafana で動く。
- クラスタ間ネットワークは Submariner、Istio、Linkerd を使える。
- `client-go` ラッパー (`src/examples/clientgo`) と、`kubectl krew install clusternet` で入れる `kubectl` プラグイン (`src/README.md:79`) がプログラム的アクセスと CLI アクセスをカバーする。

## 代替候補

Clusternet は他の CNCF マルチクラスタプロジェクトと同じ領域にある。差別化点はネットワーク寄りだ。NAT 越しでも親から子に到達できるようにする逆方向 WebSocket トンネルと、既存マニフェストをそのまま流せる shadow API がそれにあたる ([Palark blog](https://palark.com/blog/cncf-sandbox-2023-h1/))。

| 代替 | 違い |
| --- | --- |
| [Karmada](https://github.com/karmada-io/karmada) | 配布とスケジューリングが中心。Clusternet はクラスタ間 `kubectl` プロキシも第一級機能として扱う。 |
| [Open Cluster Management](https://github.com/open-cluster-management-io) | placement とポリシーに寄った hub-and-agent モデル。Clusternet は Kubernetes スケジューラフレームワークと shadow API に依る。 |
| [KubeVela](https://github.com/kubevela/kubevela) | Open Application Model に基づくアプリケーションデリバリ。Clusternet は素の Kubernetes オブジェクトと `kubectl` により近い。 |
| [KubeStellar](https://github.com/kubestellar/kubestellar) | 別のマルチクラスタ構成管理プロジェクト。binding と transport のモデルが異なる。 |

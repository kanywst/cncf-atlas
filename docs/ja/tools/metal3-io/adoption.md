# 採用事例・エコシステム

## 誰が使っているか

CNCF の incubation 発表は "growing list of adopters" を明記している。以下はそこで挙げられた組織である ([出典 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/))。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Red Hat | プロジェクトリード。ベアメタル払い出し | [CNCF blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/) |
| Ericsson | プロジェクトリード。telco/edge のベアメタル | [CNCF blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/) |
| Fujitsu | 採用企業として記載 | [CNCF blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/) |
| IKEA | 採用企業として記載 | [CNCF blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/) |
| SUSE | 採用企業として記載 | [CNCF blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/) |

## 採用のシグナル

baremetal-operator リポジトリ単体で、2026-06-24 に GitHub API で観測: star 743、fork 316、contributors 約 133、Apache-2.0、created 2019-01-23、最新リリース v0.13.0 ([出典 11](https://github.com/metal3-io/baremetal-operator))。

CNCF incubation 発表時点のプロジェクト全体の数値 (2025-08 観測): GitHub star 1,523、merged PR 8,368、issue 1,434、contributors 186、releases 187、active contributing org 57 ([出典 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/))。

README には OpenSSF Best Practices (project 9985)、OpenSSF Scorecard、CLOMonitor のバッジが掲示される。ガバナンスとして脆弱性開示プロセス、依存の自動更新、依存の SHA pin を整備している ([出典 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/))。

## エコシステム

baremetal-operator の周辺で、metal3-io org はいくつかの companion プロジェクトを提供する ([出典 1](https://github.com/metal3-io/baremetal-operator), [出典 7](https://metal3.io/))。

- `cluster-api-provider-metal3` (CAPM3): Cluster API 連携。BMO は `Metal3MachineTemplate` を介してその infrastructure backend となる。
- `ip-address-manager` (IPAM): 払い出したホストの IP アドレス管理。
- `ironic-standalone-operator` (IrSO): Ironic 自体を Kubernetes 上に展開する。
- `ironic-image` / `ironic-agent-image`: Ironic サービスと in-band エージェントのコンテナイメージ。
- `metal3-dev-env` / `metal3-helm-chart`: 開発環境と Helm パッケージング。

## 代替候補

本質的な差はこうだ。Metal3 は CRD ファースト (`BareMetalHost` が一級リソース)、Ironic の実績あるハード対応を再利用、ベアメタル向け Cluster API の純正 infrastructure provider、の 3 点。汎用 BMaaS はそれぞれの軸で異なる ([出典 8](https://thenewstack.io/bare-metal-in-a-cloud-native-world/), [出典 9](https://github.com/alexellis/awesome-baremetal/blob/master/README.md), [出典 10](https://www.spectrocloud.com/blog/how-to-provision-bare-metal-k8s-clusters-with-cluster-api-and-canonical-maas))。

| 代替 | 違い |
| --- | --- |
| OpenStack Ironic (standalone) | Metal3 が乗っている当の BMaaS エンジン。IPMI/Redfish でベンダ非依存だが Kubernetes ネイティブではない。競合ではなく土台 |
| Canonical MAAS | 成熟した IaaS 風 API で DNS・ネット管理込み。外部システムで Kubernetes ネイティブではない。CAPI 対応は `cluster-api-provider-maas` 経由 |
| Tinkerbell | 各 provisioning ステップを Docker workflow image で定義する microservices 型。Ironic を使わず、宣言的 IaC 寄り |
| Sidero (Sidero Labs) | CAPI 対応のベアメタル管理。Talos Linux 前提に寄る |
| Foreman / xCAT | 汎用ライフサイクル管理・大規模クラスタ管理。Kubernetes ネイティブではない |

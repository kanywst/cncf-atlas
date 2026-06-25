# 採用事例・エコシステム

## 誰が使っているか

以下はプロジェクトの [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) の記載で、コミット `55a003d` のリポジトリ実物で確認した。年はエントリに記載の開始年。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| NVIDIA | Kubernetes と KubeVirt を基盤に GeForce NOW などを提供 (2018) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| Cloudflare | コアデータセンタで CI runner などコンテナ化しづらい用途に利用 (2018) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| CoreWeave | GPU 主体の K8s ネイティブクラウド。VDI など非コンテナ化ワークロードをベアメタルに併置 (2020) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| Civo | テナントクラスタの provisioning (2020) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| Arm | aarch64 上の KubeVirt 性能最適化 (2021) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| Aussie Broadband | ベアメタル上で VM とコンテナを橋渡し (2023) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |
| Microsoft | Azure Operator Nexus で VM ワークロードをホスト (Vendor, 2023) | [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) |

CNCF は、KubeVirt と Kube-OVN でソブリンクラウドを構築した Swisscom のケーススタディを報じている ([CNCF blog](https://www.cncf.io/blog/2022/04/19/kubevirt-becomes-a-cncf-incubating-project/))。

## 採用のシグナル

- GitHub スター: 6,917、フォーク: 1,710 (`gh repo view`、観測 2026-06-24)。
- コントリビュータ: 約 361 人 (GitHub contributors API のページネーション、観測 2026-06-24)。
- リリース頻度: v1.0 以降は年 3 回。最新は `v1.8.4` (2026-06-16)。
- 2025 年 11 月時点で CNCF Graduation のプロセス中、ADOPTERS は 41 件 ([CNCF projects: KubeVirt](https://www.cncf.io/projects/kubevirt/))。

## エコシステム

KubeVirt はクラウドネイティブスタックの残りを置き換えるのではなく、組み合わせて使う前提だ。報じられている統合: ストレージは CDI と Rook、L2 ネットワークは Multus と Kube-OVN、サービスメッシュは Istio、自動化は Tekton と Argo CD、移行は Konveyor ([CNCF v1.0 blog](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/))。2 つの製品が KubeVirt を内包する: Red Hat OpenShift Virtualization ([Red Hat](https://www.redhat.com/en/topics/virtualization/what-is-kubevirt)) と SUSE Rancher Harvester ([SUSE](https://www.suse.com/c/rancher_blog/comparing-hyperconverged-infrastructure-solutions-harvester-and-openstack/))。

## 代替候補

本質的な差: KubeVirt は別建ての hypervisor 基盤を立てない。既存 Kubernetes クラスタに CRD で VM を載せ、VM と Pod が namespace・`NetworkPolicy`・`StorageClass`・監視スタックを共有する。Harvester や OpenShift Virtualization はこの上に構築された製品だ。

| 代替 | 違い |
| --- | --- |
| SUSE Harvester | KubeVirt + Longhorn + RKE2 を HCI アプライアンス ISO に固めたもの。生の KubeVirt ではない ([SUSE](https://www.suse.com/c/rancher_blog/comparing-hyperconverged-infrastructure-solutions-harvester-and-openstack/)) |
| OpenShift Virtualization | KubeVirt の Red Hat 商用ディストリビューション ([Red Hat](https://www.redhat.com/en/topics/virtualization/what-is-kubevirt)) |
| OpenStack | フル機能のクラウド基盤。ベアメタルとネットワークで先行するが Kubernetes ネイティブではなくアプリ管理層は弱い ([Ubuntu](https://ubuntu.com/blog/kubernetes-vs-openstack)) |
| VMware vSphere | 従来のエンタープライズ標準。Broadcom 買収後のライセンス変更で移行検討が増加 ([Portworx](https://portworx.com/blog/top-5-kubernetes-based-alternatives-to-vmware/)) |

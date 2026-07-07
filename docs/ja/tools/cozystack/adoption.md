# 採用事例・エコシステム

## 誰が使っているか

最も明確な証拠はプロジェクト自身の ADOPTERS.md で、組織が連絡先と日付を添えて本番利用を自己申告している (出典 3)。名前の挙がる採用企業は旧 CIS 圏と欧州のホスティング事業者に偏る。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Ænix | 提供するマネージドサービスの主力ツール。プロジェクトの当初スポンサー (2024-02-14) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| Mediatech | Kubernetes ディストリビューションとして利用 (2024-05-01) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| Bootstack | 本番プラットフォーム (2024-08-01) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| gohost | Cozystack で管理するベアメタル Kubernetes を提供するカザフスタンのホスティング事業者 (2024) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| Urmanac | 本番利用。メンテナを輩出 (2024-12-04) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| Hidora / Hikube | スイスのソブリンクラウド。メンテナを輩出 (2025-09-17) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| QOSI | 中央アジアの GPU クラウド (2025-10-04) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |
| Cloupard | カザフスタン・ウズベキスタンのパブリッククラウド (2025-12-18) | [ADOPTERS.md](https://github.com/cozystack/cozystack/blob/main/ADOPTERS.md) |

このリストは自己申告なので、検証済みの導入台帳ではなく、誰が本番でこのプラットフォームを運用しているかのシグナルとして扱う。

## 採用のシグナル

2026-06-29 に GitHub REST API で観測 (出典 8):

- スター: 2,132
- fork: 173
- コントリビュータ: 50 人以上
- open issue: 373

採用企業の地理 (旧 CIS 圏と欧州のホスティング/クラウド事業者) は、他人のクラウドにアプリを載せるチームではなく自前のクラウドを作る事業者を狙うという、プロジェクトの狙いと一致する。

## エコシステム

Cozystack は単体ツールというより他プロジェクトの統合物なので、エコシステムはほぼ依存先そのものだ。Flux でリコンサイルし (helm-controller をバッキングストアに使う)、KubeVirt + CDI で VM を動かし、Cluster API + Kamaji でテナントのコントロールプレーンを組み、CloudNativePG で Postgres をプロビジョニングし、LINSTOR / Piraeus + SeaweedFS にデータを置き、Cilium + Kube-OVN でネットワークを組み、MetalLB でロードバランスし、Talos Linux で起動し、Keycloak で認証し、VictoriaMetrics + Grafana で観測する。これらは `packages/system/` の chart として同梱される (README, 出典 2)。Ænix は Cozystack を商用製品・サポートとして提供している (出典 4)。

## 代替候補

誠実な比較は、どの層を重視するかで変わる。

| 代替 | 違い |
| --- | --- |
| OpenStack | 同じく私設 IaaS を作るが、独自の大きなスタック上。Cozystack は CNCF 部品を組み合わせ、運用を Kubernetes と Flux の中に閉じる。 |
| Harvester (SUSE) | 同じく KubeVirt ベースの HCI だが、VM とハイパーコンバージド基盤が中心。Cozystack はその上にマネージド Kubernetes (Kamaji, Cluster API) と DBaaS を足す。 |
| Kubermatic, Gardener, Rancher | マネージド Kubernetes 提供で重なるが、Cozystack は VM・DBaaS・テナント分離・課金志向のカタログをまとめ、ホスティング事業者向けだ。 |
| Crossplane, KubeVela | 同じく Kubernetes リソースからクラウド的 API を出すが、汎用の合成基盤だ。Cozystack は具体的な部品 (KubeVirt, CNPG, LINSTOR, Cilium) を統合済みの完成プラットフォームを配る。 |

すぐ使えるベアメタル向け私設クラウドプラットフォームが欲しく、その意見の入ったスタックを運用できるなら Cozystack を選ぶ。既存インフラの上に独自の抽象を定義したいなら Crossplane のような汎用合成基盤を、必要が PaaS でなく IaaS なら Harvester か OpenStack を選ぶ。

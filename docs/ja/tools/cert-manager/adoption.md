# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS` ファイルはないので、名指しの採用は出典を示せるものに限られる。CNCF graduation 発表で名指しされたのは Giant Swarm である。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Giant Swarm | cert-manager を Cluster API ベースの Kubernetes プラットフォームに不可欠なコンポーネントと位置づけ | [出典 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/) |

## 採用のシグナル

名指しの採用以外では、公開シグナルは大きい。2024-11-12 の graduation 時点で、プロジェクトと CNCF は月間約 5 億ダウンロード、新規本番クラスタの 86% がデフォルトで導入、450 名以上のコントリビュータ、200 以上のリリースを報告した ([出典 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/), [出典 4](https://cert-manager.io/announcements/2024/11/12/cert-manager-graduation/))。

GitHub では `cert-manager/cert-manager` リポジトリは 2026-06-22 時点で 13,873 stars・2,383 forks だった ([出典 1](https://github.com/cert-manager/cert-manager))。CNCF Graduated プロジェクトである ([出典 9](https://www.cncf.io/projects/cert-manager/))。

## エコシステム

cert-manager は単体ではなく補完ツールと併用されるのが普通である。trust-manager (同じ cert-manager org) は CA バンドルを配布し、external-secrets は外部ストアからシークレットを同期する。どちらもよく併用される ([出典 5](https://infisical.com/blog/best-certificate-management-tools))。

issuer 側では Let's Encrypt など ACME CA、HashiCorp Vault PKI、Venafi と CyberArk、CyberArk Certificate Manager、EJBCA、クラスタ内 / 自己署名 CA と統合し、Ingress コントローラや Gateway API に証明書を供給する ([出典 1](https://github.com/cert-manager/cert-manager), [出典 5](https://infisical.com/blog/best-certificate-management-tools))。商用では CyberArk Certificate Manager for Kubernetes (旧 Venafi TLS Protect) が cert-manager の上に discovery・ポリシー・FIPS・サポートを足し、Keyfactor は cert-manager issuer 経由で Kubernetes に対応する ([出典 5](https://infisical.com/blog/best-certificate-management-tools), [出典 6](https://www.cyberark.com/products/certificate-manager-for-kubernetes/))。

## 代替候補

cert-manager はクラスタ内 Kubernetes 証明書自動化の事実上の標準である ([出典 5](https://infisical.com/blog/best-certificate-management-tools))。真の代替は drop-in 置換ではなく哲学の違いにある。

| 代替 | 違い |
| --- | --- |
| HashiCorp Vault PKI | 短命証明書を API でオンデマンド発行する。Kubernetes では cert-manager の代わりではなくバックエンドとして併用されるのが普通 ([出典 5](https://infisical.com/blog/best-certificate-management-tools)) |
| Venafi / Keyfactor (エンタープライズ CLM) | フルな証明書ライフサイクル管理だが per-identity 課金が ephemeral な Kubernetes ワークロードでスケールしにくく、そこが cert-manager の OSS 優位 ([出典 5](https://infisical.com/blog/best-certificate-management-tools)) |
| CyberArk Certificate Manager for Kubernetes | cert-manager の上に discovery・ポリシー・FIPS・サポートを足す商用レイヤであり、別エンジンではない ([出典 6](https://www.cyberark.com/products/certificate-manager-for-kubernetes/)) |

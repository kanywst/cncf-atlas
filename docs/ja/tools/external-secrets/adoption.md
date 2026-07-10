# 採用事例・エコシステム

## 誰が使っているか

以下の組織はプロジェクトの [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) (参照 2026-07-09) に記載されたものである。本ディープダイブはそのファイルが挙げる範囲だけを列挙し、それ以外を足さない。GoDaddy は前身プロジェクト (KES) の起源として別枠で挙げ、エンジニアリングブログに記録がある。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| GoDaddy | ESO の前身 KES を作り OSS 化した | [GoDaddy engineering](https://www.godaddy.com/resources/news/kubernetes-external-secrets) |
| Mercedes-Benz Tech Innovation | 記載された採用組織 | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |
| SAP | 記載された採用組織 | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |
| Cisco | 記載された採用組織 | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |
| Grafana Labs | 記載された採用組織 | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |
| Red Hat OpenShift | 記載された採用組織 | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |
| Amadeus, Codefresh, Container Solutions, Criteo, Elastic, Epidemic Sound, Fivetran, Form3, GoTo, Hostinger, Mixpanel, OVHcloud, Radio France, Roche, VMware Tanzu | 記載された採用組織 | [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) |

## 採用のシグナル

2026-07-09 時点 (GitHub API): スター 6,730、フォーク 1,357、リポジトリ作成は 2020-11-17。CNCF Sandbox プロジェクト (2022-07-26 受理) であり、README に CII Best Practices と OpenSSF Scorecard のバッジを掲げる (`README.md`)。リリースは Helm チャートタグとして切られ、基準コミット時点の最新は `helm-chart-2.7.0` (2026-06-26)。CNCF TOC にはプロジェクトの健全性レビューがオープンしている ([TOC #1819](https://github.com/cncf/toc/issues/1819))。これはガバナンス上の状態であって採用シグナルではないため、完全性のためにのみ記す。

## エコシステム

ESO は外部のシークレットマネージャとクラスタの間に位置する。ツリー内で `providers/v1/` 配下に 41 プロバイダを同梱し、AWS Secrets Manager と Parameter Store、HashiCorp Vault と OpenBao、GCP Secret Manager、Azure Key Vault、IBM Cloud、Akeyless、CyberArk Conjur、1Password、Doppler、Bitwarden、Pulumi ESC などをカバーする。Argo CD や Flux といった GitOps ツールと併用されるのが定番で、`ExternalSecret` と `SecretStore` リソースを Git にコミットし、実際の値はバックエンドに残す。`ClusterExternalSecret` はシークレットを namespace 横断で fan-out し、`PushSecret` はクラスタのシークレットをプロバイダへ書き戻す。

## 代替候補

ESO の特徴は、マルチバックエンドであり、常にネイティブな Kubernetes `Secret` を実体化する点で、既存ワークロードがシークレットをそのまま利用できることにある。

| 代替 | 違い |
| --- | --- |
| HashiCorp Vault Secrets Operator (VSO) | HashiCorp 公式のオペレータで Vault 専用。独自 CRD で dynamic secret / lease 更新に強い。ESO は 41 プロバイダのマルチバックエンド |
| Secrets Store CSI Driver | Kubernetes Secret を作らず CSI ボリューム経由で Pod に値をマウントする (オプションで同期も可)。ESO は常に Secret を作るため GitOps や既存ワークロードに馴染むが、素材は etcd に置かれる |
| Sealed Secrets | Secret を暗号化して Git にコミット可能にし、外部ストアを持たない。ESO は値を外部バックエンドに保ち、Git には参照だけをコミットする |

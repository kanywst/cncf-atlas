# 採用事例・エコシステム

## 誰が使っているか

以下の組織はプロジェクトの [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) に記載され、それぞれユースケースが明示されている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Nike | 開発から本番まで数千リソースを管理する内部 developer platform | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| Nokia | network service の本番デプロイ向けマルチクラウドオーケストレーション | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| SAP | 100+ の KRM control plane と数千の managed resource (2024-02 時点)。provider も貢献 | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| IBM | IBM Cloud 向け provider と service mapping framework | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| Grafana Labs | 内部 developer platform の control plane | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| Elastic | Elastic Serverless 向けにマルチクラウドでリソースを展開 | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| NASA Science Cloud (SMCE) | Open Science Studio (JupyterHub ベース) を composition で展開 | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| Deutsche Kreditbank (DKB) | 10+ の EKS クラスタと数千リソース | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |
| DB Systel (Deutsche Bahn) | Backstage と連携した Developer Experience Platform のバックボーン | [ADOPTERS.md](https://github.com/crossplane/crossplane/blob/main/ADOPTERS.md) |

## 採用のシグナル

graduation 時点で CNCF は、crossplane org 全体で 3,000+ contributors と 450+ organizations、231 の CNCF プロジェクト中 PR author 数で #13 (上位 10%)、70+ の public adopters を報告した ([graduation announcement](https://www.cncf.io/announcements/2025/11/06/cloud-native-computing-foundation-announces-graduation-of-crossplane/))。

`crossplane/crossplane` リポジトリ単体では、2026-06-22 の GitHub API で stars 11,787、forks 1,201、open issues 190 だった ([GitHub API](https://api.github.com/repos/crossplane/crossplane))。このリポジトリ単体の contributors は API ページング上 ~276。3,000 という数字は org 全体を指す。

## エコシステム

- **Provider** は managed resource 型をインストールする。AWS・Azure・GCP の provider は Upjet で Terraform provider から生成され、その他はコミュニティ製が多数ある。
- **Composition function** は composition ロジックを各種言語で追加する: KCL・Python・Go・go-templating・patch-and-transform など。`function-kro` は kro の YAML+CEL を Crossplane pipeline に持ち込む ([function-kro blog](https://blog.crossplane.io/function-kro-yaml-cel/))。
- **パッケージレジストリ** `xpkg.crossplane.io` はパッケージを配布し、graduation の一環で確立された。
- **CLI** には `crossplane render` (`cmd/crossplane/render/render.go`) があり、apply 前にローカルで pipeline をプレビューできる。

## 代替候補

Crossplane は継続的に reconcile するため drift を自動修正し、状態を別の state ファイル (ロック付き) ではなく etcd 内の CRD として持ち、XRD と Composition でチームが自前の API を定義して安全な開発者セルフサービスを提供できる。コストは Kubernetes の知識が前提になることである ([platformengineering.org の比較](https://platformengineering.org/blog/terraform-vs-pulumi-vs-crossplane-iac-tool))。

| 代替 | 違い |
| --- | --- |
| Terraform / OpenTofu | HCL で CLI `apply`、管理された state ファイル。最大の provider エコシステム。補完的: Crossplane provider の多くは Upjet で Terraform provider から生成される |
| Pulumi | 汎用言語 (Python・TypeScript) で IaC。CLI または Automation API。Kubernetes 不要 ([Pulumi の比較](https://www.pulumi.com/docs/iac/comparisons/crossplane/)) |
| Kro / Argo / Kustomize / Helm | アプリ定義系ツール。`function-kro` で kro の定義を Crossplane pipeline 内で実行できる ([function-kro blog](https://blog.crossplane.io/function-kro-yaml-cel/)) |

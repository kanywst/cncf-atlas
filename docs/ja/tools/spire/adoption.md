# 採用事例・エコシステム

## 誰が使っているか

プロジェクトの `ADOPTERS.md` は、notable contribution ありと明記した end user として次を挙げている (`ADOPTERS.md:7-19`): Anthem・Bloomberg・ByteDance・Duke Energy・GitHub・Netflix・Niantic・Pinterest・Square・Twilio・Uber・Unity Technologies・Z Lab Corporation。CNCF の graduation アナウンスは別途、本番 end user として Anthem・GitHub・Netflix・Niantic・Pinterest・Uber を名指しした。

下の表は、公開ケーススタディまたはトークがある採用企業を挙げる。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| AWS | App Mesh on EKS で SPIFFE/SPIRE による mTLS | [AWS blog](https://aws.amazon.com/blogs/containers/using-mtls-with-spiffe-spire-in-app-mesh-on-eks/) |
| Anthem | SPIFFE と SPIRE による zero trust framework | [upshotstories](https://upshotstories.com/stories/developing-a-zero-trust-framework-at-anthem-using-spiffe-and-spire) |
| Anthropic | SPIRE 発行の JWT-SVID と SPIRE OIDC Discovery Provider でワークロードを Claude API に認証 | [Anthropic docs](https://platform.claude.com/docs/en/manage-claude/wif-providers/spiffe) |
| Bloomberg | TPM ベースのノード attestation | [トーク](https://youtu.be/30S0sKRxzjM) |
| Uber | ワークロードスケジューラとの統合 | [トーク](https://youtu.be/H5IlmYmEDKk?t=4703) |
| Square | ハイブリッドインフラと Lambda への mTLS アイデンティティ | [Square blog](https://developer.squareup.com/blog/providing-mtls-identities-to-lambdas/) |

## 採用のシグナル

`gh api repos/spiffe/spire` を 2026-06-23 に測定:

- GitHub stars: 2,407、forks: 623、watchers: 79。
- contributors: 222 (`repos/spiffe/spire/contributors?per_page=1` の last ページ番号)。
- リポジトリ作成 2017-08-11、最新リリース `v1.15.1` (2026-05-28)。

SPIRE は CNCF Graduated プロジェクトで、graduation には Cure53 のサードパーティ監査と CNCF TAG Security レビューが必要だった ([CNCF アナウンス](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/))。

## エコシステム

`ADOPTERS.md:41-67` が挙げる連携・隣接ツール: Envoy (SDS 経由で SVID 配布)・Istio・Linkerd・Consul・Dapr・cert-manager の `csi-driver-spiffe`・Sigstore Fulcio・Tekton Chains・HashiCorp Vault・Traefik・Tornjak (SPIRE 管理 UI)・go-spiffe ライブラリ。SPIRE OIDC Discovery Provider は JWT-SVID を OIDC トークンとして外部に出すので、クラウド IAM などが消費できる。

## 代替候補

SPIRE を際立たせる特徴は、プラグイン式の多段 attestation (ノード + ワークロード)、X509-SVID と JWT-SVID の両方、信頼ドメイン間 federation、秘密ゼロのブートストラップ、ベンダ非依存の SPIFFE 準拠だ。

| 代替 | 違い |
| --- | --- |
| Istio Citadel / istiod | SPIFFE ID を使うが独自 CA でメッシュ内に閉じる。SPIRE はメッシュ非依存で VM・ベアメタル・Lambda までまたぐ |
| HashiCorp Vault PKI | 汎用シークレットストア兼 PKI で、誰が鍵を要求してよいかの attestation がない。attestation こそ SPIRE の中核 |
| AWS IAM Roles Anywhere / GCP Workload Identity | 単一クラウドに閉じる。SPIRE はマルチクラウド + オンプレを 1 つの信頼ドメインと federation で統一する |
| Teleport Machine ID / cert-manager 単体 | 証明書発行はするが、SPIFFE の SVID・Workload API・federation の標準には準拠しない |

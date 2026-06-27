# 採用事例・エコシステム

## 誰が使っているか

以下は出典を示せる採用組織のみ。pinned commit のリポジトリ `ADOPTERS.md` と、プロジェクトサイトの testimonial に基づく。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Yahoo | Kubernetes ワークロードセキュリティでの RBAC とサービス認証 | [athenz.io](https://www.athenz.io/) (出典 3) |
| LY Corporation | Yahoo! JAPAN サービスのセキュリティ基盤 | [lycorp.co.jp](https://www.lycorp.co.jp/en/) (出典 4) |
| Vespa.ai | プロジェクトの ADOPTERS ファイルに記載 | [vespa.ai](https://vespa.ai/) (出典 3) |

## 採用のシグナル

2026-06-24 時点の GitHub API による計測 (出典 6):

- Stars: 994
- Forks: 306
- コントリビュータ: 約 109 (`anon=true` ページング上)
- Open issues: 44
- 最新リリース: v1.12.43 (2026-06-19)、活発な 1.12.x ライン上
- CII Best Practices バッジを保持 (project 4681)

## エコシステム

Athenz は主要クラウド (AWS EC2/ECS/Fargate/EKS、GCP GCE/GKE/Run、Azure VM) と CI 系 (GitHub Actions、Buildkite、Harness、Spacelift) 向けの SIA ID プロバイダを同梱する。`libs/go/sia/sds` の SDS 実装で Envoy と連携し、`kubernetes/`・`provider/aws/sia-eks`・`provider/gcp/sia-gke` に Kubernetes 向けのピースを持ち、Athenz ID を AWS 一時クレデンシャルに交換する。`server_common` のサーバ側拡張は DynamoDB・Pulsar・Slack 通知をカバーする。UI は React アプリケーション。

## 代替候補

Athenz は ID 発行 (ZTS) と組み込みの RBAC モデル (ZMS) を 1 つのシステムで併せ持つ点が珍しい。以下の代替はそれぞれその面の一部を担う。

| 代替 | 違い |
| --- | --- |
| SPIFFE/SPIRE | ワークロード ID の発行・検証 (SVID、X.509/JWT) を標準化するが認可/RBAC レイヤを持たない。Athenz は ID に加えロール証明書・アクセストークンも束ねる (出典 1)。 |
| Open Policy Agent | 汎用ポリシーエンジン (Rego) で認可ロジックは強力だが、ID 発行や証明書ライフサイクルは範囲外。Athenz はドメイン特化で両方を含む。 |
| Keycloak | 人間向けの OIDC/SAML SSO を持つユーザ向け IAM。Athenz はサービス間 mTLS とワークロード ID を狙う。 |
| cert-manager | Kubernetes での証明書発行を自動化し CA 連携は近いが、RBAC 認可レイヤを持たない。 |

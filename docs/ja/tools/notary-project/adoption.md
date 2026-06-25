# 採用事例・エコシステム

## 誰が使っているか

Notary Project 署名との出典付きの結びつきがある組織・サービスのみを挙げる。それ以外の名前は dossier で確認できなかったため省く。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Microsoft Azure Container Registry / AKS | 廃止予定の Docker Content Trust の代替として Notary Project 署名を提供。Artifact Signing は GA | [source 6](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-content-trust-deprecation)、[source 7](https://techcommunity.microsoft.com/blog/appsonazureblog/simplifying-image-signing-with-notary-project-and-artifact-signing-ga/4487942) |
| AWS Signer | Notation を使ったコンテナイメージ署名ワークフロー | [source 8](https://docs.aws.amazon.com/signer/latest/developerguide/container-workflow.html) |
| Harbor | Notary Project 署名をアーティファクトと並べてレジストリ保管 | [source 1](https://github.com/notaryproject/notation) |
| Zot registry | Notation 署名を OCI アーティファクトとして保管 | [source 1](https://github.com/notaryproject/notation) |

## 採用のシグナル

GitHub API から 2026-06-24 に計測:

- `notaryproject/notation`: stars 487、forks 95、open issues 66、contributors 40。
- `notaryproject/specifications`: stars 177。
- `notaryproject/notary` (旧 TUF ベース v1。別プロジェクトでありここでは対象外): stars 3286。

CNCF プロジェクトページは Incubating としての受理と、2025 年に完了した 2 回目のセキュリティ監査を記録している ([source 2](https://www.cncf.io/projects/notary-project/))。

## エコシステム

- Ratify (CNCF Sandbox): Kubernetes admission 時に検証を強制する。
- Kyverno: image verification ルール。
- notation-action: GitHub Actions 連携。
- notation-hashicorp-vault: HashiCorp Vault を裏に持つ署名プラグイン。
- ORAS (`oras.land/oras-go/v2`): `notation` が構築するレジストリクライアント (`cmd/notation/registry.go:100`)。
- `tspclient-go` による RFC 3161 タイムスタンプ (`cmd/notation/sign.go:214-230`)。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Sigstore / cosign | OIDC ID・Fulcio の短命証明書・Rekor 透明性ログによるキーレス署名。Notation は標準 X.509 PKI と既存 CA 信頼を土台にし、透明性ログに依存しない ([source 13](https://snyk.io/blog/signing-container-images/)) |
| Docker Content Trust (Notary v1) | TUF ベースで署名を別サーバに保持し、レジストリ間ポータビリティなし、1 イメージ 1 署名。Notation はその後継で、可搬な署名を OCI Referrer として保存する ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)) |

すでに CA や PKI を運用し、レジストリ間でアーティファクトと共に移動する署名が欲しいなら Notation。短命 ID と公開透明性ログによるキーレス署名が欲しいなら Sigstore/cosign を選ぶ。

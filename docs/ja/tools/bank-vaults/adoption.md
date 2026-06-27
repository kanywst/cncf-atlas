# 採用事例・エコシステム

## 誰が使っているか

リポジトリの `ADOPTERS.md` に本番採用組織が記載されている。以下の表は、そのファイルから一部の組織名と各社が報告するユースケースを抜き出したものである (出典: <https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md>)。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Outshift (by Cisco) | Kubernetes 上で Vault をプロビジョニング・設定し、アプリへ secret を注入。 | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |
| Thought Machine | 次世代クラウドネイティブのコアバンキングエンジン (名前も Vault) 向けに Vault をプロビジョニング。 | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |
| Postman | Kubernetes 内で High Availability (HA) の Vault サービスを管理。 | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |
| Vonage | AWS KMS・S3・DynamoDB を使い、クラウドとオンプレのワークロードに secret を提供。raft バックエンドへの移行を予定。 | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |
| Wildlife Studios | 十数クラスタで Vault Secrets Webhook を動かし、vault-env と vault-agent を併用。 | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |
| SHE BASH LLC | 米国防総省の Kubernetes 環境向けに Vault での secret 保管を提供。 | [ADOPTERS.md](https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md) |

ファイル全体には、ほかに Aspect・Mintel・PhishLabs・PITS Global Data Recovery Services・Pulselive・Samarkand Global・Tinkoff・TripleLift・Vase.ai・ViaBill も記載されている。

## 採用のシグナル

GitHub REST API から 2026-06-26 に観測した値: stars 2,257、forks 485、open issues 13、contributor エントリ 213 (匿名込みで 245)。リポジトリ作成は 2018-03-07、最終 push は 2026-06-22。ガバナンスは `MAINTAINERS.md` に記載され、active な maintainer 7 名と alumni 3 名が並ぶ。maintainer は単一ベンダーではなく複数組織に分散している (出典: <https://github.com/bank-vaults/bank-vaults/blob/main/MAINTAINERS.md>)。

## エコシステム

Bank-Vaults は HashiCorp Vault の上に乗り、他の CNCF プロジェクトには依存しない (出典: <https://github.com/cncf/sandbox/issues/54>)。umbrella は CRD 駆動の Vault プロビジョニングを行う [Vault Operator](https://github.com/bank-vaults/vault-operator)、Pod へ secret を注入する [Secrets Webhook](https://github.com/bank-vaults/secrets-webhook)、CLI が import する [Vault SDK](https://github.com/bank-vaults/vault-sdk) を加える。統合先としては、CLI の `--mode` 定数が AWS KMS + S3 / Google Cloud KMS + GCS / Azure Key Vault / Alibaba KMS + OSS / Oracle KMS / remote Vault / Kubernetes Secrets / HSM / ローカルファイルをカバーする (`cmd/bank-vaults/main.go:39`)。`cmd/bank-vaults/metrics.go` で Prometheus メトリクスを公開し、Velero でのバックアップにも対応する。

## 代替候補

最も近い隣接プロジェクトは、secret がどこに着地するかと、ツールが Vault のライフサイクルをどこまで持つかで違う。

| 代替 | 違い |
| --- | --- |
| External Secrets Operator (ESO) | 外部 secret ストアを Kubernetes Secret オブジェクトへ同期する。一方 Bank-Vaults の webhook は secret を Pod のメモリへ直接注入し、Kubernetes Secret を経由しない (出典: <https://bank-vaults.dev/docs/mutating-webhook/>)。 |
| HashiCorp Vault Agent Injector / Vault Secrets Operator | HashiCorp 自身の Pod 注入・同期機構。Bank-Vaults は Vault のプロビジョニングと unseal 自動化も含む、より広いスコープを持つ (比較: <https://bank-vaults.dev/docs/mutating-webhook/webhooks-comparision/>)。 |

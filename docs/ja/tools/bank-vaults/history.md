# 歴史

## 起源

Bank-Vaults は Banzai Cloud で始まった。同社の Kubernetes 基盤 (Pipeline と Hollowtrees) はどれも HashiCorp Vault を使っており、Vault のセットアップロジックが各所にコピーされ続けていた。そこで init・unseal・設定のコードを 1 か所にまとめるべく独立プロジェクトにした。Vault Operator のブログ記事がこの起源と、プロジェクトの看板機能となった KMS による unseal フローを説明している (出典: <https://outshift.cisco.com/blog/vault-operator/>)。

名前はサーフィンの言葉遊びで、README に明記がある。「Bank Vaults」は Mentawai 諸島のサーフスポットで、README は重い鉄の扉・秘密の解錠の組み合わせ・屈強な守衛という銀行金庫の比喩に掛けて secret 管理を説明している。

リポジトリは GitHub 上で 2018-03-07 に `banzaicloud/bank-vaults` として作成された。ソースの著作権表記は「Copyright © 2018 Banzai Cloud」で始まり (例: `internal/vault/operator_client.go:1`)、`NOTICE` ファイルにはこの行に加えて「Copyright © 2021 Cisco Systems, Inc. and/or its affiliates」が記載されている (`NOTICE:1-2`)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2018 | 2018-03-07 に `banzaicloud/bank-vaults` としてリポジトリ作成。ソースの最初の著作権年。 |
| 2021 | Cisco が Banzai Cloud を買収。`NOTICE` に 2 つ目の著作権者が追加。 |
| 2023 | CNCF Sandbox 申請を cncf/sandbox#54 として起票。スポンサーは Cisco。 |
| 2024 | CNCF Sandbox に受理 (受理日 2024-06-18)。 |
| 2026 | リリース v1.33.1 を公開 (2026-05-25)。 |

## どう進化したか

プロジェクトは 2 度、組織を移った。Cisco が Banzai Cloud を買収した後、維持は Outshift by Cisco に移り、リポジトリとドキュメントは `banzaicloud` 名前空間と `banzaicloud.com` から `bank-vaults/bank-vaults` と `bank-vaults.dev` へ移設された (出典: <https://bank-vaults.dev/>、旧リポジトリ: <https://github.com/banzaicloud/bank-vaults>)。

また umbrella プロジェクトに分割された。当初 1 つだったリポジトリは、CLI・Vault Operator・Secrets Webhook (旧 `vault-secrets-webhook`)・Vault SDK の別々のリポジトリに分かれた。このリポジトリの CLI は、自前の Vault クライアントを持たず SDK を外部モジュールとして import している (`cmd/bank-vaults/unseal.go:24`)。

CNCF Sandbox の経緯は cncf/sandbox#54 に記録されている。申請は 2023-08-04 に sagikazarmark が Cisco をスポンサーとして起票し、Sandbox 投票の通過後に issue はクローズされた (出典: <https://github.com/cncf/sandbox/issues/54>)。CNCF は公式の受理日を 2024-06-18 としている (出典: <https://www.cncf.io/projects/bank-vaults/>)。

## 現在地

直近のリリースは 2026-05-25 の v1.33.1 である (出典: <https://github.com/bank-vaults/bank-vaults/releases>)。プロジェクトは CNCF Sandbox の下でガバナンスされ、`MAINTAINERS.md` には active な maintainer 7 名と alumni 3 名が記載され、lead は Mark Sagi-Kazar (sagikazarmark) である。maintainer は Outshift by Cisco を含む複数組織に分散している。より広い umbrella は引き続き Operator・Webhook・SDK を別リポジトリとして開発している。
